const { query, getClient } = require('../config/database');

const sampleProperties = [
  {
    title: 'Luxury Villa in Karen',
    type: 'Villa',
    status: 'For Sale',
    price: 25000000,
    currency: 'KES',
    area: 'Karen',
    city: 'Nairobi',
    country: 'Kenya',
    latitude: -1.3195,
    longitude: 36.7076,
    bedrooms: 4,
    bathrooms: 3,
    parking: 2,
    size: 300,
    size_unit: 'm²',
    description: 'Stunning luxury villa in the prestigious Karen area with modern amenities and beautiful garden views.',
    amenities: ['Swimming Pool', 'Garden', 'Security', 'Garage', 'Modern Kitchen'],
    year_built: 2020,
    furnished: true,
    available: true
  },
  {
    title: 'Modern Apartment in Westlands',
    type: 'Apartment',
    status: 'For Rent',
    price: 150000,
    currency: 'KES',
    area: 'Westlands',
    city: 'Nairobi',
    country: 'Kenya',
    latitude: -1.2667,
    longitude: 36.8167,
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    size: 120,
    size_unit: 'm²',
    description: 'Contemporary 2-bedroom apartment in the heart of Westlands with city views.',
    amenities: ['Gym', 'Security', 'Elevator', 'Backup Generator'],
    year_built: 2019,
    furnished: false,
    available: true
  },
  {
    title: 'Townhouse in Kileleshwa',
    type: 'Townhouse',
    status: 'For Sale',
    price: 18000000,
    currency: 'KES',
    area: 'Kileleshwa',
    city: 'Nairobi',
    country: 'Kenya',
    latitude: -1.2884,
    longitude: 36.7872,
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    size: 200,
    size_unit: 'm²',
    description: 'Beautiful 3-bedroom townhouse in a gated community with excellent security.',
    amenities: ['Gated Community', 'Playground', 'Security', 'Garden'],
    year_built: 2018,
    furnished: false,
    available: true
  }
];

const sampleImages = [
  { url: '/uploads/images/sample1.jpg', is_main: true, alt_text: 'Main view', display_order: 0 },
  { url: '/uploads/images/sample2.jpg', is_main: false, alt_text: 'Living room', display_order: 1 },
  { url: '/uploads/images/sample3.jpg', is_main: false, alt_text: 'Kitchen', display_order: 2 }
];

const sampleContacts = [
  {
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+254701234567',
    message: 'I am interested in the luxury villa in Karen. Could you provide more details?',
    subject: 'Property Inquiry - Villa',
    status: 'new'
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@email.com',
    phone: '+254707654321',
    message: 'Looking for a 2-bedroom apartment for rent in Westlands area.',
    subject: 'Rental Inquiry',
    status: 'new'
  }
];

async function seedDatabase() {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    console.log('🌱 Seeding database with sample data...');

    // Clear existing data (in reverse order due to foreign key constraints)
    await client.query('DELETE FROM property_images');
    await client.query('DELETE FROM property_videos');
    await client.query('DELETE FROM contacts');
    await client.query('DELETE FROM properties');
    
    // Reset sequences
    await client.query('ALTER SEQUENCE properties_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE property_images_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE property_videos_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE contacts_id_seq RESTART WITH 1');

    console.log('📝 Inserting sample properties...');
    
    // Insert properties
    for (const property of sampleProperties) {
      const result = await client.query(`
        INSERT INTO properties (
          title, type, status, price, currency, area, city, country,
          latitude, longitude, bedrooms, bathrooms, parking, size, size_unit,
          description, amenities, year_built, furnished, available
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING id
      `, [
        property.title, property.type, property.status, property.price, property.currency,
        property.area, property.city, property.country, property.latitude, property.longitude,
        property.bedrooms, property.bathrooms, property.parking, property.size, property.size_unit,
        property.description, property.amenities, property.year_built, property.furnished, property.available
      ]);

      const propertyId = result.rows[0].id;
      
      // Insert sample images for each property
      for (const image of sampleImages) {
        await client.query(`
          INSERT INTO property_images (property_id, image_url, is_main, alt_text, display_order)
          VALUES ($1, $2, $3, $4, $5)
        `, [propertyId, image.url, image.is_main, image.alt_text, image.display_order]);
      }
      
      console.log(`✅ Created property: ${property.title}`);
    }

    console.log('📞 Inserting sample contacts...');
    
    // Insert contacts
    for (let i = 0; i < sampleContacts.length; i++) {
      const contact = sampleContacts[i];
      const propertyId = i + 1; // Link to first two properties
      
      await client.query(`
        INSERT INTO contacts (name, email, phone, message, property_id, subject, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [contact.name, contact.email, contact.phone, contact.message, propertyId, contact.subject, contact.status]);
      
      console.log(`✅ Created contact: ${contact.name}`);
    }

    await client.query('COMMIT');
    console.log('🎉 Database seeded successfully!');
    
    // Display summary
    const propertiesCount = await client.query('SELECT COUNT(*) FROM properties');
    const contactsCount = await client.query('SELECT COUNT(*) FROM contacts');
    const imagesCount = await client.query('SELECT COUNT(*) FROM property_images');
    
    console.log('\n📊 Seed Summary:');
    console.log(`   Properties: ${propertiesCount.rows[0].count}`);
    console.log(`   Images: ${imagesCount.rows[0].count}`);
    console.log(`   Contacts: ${contactsCount.rows[0].count}`);
    console.log('\n🚀 Ready to start the server!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

// Run seed if called directly
if (require.main === module) {
  seedDatabase().then(() => {
    console.log('✨ Seeding completed!');
    process.exit(0);
  });
}

module.exports = { seedDatabase };