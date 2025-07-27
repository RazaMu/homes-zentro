// Simple hardcoded admin authentication middleware
const adminAuth = (req, res, next) => {
  try {
    // Get credentials from Authorization header or body
    const authHeader = req.headers.authorization;
    const { username, password } = req.body || {};
    
    let adminUsername, adminPassword;
    
    if (authHeader && authHeader.startsWith('Basic ')) {
      // Decode Basic Auth
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      [adminUsername, adminPassword] = credentials.split(':');
    } else if (username && password) {
      // Use credentials from request body
      adminUsername = username;
      adminPassword = password;
    } else {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide username and password.'
      });
    }
    
    // Hardcoded admin credentials
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'zentro2025';
    
    if (adminUsername !== ADMIN_USERNAME || adminPassword !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Add admin user info to request
    req.user = {
      id: 'admin',
      username: adminUsername,
      role: 'admin'
    };
    
    next();
    
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication system error'
    });
  }
};

// Admin login endpoint
const adminLogin = (req, res) => {
  const { username, password } = req.body;
  
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'zentro2025';
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // Generate a simple session token (in production, use JWT or proper sessions)
    const token = Buffer.from(`${username}:${password}`).toString('base64');
    
    res.json({
      success: true,
      message: 'Login successful',
      token: token,
      user: {
        id: 'admin',
        username: username,
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
};

module.exports = {
  adminAuth,
  adminLogin
};