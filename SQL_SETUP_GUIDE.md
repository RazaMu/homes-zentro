# SQL Setup Guide for Zentro Homes

## Migration Overview

This guide outlines the complete migration from Firebase to an SQL-based architecture using PostgreSQL/MySQL with Clerk for admin-only authentication and a Node.js/Express backend.

## Prerequisites
- Node.js (version 18 or higher)
- PostgreSQL or MySQL database
- Clerk account for admin user management
- Git for version control

## Architecture Overview

### New Stack
- **Database**: PostgreSQL/MySQL for property and contact data
- **Authentication**: Clerk for admin user management and authentication only
- **Backend**: Node.js with Express.js API (public + admin routes)
- **Frontend**: Static HTML/CSS/JS with API integration (public site + admin panel)
- **File Storage**: Local file system or cloud storage (AWS S3/Cloudinary)
- **Hosting**: Traditional web hosting or containerized deployment

### Database Schema

#### Properties Table
```sql
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'For Sale',
    price DECIMAL(15,2),
    area INTEGER,
    bedrooms INTEGER,
    bathrooms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255), -- Clerk user ID
    featured BOOLEAN DEFAULT FALSE,
    amenities JSON, -- Store amenities as JSON
    coordinates POINT -- For map integration
);
```

#### Property Images Table
```sql
CREATE TABLE property_images (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    image_path VARCHAR(500), -- Local file path
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Contacts Table
```sql
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    message TEXT NOT NULL,
    property_id INTEGER REFERENCES properties(id),
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    notes TEXT
);
```

#### Users Table (Synchronized with Clerk)
```sql
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY, -- Clerk user ID
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

## Step 1: Backend Setup

### Install Dependencies
```bash
mkdir zentro-backend
cd zentro-backend
npm init -y

# Core dependencies
npm install express cors helmet morgan dotenv
npm install pg mysql2 # Choose one based on your database
npm install @clerk/clerk-sdk-node
npm install multer sharp # For image handling
npm install express-rate-limit express-validator

# Development dependencies
npm install -D nodemon eslint prettier
```

### Environment Configuration
Create `.env` file:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/zentro_homes
# OR for MySQL:
# DATABASE_URL=mysql://username:password@localhost:3306/zentro_homes

# Clerk Configuration (Admin Only)
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=50000000 # 50MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# CORS Configuration
FRONTEND_URL=http://localhost:8080
```

### Database Connection Setup
Create `config/database.js`:
```javascript
const { Pool } = require('pg'); // or mysql2 for MySQL
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = pool;
```

### Express Server Setup
Create `server.js`:
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/properties', require('./routes/properties'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/auth', require('./routes/auth'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Step 2: API Routes Implementation

### Properties API (`routes/properties.js`)
```javascript
const express = require('express');
const router = express.Router();
const { requireAuth } = require('@clerk/clerk-sdk-node');
const multer = require('multer');
const sharp = require('sharp');
const pool = require('../config/database');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: 'uploads/properties/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  }
});

// GET /api/properties - Get all properties with filters (PUBLIC ENDPOINT)
router.get('/', async (req, res) => {
  try {
    const { location, type, status, bedrooms, min_price, max_price, limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT p.*, 
             JSON_AGG(
               JSON_BUILD_OBJECT(
                 'id', pi.id,
                 'url', pi.image_url,
                 'alt_text', pi.alt_text,
                 'is_primary', pi.is_primary
               ) ORDER BY pi.display_order
             ) as images
      FROM properties p
      LEFT JOIN property_images pi ON p.id = pi.property_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (location) {
      paramCount++;
      query += ` AND p.location = $${paramCount}`;
      params.push(location);
    }
    
    if (type) {
      paramCount++;
      query += ` AND p.type = $${paramCount}`;
      params.push(type);
    }
    
    if (status) {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
    }
    
    if (bedrooms) {
      paramCount++;
      query += ` AND p.bedrooms = $${paramCount}`;
      params.push(parseInt(bedrooms));
    }
    
    if (min_price) {
      paramCount++;
      query += ` AND p.price >= $${paramCount}`;
      params.push(parseFloat(min_price));
    }
    
    if (max_price) {
      paramCount++;
      query += ` AND p.price <= $${paramCount}`;
      params.push(parseFloat(max_price));
    }
    
    query += ` GROUP BY p.id ORDER BY p.created_at DESC`;
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(parseInt(offset));
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// POST /api/properties - Create new property (ADMIN ONLY - Clerk authentication required)
router.post('/', requireAuth(), upload.array('images', 10), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      title, description, location, type, status,
      price, area, bedrooms, bathrooms, amenities
    } = req.body;
    
    // Insert property
    const propertyResult = await client.query(`
      INSERT INTO properties (title, description, location, type, status, price, area, bedrooms, bathrooms, amenities, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [title, description, location, type, status, price, area, bedrooms, bathrooms, amenities, req.auth.userId]);
    
    const propertyId = propertyResult.rows[0].id;
    
    // Process and save images
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        
        // Optimize image with Sharp
        const optimizedPath = `uploads/properties/optimized-${file.filename}`;
        await sharp(file.path)
          .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toFile(optimizedPath);
        
        // Save to database
        await client.query(`
          INSERT INTO property_images (property_id, image_url, image_path, is_primary, display_order)
          VALUES ($1, $2, $3, $4, $5)
        `, [propertyId, `/uploads/properties/optimized-${file.filename}`, optimizedPath, i === 0, i]);
      }
    }
    
    await client.query('COMMIT');
    res.status(201).json({ id: propertyId, message: 'Property created successfully' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating property:', error);
    res.status(500).json({ error: 'Failed to create property' });
  } finally {
    client.release();
  }
});

module.exports = router;
```

### Contacts API (`routes/contacts.js`)
```javascript
const express = require('express');
const router = express.Router();
const { requireAuth } = require('@clerk/clerk-sdk-node');
const pool = require('../config/database');

// POST /api/contacts - Submit contact form (PUBLIC ENDPOINT)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message, property_id } = req.body;
    
    const result = await pool.query(`
      INSERT INTO contacts (name, email, phone, message, property_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [name, email, phone, message, property_id]);
    
    res.status(201).json({ 
      id: result.rows[0].id, 
      message: 'Contact form submitted successfully' 
    });
  } catch (error) {
    console.error('Error submitting contact:', error);
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

// GET /api/contacts - Get all contacts (ADMIN ONLY - Clerk authentication required)
router.get('/', requireAuth(), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, p.title as property_title
      FROM contacts c
      LEFT JOIN properties p ON c.property_id = p.id
      ORDER BY c.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

module.exports = router;
```

## Step 3: Frontend Migration

### Shared API Service (`js/api-service.js`)
```javascript
class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Properties API
  async getProperties(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/properties?${params}`);
  }

  async createProperty(formData) {
    return this.request('/properties', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
  }

  async updateProperty(id, formData) {
    return this.request(`/properties/${id}`, {
      method: 'PUT',
      body: formData,
      headers: {}
    });
  }

  async deleteProperty(id) {
    return this.request(`/properties/${id}`, {
      method: 'DELETE'
    });
  }

  // Contacts API
  async submitContact(contactData) {
    return this.request('/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData)
    });
  }

  async getContacts() {
    return this.request('/contacts');
  }
}

export default new ApiService();
```

### Admin-Only Clerk Integration (`js/clerk-auth.js`)
```javascript
import { Clerk } from '@clerk/clerk-js';

const clerk = new Clerk('your_clerk_publishable_key');
await clerk.load();

export class AuthManager {
  constructor() {
    this.clerk = clerk;
    this.init();
  }

  async init() {
    // Check if user is signed in
    if (this.clerk.user) {
      this.onUserSignedIn(this.clerk.user);
    }

    // Listen for sign in events
    this.clerk.addListener('user', (user) => {
      if (user) {
        this.onUserSignedIn(user);
      } else {
        this.onUserSignedOut();
      }
    });
  }

  onUserSignedIn(user) {
    console.log('User signed in:', user);
    // Update UI for authenticated user
    this.updateAuthUI(true);
  }

  onUserSignedOut() {
    console.log('User signed out');
    // Update UI for signed out state
    this.updateAuthUI(false);
  }

  updateAuthUI(isSignedIn) {
    const authElements = document.querySelectorAll('[data-auth-required]');
    authElements.forEach(el => {
      el.style.display = isSignedIn ? 'block' : 'none';
    });

    const signInButton = document.getElementById('sign-in-btn');
    const signOutButton = document.getElementById('sign-out-btn');
    const userProfile = document.getElementById('user-profile');

    if (signInButton) signInButton.style.display = isSignedIn ? 'none' : 'block';
    if (signOutButton) signOutButton.style.display = isSignedIn ? 'block' : 'none';
    if (userProfile) userProfile.style.display = isSignedIn ? 'block' : 'none';
  }

  async signIn() {
    await this.clerk.openSignIn();
  }

  async signOut() {
    await this.clerk.signOut();
  }

  async getToken() {
    return await this.clerk.session?.getToken();
  }

  isSignedIn() {
    return !!this.clerk.user;
  }

  getUser() {
    return this.clerk.user;
  }
}

export default new AuthManager();
```

### Public Property Manager (`js/property-manager.js`)
```javascript
import ApiService from './api-service.js';

class PublicPropertyManager {
  constructor() {
    this.properties = [];
    this.init();
  }

  async init() {
    await this.loadProperties();
    this.renderProperties();
    this.setupEventListeners();
  }

  async loadProperties(filters = {}) {
    try {
      this.properties = await ApiService.getProperties(filters);
    } catch (error) {
      console.error('Failed to load properties:', error);
      this.showError('Failed to load properties. Please try again later.');
    }
  }

  renderProperties() {
    const container = document.getElementById('apartments-grid');
    if (!container) return;

    if (this.properties.length === 0) {
      container.innerHTML = `
        <div class="no-properties">
          <h3>No properties found</h3>
          <p>Try adjusting your search filters</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.properties.map(property => this.createPropertyCard(property)).join('');
  }

  createPropertyCard(property) {
    const mainImage = property.images && property.images.length > 0 
      ? property.images[0].url 
      : '/wp-content/uploads/2025/02/default-property.jpg';
    
    return `
      <div class="unique-card">
        <img src="${mainImage}" alt="${property.title}" class="unique-card-img" loading="lazy">
        <div class="unique-card-price">KSh ${property.price?.toLocaleString() || 'Contact for price'}</div>
        <div class="unique-card-content">
          <h3 class="unique-card-title">${property.title}</h3>
          <p class="unique-card-location">
            <i class="fas fa-map-marker-alt"></i> ${property.location}
          </p>
          <div class="unique-card-features">
            <span><i class="fas fa-bed"></i> ${property.bedrooms || 0} beds</span>
            <span><i class="fas fa-bath"></i> ${property.bathrooms || 0} baths</span>
            <span><i class="fas fa-ruler-combined"></i> ${property.area || 'N/A'} sq ft</span>
          </div>
          <p class="unique-card-desc">${property.description?.substring(0, 100) || ''}...</p>
          <a href="apartment-details.html?id=${property.id}" class="unique-card-btn">View Details</a>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Search functionality
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
      searchButton.addEventListener('click', () => this.handleSearch());
    }

    // Contact form handling
    this.setupContactForm();
  }

  setupContactForm() {
    const form = document.querySelector('.contact-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const contactData = Object.fromEntries(formData.entries());

        try {
          await ApiService.submitContact(contactData);
          this.showSuccess('Thank you! Your message has been sent successfully.');
          e.target.reset();
        } catch (error) {
          console.error('Contact form submission failed:', error);
          this.showError('Failed to send message. Please try again.');
        }
      });
    }
  }

  async handleSearch() {
    // Implement search logic using filters
    const filters = this.getCurrentFilters();
    await this.loadProperties(filters);
    this.renderProperties();
  }

  getCurrentFilters() {
    // Extract filters from form inputs
    return {
      location: document.getElementById('location-select')?.value,
      type: document.getElementById('type-select')?.value,
      bedrooms: document.getElementById('bedrooms-select')?.value,
      // Add more filters as needed
    };
  }

  showSuccess(message) {
    this.showMessage(message, 'success');
  }

  showError(message) {
    this.showMessage(message, 'error');
  }

  showMessage(message, type) {
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
}

// Initialize for public pages
document.addEventListener('DOMContentLoaded', () => {
  new PublicPropertyManager();
});

export default PublicPropertyManager;
```

## Step 4: Database Migration Script

Create `scripts/migrate-from-firebase.js`:
```javascript
// This script helps migrate data from Firebase export to SQL database
const fs = require('fs');
const pool = require('../config/database');

async function migrateData() {
  try {
    // Read Firebase export JSON
    const firebaseData = JSON.parse(fs.readFileSync('./firebase-export.json', 'utf8'));
    
    // Migrate properties
    if (firebaseData.properties) {
      for (const [id, property] of Object.entries(firebaseData.properties)) {
        await pool.query(`
          INSERT INTO properties (title, description, location, type, status, price, area, bedrooms, bathrooms, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          property.title,
          property.description,
          property.location,
          property.type,
          property.status,
          property.price,
          property.area,
          property.bedrooms,
          property.bathrooms,
          new Date(property.createdAt)
        ]);
      }
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateData();
```

## Step 5: Deployment Considerations

### Docker Setup (`Dockerfile`)
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

### Docker Compose (`docker-compose.yml`)
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: zentro_homes
      POSTGRES_USER: zentro_user
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## Step 6: Testing Strategy

### API Testing (`tests/api.test.js`)
```javascript
const request = require('supertest');
const app = require('../server');

describe('Properties API', () => {
  test('GET /api/properties should return properties list', async () => {
    const response = await request(app)
      .get('/api/properties')
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('POST /api/contacts should create contact', async () => {
    const contactData = {
      name: 'Test User',
      email: 'test@example.com',
      message: 'Test message'
    };

    const response = await request(app)
      .post('/api/contacts')
      .send(contactData)
      .expect(201);
    
    expect(response.body.id).toBeDefined();
  });
});
```

## Migration Checklist

- [ ] Set up PostgreSQL/MySQL database
- [ ] Create Clerk account and configure admin authentication
- [ ] Implement Node.js backend with Express (public + admin routes)
- [ ] Create database schema and migrations
- [ ] Implement public API endpoints (properties GET, contacts POST)
- [ ] Implement admin API endpoints with Clerk authentication
- [ ] Update public frontend to use API service (no authentication)
- [ ] Integrate Clerk authentication in admin panel only
- [ ] Migrate existing Firebase data to SQL database
- [ ] Set up file upload handling for admin property management
- [ ] Configure deployment environment
- [ ] Update hosting configuration
- [ ] Test public functionality (no auth required)
- [ ] Test admin functionality (Clerk auth required)
- [ ] Update documentation and deployment guides

## Benefits of New Architecture

1. **Better Performance**: SQL databases offer better query performance for complex filtering
2. **Data Consistency**: ACID compliance ensures data integrity
3. **Cost Effectiveness**: More predictable pricing compared to Firebase
4. **Flexibility**: Full control over database schema and business logic
5. **Advanced Features**: Support for complex queries, joins, and analytics
6. **Easier Backup/Restore**: Standard database backup procedures
7. **Better Integration**: Easier integration with existing business systems
8. **Professional Auth**: Clerk provides enterprise-grade authentication for admin users
9. **Public Performance**: Faster public pages without authentication overhead
10. **Better UX**: Simplified experience for property browsers