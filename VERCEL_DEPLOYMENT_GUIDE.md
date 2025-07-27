# Vercel Deployment Guide for Zentro Homes

This guide will help you deploy your Zentro Homes real estate website to Vercel's serverless platform.

## Prerequisites

- ✅ GitHub account
- ✅ Vercel account (sign up at [vercel.com](https://vercel.com))
- ✅ PostgreSQL database (Supabase, Neon, or similar)
- ✅ Clerk account for authentication (clerk.com)

## Step 1: Database Setup

### Option A: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Get your connection string from Settings → Database
3. Run your migration scripts to create tables

### Option B: Neon
1. Go to [neon.tech](https://neon.tech) and create a new project
2. Get your connection string from the dashboard
3. Run your migration scripts to create tables

### Option C: Railway/PlanetScale
1. Create a new PostgreSQL database
2. Get your connection string
3. Run your migration scripts

## Step 2: Clerk Authentication Setup

1. Go to [clerk.com](https://clerk.com) and create a new application
2. In your Clerk dashboard:
   - Go to **API Keys**
   - Copy your **Publishable Key** and **Secret Key**
   - Note: Use the **live** keys for production deployment

## Step 3: Repository Preparation

### 3.1 Push to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit for Vercel deployment"

# Add your GitHub repository
git remote add origin https://github.com/yourusername/zentro-homes.git
git push -u origin main
```

### 3.2 Verify File Structure
Your repository should have:
```
zentro/
├── api/                    # Serverless functions
│   ├── properties.js
│   ├── contacts.js
│   └── health.js
├── zentrohomes.com/        # Static frontend files
├── config/
│   └── database.js
├── vercel.json             # Vercel configuration
├── .vercelignore
├── .env.example
└── package.json
```

## Step 4: Vercel Deployment

### 4.1 Connect Repository
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import your GitHub repository
4. Select **"zentro-homes"** (or your repository name)

### 4.2 Configure Project Settings
In the Vercel deployment screen:

**Framework Preset:** Other
**Root Directory:** `.` (leave empty)
**Build Command:** Leave empty (static files)
**Output Directory:** Leave empty
**Install Command:** `npm install`

### 4.3 Environment Variables
Click **"Environment Variables"** and add:

| Name | Value | Notes |
|------|--------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | Your database connection string |
| `CLERK_SECRET_KEY` | `sk_live_xxxxx` | From Clerk dashboard |
| `CLERK_PUBLISHABLE_KEY` | `pk_live_xxxxx` | From Clerk dashboard |
| `NODE_ENV` | `production` | Environment setting |

**Important:** Use **live** keys for production, not test keys!

### 4.4 Deploy
1. Click **"Deploy"**
2. Wait for deployment to complete (2-3 minutes)
3. You'll get a URL like: `https://zentro-homes-xxx.vercel.app`

## Step 5: Database Migration

After deployment, you need to set up your database tables:

### 5.1 Connect to Your Database
```bash
# Using psql with your DATABASE_URL
psql "postgresql://user:pass@host:5432/db"
```

### 5.2 Create Tables
Run the SQL from your migration files:

```sql
-- Properties table
CREATE TABLE properties (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'For Sale',
  price DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'KES',
  area VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) DEFAULT 'Kenya',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  bedrooms INTEGER,
  bathrooms INTEGER,
  parking INTEGER DEFAULT 0,
  size INTEGER,
  size_unit VARCHAR(10) DEFAULT 'm²',
  description TEXT,
  amenities JSONB DEFAULT '[]',
  year_built INTEGER,
  furnished BOOLEAN DEFAULT FALSE,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Property images table
CREATE TABLE property_images (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  is_main BOOLEAN DEFAULT FALSE,
  alt_text VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Property videos table
CREATE TABLE property_videos (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  video_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  title VARCHAR(255),
  duration INTEGER,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contacts table
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  message TEXT NOT NULL,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  subject VARCHAR(255) DEFAULT 'Property Inquiry',
  status VARCHAR(20) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_properties_available ON properties(available);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_property_images_property_id ON property_images(property_id);
CREATE INDEX idx_property_videos_property_id ON property_videos(property_id);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_property_id ON contacts(property_id);
```

## Step 6: Frontend Configuration

Update your frontend API calls to use the Vercel domain:

### 6.1 Update API Base URL
In `zentrohomes.com/js/api-service.js`, the base URL should automatically work:
```javascript
// This will automatically use the correct domain
this.baseUrl = window.location.origin + '/api';
```

### 6.2 Admin Panel Access
- **Public Site:** `https://your-app.vercel.app`
- **Admin Panel:** `https://your-app.vercel.app/admin`

## Step 7: Custom Domain (Optional)

### 7.1 Add Custom Domain
1. In Vercel dashboard, go to your project
2. Click **"Domains"**
3. Add your custom domain (e.g., `zentro-homes.com`)
4. Follow DNS configuration instructions

### 7.2 Update Environment Variables
Update `ALLOWED_ORIGINS` to include your custom domain:
```
ALLOWED_ORIGINS=https://zentro-homes.com,https://www.zentro-homes.com
```

## Step 8: Testing Deployment

### 8.1 Test API Endpoints
```bash
# Health check
curl https://your-app.vercel.app/api/health

# Get properties
curl https://your-app.vercel.app/api/properties

# Submit contact (POST)
curl -X POST https://your-app.vercel.app/api/contacts \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Test message"}'
```

### 8.2 Test Frontend
1. Visit your deployed URL
2. Browse properties
3. Test contact forms
4. Test admin panel (requires Clerk authentication)

## Step 9: Monitoring and Maintenance

### 9.1 Vercel Analytics
- Enable analytics in your Vercel dashboard
- Monitor function performance and errors

### 9.2 Database Monitoring
- Monitor your database usage
- Set up alerts for high usage

### 9.3 Regular Updates
```bash
# Deploy updates
git add .
git commit -m "Update description"
git push origin main
# Vercel automatically redeploys
```

## Troubleshooting

### Common Issues

**1. Database Connection Errors**
- Verify `DATABASE_URL` is correct
- Check database allows external connections
- Ensure IP allowlisting includes Vercel's IPs

**2. Clerk Authentication Issues**
- Verify you're using **live** keys, not test keys
- Check CORS settings in Clerk dashboard
- Ensure domain is added to Clerk's allowed origins

**3. Function Timeouts**
- Vercel functions timeout after 10 seconds on hobby plan
- Optimize database queries
- Consider upgrading to Pro plan for 60-second timeout

**4. Build Failures**
- Check `package.json` dependencies
- Verify Node.js version compatibility
- Check build logs in Vercel dashboard

**5. Static Files Not Loading**
- Verify file paths are correct
- Check `vercel.json` routing configuration
- Ensure files are in correct directories

### Environment-Specific Settings

**Development:**
```env
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/zentro_homes_dev
CLERK_SECRET_KEY=sk_test_xxxxx
```

**Production:**
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/zentro_homes
CLERK_SECRET_KEY=sk_live_xxxxx
```

## Security Checklist

- ✅ Use HTTPS (automatic with Vercel)
- ✅ Environment variables properly set
- ✅ Database credentials secure
- ✅ Clerk authentication configured
- ✅ API endpoints properly protected
- ✅ File upload limits configured
- ✅ CORS properly configured

## Performance Optimization

### Database Optimization
- Use connection pooling
- Add proper indexes
- Optimize complex queries

### Frontend Optimization
- Enable Vercel's Edge Network
- Optimize images
- Use proper caching headers

### API Optimization
- Implement response caching
- Minimize database queries
- Use efficient data structures

## Support

For issues:
1. Check Vercel function logs
2. Monitor database performance
3. Review Clerk authentication logs
4. Check browser console for frontend errors

**Deployment Complete!** 🎉 

Your Zentro Homes website is now live on Vercel with:
- ⚡ Serverless backend functions
- 🌐 Global CDN for static files
- 🔒 Secure authentication with Clerk
- 🗄️ PostgreSQL database
- 📱 Responsive design
- 🔧 Easy updates via Git push