# Vercel Deployment Guide - Zentro Homes (Supabase)</

This guide will help you deploy your Zentro Homes website to Vercel with Supabase as your database and authentication provider.

## Prerequisites

- ✅ GitHub account
- ✅ Vercel account (sign up at [vercel.com](https://vercel.com))
- ✅ Supabase project already set up (database + authentication)
- ✅ Local project configured with Supabase

## Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit for Vercel deployment"

# Add your GitHub repository
git remote add origin https://github.com/yourusername/zentro-homes.git
git push -u origin main
```

## Step 2: Deploy to Vercel

### 2.1 Connect Repository
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import your GitHub repository
4. Select your repository name

### 2.2 Configure Project Settings
In the Vercel deployment screen:

- **Framework Preset:** Other
- **Root Directory:** `.` (leave empty)
- **Build Command:** Leave empty
- **Output Directory:** Leave empty
- **Install Command:** `npm install`

### 2.3 Environment Variables
Click **"Environment Variables"** and add these from your `.env` file:

| Name | Value | Example |
|------|--------|---------|
| `DATABASE_URL` | Your Supabase connection string | `postgresql://postgres.yqs...` |
| `SUPABASE_URL` | Your Supabase project URL | `https://yqskldskeokvgigyrfnw.supabase.co` |
| `SUPABASE_ANON_KEY` | Your Supabase anon key | `eyJhbGciOiJIUzI1...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | `eyJhbGciOiJIUzI1...` |
| `NODE_ENV` | Set to production | `production` |
| `MAX_FILE_SIZE` | File upload limit | `50000000` |
| `MAX_FILES_PER_UPLOAD` | Max files per upload | `20` |

### 2.4 Deploy
1. Click **"Deploy"**
2. Wait for deployment (2-3 minutes)
3. You'll get a URL like: `https://zentro-homes-xxx.vercel.app`

## Step 3: Set Up Database Schema in Supabase

Go to your Supabase SQL Editor and run this schema (updated for your form fields):

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

-- Create property_videos table
CREATE TABLE IF NOT EXISTS property_videos (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title VARCHAR(255),
  duration INTEGER,
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
CREATE INDEX IF NOT EXISTS idx_property_videos_property_id ON property_videos(property_id);
CREATE INDEX IF NOT EXISTS idx_contacts_property_id ON contacts(property_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);

-- Enable Row Level Security (RLS)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to properties
CREATE POLICY "Properties are viewable by everyone" ON properties
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Property images are viewable by everyone" ON property_images
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Property videos are viewable by everyone" ON property_videos
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

CREATE POLICY "Admin can manage property videos" ON property_videos
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

## Step 4: Set Up Admin User

In your Supabase dashboard:

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

## Step 5: Test Your Deployment

### 5.1 Test Public Website
1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Browse properties (should work without authentication)
3. Test contact forms
4. Check responsive design on mobile

### 5.2 Test Admin Panel
1. Go to: `https://your-app.vercel.app/admin`
2. Sign in with your admin credentials
3. Test property creation:
   - Fill out the form with all required fields
   - **Test Image Upload**: Upload multiple property photos
   - **Test Video Upload**: Upload property videos
   - Save the property
4. Verify property appears on public site
5. Test property editing and deletion

### 5.3 Test API Endpoints

```bash
# Test health check
curl https://your-app.vercel.app/api/health

# Test public properties endpoint
curl https://your-app.vercel.app/api/properties

# Test contact submission
curl -X POST https://your-app.vercel.app/api/contacts \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","message":"Test message"}'
```

### 5.4 Video Upload Testing Checklist

✅ **Test Video Upload Process:**
1. Go to admin panel
2. Create/edit a property
3. Upload a video file (MP4, MOV, AVI)
4. Check upload progress indicator
5. Verify video appears in property video list
6. Save property and check if video displays on public site

✅ **Test Video File Types:**
- MP4 videos
- MOV videos
- Different file sizes (within 50MB limit)
- Multiple videos per property

✅ **Test Video Display:**
- Videos show on public property pages
- Video thumbnails generate correctly
- Video playback works in browsers
- Mobile video playback

## Step 6: Custom Domain (Optional)

1. In Vercel dashboard → **Domains**
2. Add your custom domain
3. Follow DNS configuration
4. Update `ALLOWED_ORIGINS` environment variable

## Step 7: Monitoring

### Check Vercel Function Logs
1. Go to Vercel dashboard → Functions
2. Monitor API function performance
3. Check error logs for issues

### Monitor Supabase Usage
1. Supabase dashboard → Settings → Usage
2. Monitor database connections
3. Check storage usage for uploaded files

## Troubleshooting

### Common Issues:

**1. Database Connection Errors**
- Verify `DATABASE_URL` in Vercel environment variables
- Check Supabase allows connections from Vercel

**2. File Upload Issues**
- Check `MAX_FILE_SIZE` and `MAX_FILES_PER_UPLOAD` settings
- Verify file types are allowed
- Check Vercel function timeout (10 seconds on hobby plan)

**3. Authentication Issues**
- Verify admin user has `role: "admin"` in user metadata
- Check `SUPABASE_SERVICE_ROLE_KEY` is correct
- Test authentication in browser network tab

**4. Video Upload Specific Issues**
- Large video files may timeout (upgrade to Vercel Pro for 60s timeout)
- Check video file formats are supported
- Verify video storage configuration

**5. Static Files Not Loading**
- Check `vercel.json` routing configuration
- Verify file paths are correct

## Performance Tips

### For Video Uploads:
- Compress videos before upload
- Use efficient video formats (MP4 H.264)
- Consider video thumbnails for better UX
- Implement video preview before upload

### For Database:
- Use proper indexes (already included in schema)
- Monitor query performance in Supabase
- Enable connection pooling

## Security Checklist

- ✅ Environment variables secure
- ✅ Admin-only endpoints protected
- ✅ File upload limits configured
- ✅ Database RLS policies enabled
- ✅ HTTPS enabled (automatic with Vercel)

## Updates and Maintenance

```bash
# Deploy updates
git add .
git commit -m "Update description"
git push origin main
# Vercel automatically redeploys
```

**Your Zentro Homes website is now live!** 🎉

Access your deployed application:
- **Public Site:** `https://your-app.vercel.app`
- **Admin Panel:** `https://your-app.vercel.app/admin`

The website now supports:
- ✅ Property listings with photos and videos
- ✅ Admin authentication via Supabase
- ✅ File uploads (images and videos)
- ✅ Contact form submissions
- ✅ Responsive design
- ✅ Serverless architecture
- ✅ Global CDN delivery