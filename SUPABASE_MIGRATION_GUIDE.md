# Zentro Homes: Clerk to Supabase Migration Guide

This guide will help you migrate from Clerk authentication to Supabase authentication for the Zentro Homes admin panel.

## Overview

The migration includes:
- ✅ Backend authentication middleware (Supabase replaces Clerk)
- ✅ API route updates (properties and contacts)
- ✅ Frontend authentication client
- ✅ Environment variable updates
- ⚠️ Admin user setup (manual step required)

## Prerequisites

1. **Supabase Account**: Create an account at [supabase.com](https://supabase.com)
2. **Supabase Project**: Create a new project for Zentro Homes
3. **Database**: Your existing PostgreSQL database (no changes needed)

## Step 1: Set Up Supabase Project

1. **Create a Supabase Project**:
   - Go to [app.supabase.com](https://app.supabase.com)
   - Click "New Project"
   - Choose your organization
   - Enter project name: "zentro-homes"
   - Generate a secure database password
   - Select a region close to your users

2. **Get API Keys**:
   - Go to Project Settings → API
   - Copy the following keys:
     - `Project URL` (SUPABASE_URL)
     - `anon public` key (SUPABASE_ANON_KEY)
     - `service_role` key (SUPABASE_SERVICE_ROLE_KEY)

## Step 2: Update Environment Variables

1. **Update your `.env` file** with Supabase credentials:
   ```env
   # Remove Clerk variables
   # CLERK_SECRET_KEY=...
   # CLERK_PUBLISHABLE_KEY=...

   # Add Supabase variables
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   SUPABASE_ANON_KEY=your_anon_key_here
   ```

2. **Keep your existing database variables** (no changes needed):
   ```env
   DATABASE_URL=postgresql://username:password@hostname:5432/zentro_homes
   ```

## Step 3: Update Backend Routes

The following files have been updated to use Supabase authentication:

### Modified Files:
- ✅ `middleware/supabase-auth.js` - New Supabase authentication middleware
- ✅ `routes/properties.js` - Updated to use `supabaseAuth` middleware
- ✅ `routes/contacts.js` - Updated to use `supabaseAuth` middleware

### Backup Files Created:
- `routes/properties-clerk-backup.js` - Original Clerk version (backup)
- `routes/contacts-clerk-backup.js` - Original Clerk version (backup)

## Step 4: Update Frontend Authentication

### New Files Created:
- ✅ `zentrohomes.com/js/supabase-auth.js` - Supabase authentication client

### Update Admin HTML Files:

1. **Add Supabase CDN** to your admin HTML files:
   ```html
   <!-- Add this before your existing scripts -->
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="/js/supabase-auth.js"></script>
   ```

2. **Update JavaScript Files** that use Clerk:
   - Replace `window.clerkAuth` with `window.supabaseAuth`
   - Update API calls to use the new authentication methods

## Step 5: Set Up Admin Users

Since Supabase doesn't automatically know who should be an admin, you need to set up admin users:

### Method 1: Using Supabase Dashboard (Recommended)

1. **Go to Authentication → Users** in your Supabase dashboard
2. **Create a new user** or update an existing user
3. **Add user metadata**:
   ```json
   {
     "role": "admin",
     "first_name": "Admin",
     "last_name": "User"
   }
   ```

### Method 2: Using SQL (Advanced)

Run this SQL in your Supabase SQL Editor:
```sql
-- Update user metadata for admin role
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{role}', 
  '"admin"'
)
WHERE email = 'your-admin-email@domain.com';
```

## Step 6: Authentication Flow Changes

### Sign In Process:
```javascript
// Old Clerk way
const result = await clerk.signIn.create({
  identifier: email,
  password: password
});

// New Supabase way
const result = await supabaseAuth.signIn(email, password);
```

### API Requests:
```javascript
// Old Clerk way
const response = await fetch('/api/properties', {
  headers: {
    'Authorization': `Bearer ${await clerk.session.getToken()}`
  }
});

// New Supabase way
const response = await supabaseAuth.makeAuthenticatedRequest('/api/properties');
```

## Step 7: Remove Clerk Dependencies (Optional)

After successful migration and testing:

1. **Remove Clerk from package.json**:
   ```bash
   npm uninstall @clerk/clerk-sdk-node
   ```

2. **Remove old authentication files**:
   - `middleware/auth.js` (Clerk version)
   - Any Clerk-related frontend scripts

3. **Clean up environment variables**:
   - Remove `CLERK_SECRET_KEY`
   - Remove `CLERK_PUBLISHABLE_KEY`

## Step 8: Testing the Migration

1. **Test Admin Sign In**:
   - Go to `/admin`
   - Try signing in with your admin credentials
   - Verify you can access the admin panel

2. **Test API Endpoints**:
   - Create a new property (POST /api/properties)
   - Update a property (PUT /api/properties/:id)
   - Delete a property (DELETE /api/properties/:id)
   - View contacts (GET /api/contacts)

3. **Test Public Endpoints** (should work without changes):
   - View properties (GET /api/properties)
   - Submit contact form (POST /api/contacts)

## Troubleshooting

### Common Issues:

1. **"Authentication required" errors**:
   - Check that SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set correctly
   - Verify the user has `role: "admin"` in their user metadata

2. **"Invalid token" errors**:
   - Make sure you're using the correct Supabase project URL
   - Check that the service role key is valid

3. **"User does not have admin role"**:
   - Verify user metadata contains `"role": "admin"`
   - Check user setup in Step 5

4. **Frontend authentication not working**:
   - Make sure Supabase CDN is loaded before your auth scripts
   - Update the SUPABASE_URL and SUPABASE_ANON_KEY in the frontend client
   - Check browser console for JavaScript errors

### Configuration Check:

Verify your configuration with this checklist:
- [ ] Supabase project created
- [ ] Environment variables updated
- [ ] Admin user created with proper role
- [ ] Frontend scripts updated
- [ ] API endpoints tested
- [ ] Public endpoints still working

## Benefits of Supabase vs Clerk

- **Cost**: Supabase has a generous free tier
- **Control**: Full control over user data and authentication
- **Integration**: Native PostgreSQL integration
- **Open Source**: Supabase is open source
- **Features**: Built-in database, storage, and real-time subscriptions

## Next Steps

After successful migration:
1. Update your deployment environment variables
2. Test thoroughly in production
3. Update any documentation or README files
4. Consider removing Clerk backup files after confirming everything works

## Support

If you encounter issues during migration:
1. Check the browser console for JavaScript errors
2. Check server logs for authentication errors
3. Verify all environment variables are set correctly
4. Test with a fresh browser session (clear cookies/cache)

---

**Migration Status**: ✅ Backend Complete | ⚠️ Manual Setup Required | 🧪 Testing Needed