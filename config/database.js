const { Pool } = require('pg');
require('dotenv').config();

// Database configuration - prioritize Supabase connection
let dbConfig;

if (process.env.DATABASE_URL) {
  try {
    // Use the DATABASE_URL directly as Supabase provides it pre-formatted
    dbConfig = {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    };
    console.log('Using Supabase DATABASE_URL connection string');
  } catch (error) {
    console.error('Error with DATABASE_URL:', error);
    throw error;
  }
} else {
  dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost', 
    database: process.env.DB_NAME || 'zentro_homes',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
  };
}

// Create connection pool
const pool = new Pool(dbConfig);

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database via', process.env.DATABASE_URL ? 'Supabase' : 'localhost');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
  process.exit(-1);
});

// Helper function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executed:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Query error:', error);
    
    // If it's a connection error, provide a helpful mock response for development
    if (error.code === 'ENOTFOUND' && process.env.NODE_ENV === 'development') {
      console.log('🔧 Mock response for development - database unavailable');
      return {
        rows: [],
        rowCount: 0
      };
    }
    
    throw error;
  }
};

// Helper function to get a client for transactions
const getClient = () => {
  return pool.connect();
};

module.exports = {
  pool,
  query,
  getClient
};