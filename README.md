# Zentro Homes - Real Estate Management System

A full-stack real estate website with property listings, admin management, and customer inquiries built with Node.js/Express backend and PostgreSQL database.

## Features

### Public Website
- Browse property listings with advanced filtering
- Property details with image galleries and videos
- Contact form for inquiries
- Responsive design for all devices
- SEO-optimized property pages

### Admin Dashboard
- **CRUD Operations**: Create, Read, Update, Delete properties
- **Media Management**: Upload and manage property images/videos
- **Contact Management**: View and manage customer inquiries
- **Authentication**: Clerk-based admin authentication
- **Dashboard Analytics**: Property statistics and insights

### Backend API
- RESTful API with comprehensive endpoints
- PostgreSQL database with optimized schema
- File upload handling with image processing
- Admin authentication middleware
- Rate limiting and security features

## Tech Stack

- **Frontend**: HTML5, CSS3 (Tailwind), Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: Clerk (Admin only)
- **Image Processing**: Sharp
- **File Upload**: Multer
- **Security**: Helmet, CORS, Rate Limiting

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone and setup**
   ```bash
   cd zentro
   npm install
   ```

2. **Database setup**
   ```bash
   # Create PostgreSQL database
   createdb zentro_homes
   
   # Run migrations
   npm run migrate
   
   # Seed with sample data (optional)
   npm run seed
   ```

3. **Environment configuration**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your settings:
   # - Database credentials
   # - Clerk authentication keys (for admin)
   # - Server port
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Access the application**
   - Website: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin
   - API: http://localhost:3000/api

## API Endpoints

### Properties (Public)
```
GET    /api/properties          # Get properties with filters
GET    /api/properties/:id      # Get single property
```

### Properties (Admin)
```
POST   /api/properties          # Create property
PUT    /api/properties/:id      # Update property
DELETE /api/properties/:id      # Delete property
```

### Contacts
```
POST   /api/contacts            # Submit contact form (public)
GET    /api/contacts            # Get contacts (admin)
PUT    /api/contacts/:id        # Update contact status (admin)
DELETE /api/contacts/:id        # Delete contact (admin)
```

### Media Upload (Admin)
```
POST   /api/upload/property-media     # Upload property media
DELETE /api/upload/image/:id          # Delete image
DELETE /api/upload/video/:id          # Delete video
GET    /api/upload/property/:id/media # Get property media
```

## Database Schema

### Properties Table
- Basic property information (title, type, status, price)
- Location details (area, city, coordinates)
- Property features (bedrooms, bathrooms, size)
- Metadata (description, amenities, year built)

### Property Images/Videos
- Linked media files with display ordering
- Main image designation for listings
- Thumbnail generation for images

### Contacts
- Customer inquiry submissions
- Linked to properties for context
- Status tracking for admin management

## Admin Authentication Setup

1. **Create Clerk Application**
   - Sign up at https://clerk.com
   - Create a new application
   - Get your publishable and secret keys

2. **Configure Environment**
   ```env
   CLERK_SECRET_KEY=your_secret_key_here
   CLERK_PUBLISHABLE_KEY=your_publishable_key_here
   ```

3. **Frontend Integration**
   - Include Clerk JavaScript SDK in admin pages
   - Implement sign-in/sign-out functionality
   - Store auth tokens for API requests

## Development Commands

```bash
# Start development server with auto-reload
npm run dev

# Run database migrations
npm run migrate

# Seed database with sample data
npm run seed

# Reset database (careful!)
npm run db:reset

# Connect to database
psql -d zentro_homes
```

## File Structure

```
zentro/
├── config/
│   └── database.js         # Database connection
├── middleware/
│   └── auth.js            # Clerk authentication
├── routes/
│   ├── properties.js      # Property CRUD endpoints
│   ├── contacts.js        # Contact form endpoints
│   └── upload.js          # File upload endpoints
├── scripts/
│   ├── migrate.js         # Database migrations
│   └── seed.js            # Sample data seeding
├── zentrohomes.com/
│   ├── admin/             # Admin dashboard
│   ├── js/
│   │   ├── api-service.js # Frontend API client
│   │   └── ...           # Other frontend scripts
│   └── ...               # Public website files
├── uploads/               # Uploaded media files
├── server.js             # Main server file
├── package.json          # Dependencies and scripts
└── .env                  # Environment configuration
```

## Production Deployment

1. **Environment Setup**
   ```env
   NODE_ENV=production
   DB_HOST=your_production_db_host
   CLERK_SECRET_KEY=your_production_clerk_key
   ```

2. **Database Migration**
   ```bash
   npm run migrate
   ```

3. **Start Production Server**
   ```bash
   npm start
   ```

4. **Reverse Proxy Setup** (nginx example)
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## Security Features

- **Authentication**: Clerk-based admin authentication
- **Rate Limiting**: API request throttling
- **CORS**: Cross-origin request protection
- **Input Validation**: Request data validation
- **File Upload Security**: Type and size restrictions
- **SQL Injection Prevention**: Parameterized queries

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For support and questions:
- Check the documentation in this README
- Review the API endpoints and examples
- Check the sample data structure in `scripts/seed.js`

## License

MIT License - see LICENSE file for details