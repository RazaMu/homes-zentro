const { query } = require('../config/database');

async function createTables() {
  try {
    console.log('🗄️  Creating database tables...');

    // Create properties table
    await query(`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'For Sale',
        price DECIMAL(15,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'KES',
        area VARCHAR(255) NOT NULL,
        city VARCHAR(255) NOT NULL,
        country VARCHAR(255) DEFAULT 'Kenya',
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        bedrooms INTEGER,
        bathrooms INTEGER,
        parking INTEGER DEFAULT 0,
        size INTEGER,
        size_unit VARCHAR(10) DEFAULT 'm²',
        description TEXT,
        amenities TEXT[], -- Array of amenities
        year_built INTEGER,
        furnished BOOLEAN DEFAULT false,
        available BOOLEAN DEFAULT true,
        date_added DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create property_images table
    await query(`
      CREATE TABLE IF NOT EXISTS property_images (
        id SERIAL PRIMARY KEY,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
        image_url VARCHAR(500) NOT NULL,
        is_main BOOLEAN DEFAULT false,
        alt_text VARCHAR(255),
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create property_videos table
    await query(`
      CREATE TABLE IF NOT EXISTS property_videos (
        id SERIAL PRIMARY KEY,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
        video_url VARCHAR(500) NOT NULL,
        thumbnail_url VARCHAR(500),
        title VARCHAR(255),
        duration INTEGER, -- in seconds
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create contacts table
    await query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        message TEXT NOT NULL,
        property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
        subject VARCHAR(255),
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
      CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
      CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
      CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
      CREATE INDEX IF NOT EXISTS idx_properties_available ON properties(available);
      CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
      CREATE INDEX IF NOT EXISTS idx_property_videos_property_id ON property_videos(property_id);
      CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
      CREATE INDEX IF NOT EXISTS idx_contacts_property_id ON contacts(property_id);
    `);

    // Create updated_at trigger function
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create triggers for updated_at
    await query(`
      DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
      CREATE TRIGGER update_properties_updated_at 
        BEFORE UPDATE ON properties 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await query(`
      DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
      CREATE TRIGGER update_contacts_updated_at 
        BEFORE UPDATE ON contacts 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Database tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  createTables().then(() => {
    console.log('🎉 Migration completed!');
    process.exit(0);
  });
}

module.exports = { createTables };