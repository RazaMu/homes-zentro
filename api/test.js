module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  res.json({ 
    message: 'API is working',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    adminUsername: process.env.ADMIN_USERNAME || 'admin',
    hasAdminPassword: !!process.env.ADMIN_PASSWORD
  });
};