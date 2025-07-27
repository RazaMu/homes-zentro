# Zentro Homes: Complete Supabase Database Migration Guide

This guide will help you migrate from your current PostgreSQL/MySQL setup to use Supabase as your primary database and authentication provider.

## Overview

This migration includes:
- ✅ Supabase database setup with schema migration
- ✅ Authentication migration to Supabase Auth
- ✅ API endpoint updates for Supabase integration
- ✅ Environment configuration
- ✅ Data migration from existing database

## Prerequisites

1. **Supabase Account**: Create account at [supabase.com](https://supabase.com)
2. **Existing Database**: Your current PostgreSQL database with data
3. **Node.js Project**: Your Zentro Homes application

## Step 1: Create Supabase Project

1. **Create New Project**:
   - Go to [app.supabase.com](https://app.supabase.com)
   - Click "New Project"
   - Project name: `zentro-homes`
   - Generate strong database password
   - Select region closest to your users
   - Wait for project initialization (~2 minutes)

2. **Get Your API Keys**:
   - Go to Project Settings → API
   - Copy these values:
     ```
     Project URL: https://your-project.supabase.co
     anon public key: eyJhbGci... (for client-side)
     service_role key: eyJhbGci... (for server-side admin)
     ```

3. **Get Database Connection Details**:
   - Go to Project Settings → Database
   - Copy the connection string:
     ```
     postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```

## Step 2: Update Environment Variables

Replace your `.env` file with Supabase configuration:

```env
# Environment
NODE_ENV=development

# Supabase Database (Primary Database)
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Supabase Authentication & API
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here

# File Upload Configuration
MAX_FILE_SIZE=10485760
MAX_FILES_PER_UPLOAD=10

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

## Step 3: Set Up Database Schema in Supabase

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to **SQL Editor** in your Supabase dashboard
2. Create a new query and run this schema:

```sql
-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  property_type VARCHAR(50) NOT NULL, -- Villa, Apartment, Penthouse, Condo
  status VARCHAR(20) NOT NULL, -- "For Sale" or "For Rent"
  area VARCHAR(255) NOT NULL, -- Area/Location name
  city VARCHAR(100) NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms INTEGER NOT NULL,
  parking INTEGER NOT NULL DEFAULT 0, -- Number of parking spaces
  size INTEGER NOT NULL, -- Size in square meters (m²)
  amenities TEXT, -- Comma-separated amenities
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create property_images table
CREATE TABLE IF NOT EXISTS property_images (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  message TEXT,
  property_id INTEGER REFERENCES properties(id),
  contact_type VARCHAR(50) DEFAULT 'inquiry',
  status VARCHAR(20) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_area ON properties(area);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_contacts_property_id ON contacts(property_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);

-- Enable Row Level Security (RLS)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to properties
CREATE POLICY "Properties are viewable by everyone" ON properties
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Property images are viewable by everyone" ON property_images
  FOR SELECT TO anon, authenticated USING (true);

-- Create policies for admin operations on properties
CREATE POLICY "Admin can manage properties" ON properties
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin');

CREATE POLICY "Admin can manage property images" ON property_images
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin');

-- Create policies for contacts
CREATE POLICY "Anyone can submit contacts" ON contacts
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admin can view contacts" ON contacts
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin');

CREATE POLICY "Admin can manage contacts" ON contacts
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin');
```

### Option B: Using Migration Scripts

1. Update your `scripts/migrate.js` to use Supabase:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Run the schema SQL from above
```

## Step 4: Migrate Existing Data

### Export Data from Current Database

```bash
# Export your current data
pg_dump --data-only --inserts your_current_db > data_export.sql

# Or export specific tables
pg_dump --data-only --inserts -t properties -t property_images -t contacts your_current_db > zentro_data.sql
```

### Import Data to Supabase

1. **Using Supabase SQL Editor**:
   - Open SQL Editor
   - Paste your exported INSERT statements
   - Run the query

2. **Using psql command** (if you have the full connection string):
   ```bash
   psql "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres" < zentro_data.sql
   ```

## Step 5: Update Backend Code

### Update Database Configuration (`config/database.js`)

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;
```

### Update Authentication Middleware

Your existing `middleware/supabase-auth.js` should work with these updates:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabaseAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user has admin role
    const isAdmin = user.user_metadata?.role === 'admin';
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

module.exports = supabaseAuth;
```

## Step 6: Set Up Admin Users

### Method 1: Supabase Dashboard (Recommended)

1. Go to **Authentication → Users**
2. Click **"Add user"**
3. Enter admin email and password
4. Click **"Create user"**
5. Click on the user to edit
6. In **User Metadata**, add:
   ```json
   {
     "role": "admin",
     "first_name": "Admin",
     "last_name": "User"
   }
   ```

### Method 2: Programmatically

```javascript
// In your Node.js application
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create admin user
const createAdminUser = async () => {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@zentro.com',
    password: 'secure_password',
    user_metadata: {
      role: 'admin',
      first_name: 'Admin',
      last_name: 'User'
    }
  });
  
  if (error) console.error('Error creating admin:', error);
  else console.log('Admin user created:', data);
};
```

## Step 7: Update Frontend Code

### Update API Service (`zentrohomes.com/js/api-service.js`)

```javascript
class APIService {
  constructor() {
    this.baseURL = '/api';
    this.supabase = window.supabase?.createClient(
      'YOUR_SUPABASE_URL',
      'YOUR_SUPABASE_ANON_KEY'
    );
  }

  async makeRequest(endpoint, options = {}) {
    // Get auth token if user is signed in
    const { data: { session } } = await this.supabase.auth.getSession();
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token && {
          'Authorization': `Bearer ${session.access_token}`
        })
      }
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...defaultOptions,
      ...options,
      headers: { ...defaultOptions.headers, ...options.headers }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Rest of your API methods...
}
```

### Update Admin Authentication

Add to your admin HTML files:

```html
<!-- Add Supabase client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  // Initialize Supabase client
  const supabase = window.supabase.createClient(
    'YOUR_SUPABASE_URL',
    'YOUR_SUPABASE_ANON_KEY'
  );
</script>
```

## Step 8: Test Your Migration

### 1. Test Database Connection

```bash
# Test with Node.js
node -e "
const pool = require('./config/database.js');
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Database error:', err);
  else console.log('Database connected:', res.rows[0]);
  process.exit();
});
"
```

### 2. Test API Endpoints

```bash
# Test public endpoints
curl http://localhost:3000/api/properties
curl -X POST http://localhost:3000/api/contacts -H "Content-Type: application/json" -d '{"name":"Test","email":"test@example.com","message":"Test message"}'

# Test admin endpoints (after getting auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/properties
```

### 3. Test Admin Authentication

1. Go to `/admin/index.html`
2. Sign in with your admin credentials
3. Verify you can access admin features
4. Test creating/editing properties

## Step 9: Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
SUPABASE_ANON_KEY=your_production_anon_key
```

### Update Frontend URLs

Replace development URLs with production URLs in your JavaScript files.

## Benefits of Using Supabase as Primary Database

1. **Integrated Solution**: Database + Auth + Storage + Realtime
2. **Automatic Backups**: Built-in backup and point-in-time recovery
3. **Scalability**: Automatic scaling based on usage
4. **Real-time Features**: Built-in WebSocket support
5. **Dashboard**: Easy database management interface
6. **Security**: Row Level Security (RLS) built-in
7. **Cost-Effective**: Generous free tier, pay-as-you-scale

## Troubleshooting

### Common Issues:

1. **Connection Issues**:
   - Verify DATABASE_URL format is correct
   - Check if connection pooling is enabled
   - Ensure SSL settings are correct

2. **Authentication Errors**:
   - Verify SUPABASE_SERVICE_ROLE_KEY is correct
   - Check user metadata has `role: "admin"`
   - Ensure RLS policies are set correctly

3. **CORS Errors**:
   - Update ALLOWED_ORIGINS in environment
   - Check Supabase project CORS settings

4. **Performance Issues**:
   - Use connection pooling
   - Check database indexes
   - Monitor query performance in Supabase dashboard

## Next Steps

After successful migration:

1. **Monitor Performance**: Use Supabase dashboard analytics
2. **Set Up Backups**: Configure automatic backups
3. **Security Review**: Review RLS policies and user roles
4. **Documentation**: Update project documentation
5. **Remove Old Dependencies**: Clean up old database code

## Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Migration Checklist:**
- [ ] Supabase project created
- [ ] Environment variables updated
- [ ] Database schema migrated
- [ ] Data imported successfully
- [ ] Admin users created
- [ ] API endpoints updated
- [ ] Frontend authentication updated
- [ ] Testing completed
- [ ] Production deployment ready

**Status**: ✅ Complete Migration Guide | 🚀 Ready for Implementation