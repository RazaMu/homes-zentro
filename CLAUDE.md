# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zentro Homes is an SQL-based real estate website for property listings, management, and customer inquiries. The application uses PostgreSQL/MySQL with Clerk authentication for admin users only and a Node.js/Express backend API.

## Development Commands

### Backend Development
```bash
# Start development server
npm run dev

# Start production server
npm start

# Run database migrations
npm run migrate

# Seed database with sample data
npm run seed
```

### Database Commands
```bash
# Connect to PostgreSQL database
psql -U username -d zentro_homes

# Run SQL migrations
npm run db:migrate

# Reset database
npm run db:reset

# Backup database
pg_dump zentro_homes > backup.sql
```

### Dependencies
```bash
# Install backend dependencies
npm install

# Install specific packages
npm install express pg @clerk/clerk-sdk-node multer sharp
```

## Architecture

### Frontend Structure
- **Public Website**: `/zentrohomes.com/` - Static HTML/CSS/JS with API integration (no authentication)
- **Admin Interface**: `/zentrohomes.com/admin/` - Property management dashboard with Clerk authentication
- **Static Assets**: CSS, JavaScript, and media files organized in respective folders

### Backend Services
- **PostgreSQL/MySQL**: Relational database for properties, users, and contacts
- **Node.js/Express**: RESTful API backend with authentication middleware for admin routes
- **Clerk**: Admin-only authentication and management service
- **Local/Cloud Storage**: File storage for property images and videos

### Database Schema
- `properties`: Property listings with metadata, pricing, and relationships
- `property_images`: Image references linked to properties
- `contacts`: Contact form submissions from potential buyers/renters
- `users`: User profiles synchronized with Clerk

### Core API Modules

#### API Service (`zentrohomes.com/js/api-service.js`)
- Centralized API communication class
- Handles properties CRUD operations via REST endpoints
- Contact form submission management
- Error handling and request configuration

#### Property Management (`zentrohomes.com/js/property-manager.js`)
- Public property display and search functionality
- API integration for property data fetching
- Contact form handling with API submission
- No authentication required

#### Admin Authentication (`zentrohomes.com/js/clerk-auth.js`)
- Clerk integration for admin user authentication
- Token management for admin API requests
- Admin UI updates based on authentication state
- Admin sign in/out functionality

#### Admin Interface (`zentrohomes.com/admin/js/admin-property-manager.js`)
- Property CRUD operations for authenticated admin users
- Multi-image upload with progress tracking
- Form validation and data management
- Requires Clerk authentication

### API Endpoints
```
# Public endpoints (no authentication)
GET /api/properties          # Get properties with filters
POST /api/contacts           # Submit contact form

# Admin endpoints (Clerk authentication required)
POST /api/properties         # Create new property
PUT /api/properties/:id      # Update property
DELETE /api/properties/:id   # Delete property
GET /api/contacts            # Get contacts
```

## Development Workflow

### Backend Setup
1. Set up PostgreSQL/MySQL database
2. Configure environment variables in `.env`
3. Run database migrations to create schema
4. Start Node.js server with `npm run dev`

### Public Website Usage
1. Browse properties at main website (no authentication needed)
2. Submit contact forms (no authentication needed)
3. View property details and search/filter properties

### Admin Property Management
1. Access admin interface at `/admin/index.html` with Clerk authentication
2. Properties are stored in SQL database with image file references
3. Images are uploaded to local storage or cloud provider
4. Manage contacts and user inquiries

### API Integration
- Public pages communicate with public API endpoints
- Admin pages use Clerk tokens for authenticated API endpoints
- Properties support complex SQL filtering and joins
- Real-time updates through API polling or WebSocket integration

### Database Operations
- Use SQL queries for complex property searches
- Implement proper indexing for performance
- Handle image uploads with file path references
- Maintain referential integrity with foreign keys

## Configuration Files

### Environment Variables (`.env`)
- Database connection strings
- Clerk authentication keys (for admin functionality only)
- File upload configuration
- Server port and environment settings

### Package Configuration (`package.json`)
- Backend dependencies and scripts
- Development and production configurations
- Database migration scripts

## Common Tasks

### Testing API Endpoints
1. Test public endpoints (properties, contacts) without authentication
2. Test admin endpoints with Clerk authentication tokens
3. Verify admin authentication middleware works correctly
4. Test property creation with image uploads (admin only)
5. Validate contact form submission (public)

### Database Management
1. Monitor query performance with EXPLAIN
2. Create database backups regularly
3. Update schema migrations as needed
4. Optimize indexes for search queries

### Debugging Issues
1. Check server logs for API errors
2. Verify database connections and queries
3. Test Clerk authentication configuration (admin panel only)
4. Monitor file upload functionality (admin only)

## File Locations

- Main website: `zentrohomes.com/index.html` (public, no auth)
- Admin panel: `zentrohomes.com/admin/index.html` (Clerk auth required)
- API service: `zentrohomes.com/js/api-service.js` (shared)
- Public property management: `zentrohomes.com/js/property-manager.js` (no auth)
- Admin authentication: `zentrohomes.com/js/clerk-auth.js` (admin only)
- Admin functionality: `zentrohomes.com/admin/js/admin-property-manager.js` (admin only)
- Backend server: `server.js` (to be created)
- Database migrations: `migrations/` (to be created)
- API routes: `routes/` (to be created)

## Migration Guide

See `SQL_SETUP_GUIDE.md` for detailed instructions on migrating from Firebase to SQL-based architecture with admin-only Clerk authentication.