const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Middleware to verify Supabase authentication for admin routes
const supabaseAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid bearer token.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token is required'
      });
    }

    // Verify token with Supabase
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired authentication token'
        });
      }

      // Add user info to request object
      req.user = {
        id: user.id,
        email: user.email,
        firstName: user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0],
        lastName: user.user_metadata?.last_name || user.user_metadata?.name?.split(' ')[1],
        imageUrl: user.user_metadata?.avatar_url,
        role: user.user_metadata?.role || 'user'
      };

      // Optional: Check if user has admin role
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions. Admin access required.'
        });
      }

      next();
      
    } catch (supabaseError) {
      console.error('Supabase verification error:', supabaseError);
      
      return res.status(500).json({
        success: false,
        error: 'Authentication verification failed'
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication system error'
    });
  }
};

// Optional auth middleware - doesn't fail if no token provided
const optionalSupabaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No auth provided, continue without user
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        // Token invalid, but don't fail - just continue without user
        req.user = null;
      } else {
        req.user = {
          id: user.id,
          email: user.email,
          firstName: user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0],
          lastName: user.user_metadata?.last_name || user.user_metadata?.name?.split(' ')[1],
          imageUrl: user.user_metadata?.avatar_url,
          role: user.user_metadata?.role || 'user'
        };
      }

    } catch (supabaseError) {
      // Token invalid, but don't fail - just continue without user
      req.user = null;
    }

    next();

  } catch (error) {
    // Any other error, continue without user
    req.user = null;
    next();
  }
};

module.exports = {
  supabaseAuth,
  optionalSupabaseAuth,
  supabase
};