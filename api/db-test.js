const { query } = require('../config/database');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    // Test database connection
    const result = await query('SELECT NOW() as current_time, version() as db_version');
    
    res.json({ 
      success: true,
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      database: {
        current_time: result.rows[0].current_time,
        version: result.rows[0].db_version
      },
      env: {
        NODE_ENV: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Database connection failed',
      message: error.message,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
      }
    });
  }
};