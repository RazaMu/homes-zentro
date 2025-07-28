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
        dbUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
        dbUrlLength: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    console.error('Full error stack:', error.stack);
    
    // Try to parse DATABASE_URL to see what's wrong
    let urlInfo = 'Not available';
    if (process.env.DATABASE_URL) {
      try {
        const url = new URL(process.env.DATABASE_URL);
        urlInfo = {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port,
          pathname: url.pathname,
          hasUsername: !!url.username,
          hasPassword: !!url.password
        };
      } catch (urlError) {
        urlInfo = `URL parsing failed: ${urlError.message}`;
      }
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Database connection failed',
      message: error.message,
      stack: error.stack,
      urlInfo: urlInfo,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
        dbUrlLength: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0
      }
    });
  }
};