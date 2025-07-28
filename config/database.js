const { Pool } = require('pg');
require('dotenv').config();

// Database configuration - prioritize Supabase connection
let dbConfig;

if (process.env.DATABASE_URL) {
  try {
    // Parse the DATABASE_URL manually to avoid parsing issues
    const url = new URL(process.env.DATABASE_URL);
    dbConfig = {
      user: url.username,
      password: url.password,
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // Remove leading slash
      ssl: {
        rejectUnauthorized: false
      }
    };
    console.log('Using parsed DATABASE_URL for connection');
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error);
    // Fallback to connection string
    dbConfig = {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    };
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