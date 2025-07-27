const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const propertyRoutes = require('./routes/properties');
const contactRoutes = require('./routes/contacts');
const uploadRoutes = require('./routes/upload');
const { adminAuth, adminLogin } = require('./middleware/admin-auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration - include Vercel domain
const allowedOrigins = [
  'http://localhost:3000', 
  'http://127.0.0.1:3000', 
  'http://localhost:8080', 
  'http://127.0.0.1:8080',
  'https://zentro-homes.vercel.app'  // Add your Vercel domain
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'zentrohomes.com')));

// Admin authentication routes
app.post('/api/admin/login', adminLogin);
app.get('/api/admin/verify', adminAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// API routes
app.use('/api/properties', propertyRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Serve admin interface
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'zentrohomes.com', 'admin', 'index.html'));
});

// Serve main website
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'zentrohomes.com', 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Zentro Homes server running on port ${PORT}`);
  console.log(`📱 Website: http://localhost:${PORT}`);
  console.log(`⚡ Admin: http://localhost:${PORT}/admin`);
  console.log(`🔧 API: http://localhost:${PORT}/api`);
  console.log(`🔑 Admin credentials: ${process.env.ADMIN_USERNAME || 'admin'} / ${process.env.ADMIN_PASSWORD || 'zentro2025'}`);
});

module.exports = app;