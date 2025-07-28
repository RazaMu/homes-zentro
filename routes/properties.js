const express = require('express');
const { query, getClient } = require('../config/database');
const { adminAuth } = require('../middleware/admin-auth');
const router = express.Router();

// Helper function to build filter conditions
function buildFilterConditions(filters, paramCount = 0) {
  const conditions = [];
  const params = [];
  let currentParamCount = paramCount;

  const {
    type,
    status,
    min_price,
    max_price,
    bedrooms,
    bathrooms,
    city,
    area,
    search
  } = filters;

  if (type) {
    currentParamCount++;
    conditions.push(`p.property_type = $${currentParamCount}`);
    params.push(type);
  }

  if (status) {
    currentParamCount++;
    conditions.push(`p.status = $${currentParamCount}`);
    params.push(status);
  }

  if (min_price) {
    currentParamCount++;
    conditions.push(`p.price >= $${currentParamCount}`);
    params.push(parseFloat(min_price));
  }

  if (max_price) {
    currentParamCount++;
    conditions.push(`p.price <= $${currentParamCount}`);
    params.push(parseFloat(max_price));
  }

  if (bedrooms) {
    currentParamCount++;
    conditions.push(`p.bedrooms = $${currentParamCount}`);
    params.push(parseInt(bedrooms));
  }

  if (bathrooms) {
    currentParamCount++;
    conditions.push(`p.bathrooms = $${currentParamCount}`);
    params.push(parseInt(bathrooms));
  }

  if (city) {
    currentParamCount++;
    conditions.push(`LOWER(p.city) = LOWER($${currentParamCount})`);
    params.push(city);
  }

  if (area) {
    currentParamCount++;
    conditions.push(`LOWER(p.area) = LOWER($${currentParamCount})`);
    params.push(area);
  }

  if (search) {
    currentParamCount++;
    conditions.push(`(
      LOWER(p.title) LIKE LOWER($${currentParamCount}) OR 
      LOWER(p.description) LIKE LOWER($${currentParamCount}) OR
      LOWER(p.area) LIKE LOWER($${currentParamCount}) OR
      LOWER(p.city) LIKE LOWER($${currentParamCount})
    )`);
    params.push(`%${search}%`);
  }

  return {
    conditions,
    params,
    paramCount: currentParamCount
  };
}

// GET /api/properties - Get all properties with filters (public)
router.get('/', async (req, res) => {
  console.log('Properties GET request received');
  try {
    const {
      type,
      status,
      min_price,
      max_price,
      bedrooms,
      bathrooms,
      city,
      area,
      search,
      limit = 50,
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const filters = {
      type,
      status,
      min_price,
      max_price,
      bedrooms,
      bathrooms,
      city,
      area,
      search
    };

    // Build filter conditions
    const filterResult = buildFilterConditions(filters);
    const whereConditions = filterResult.conditions.length > 0 
      ? ` AND ${filterResult.conditions.join(' AND ')}`
      : '';

    let queryText = `
      SELECT 
        p.*,
        ARRAY_AGG(
          DISTINCT jsonb_build_object(
            'id', pi.id,
            'url', pi.image_url,
            'is_main', pi.is_primary,
            'alt_text', pi.alt_text,
            'display_order', pi.display_order
          )
        ) FILTER (WHERE pi.id IS NOT NULL) as images,
        ARRAY_AGG(
          DISTINCT jsonb_build_object(
            'id', pv.id,
            'url', pv.video_url,
            'thumbnail_url', pv.thumbnail_url,
            'title', pv.title,
            'duration', pv.duration,
            'display_order', pv.display_order
          )
        ) FILTER (WHERE pv.id IS NOT NULL) as videos
      FROM properties p
      LEFT JOIN property_images pi ON p.id = pi.property_id
      LEFT JOIN property_videos pv ON p.id = pv.property_id
      WHERE p.available = true${whereConditions}
      GROUP BY p.id
      ORDER BY p.${sort_by} ${sort_order}
      LIMIT $${filterResult.paramCount + 1}
      OFFSET $${filterResult.paramCount + 2}
    `;

    const params = [...filterResult.params, parseInt(limit), parseInt(offset)];
    const result = await query(queryText, params);

    // Process the results to format images and videos properly
    const properties = result.rows.map(property => ({
      ...property,
      images: property.images?.filter(img => img.id) || [],
      videos: property.videos?.filter(vid => vid.id) || [],
      amenities: property.amenities || []
    }));

    // Get total count for pagination using same filter logic
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM properties p 
      WHERE p.available = true${whereConditions}
    `;

    const countResult = await query(countQuery, filterResult.params);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        properties,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch properties'
    });
  }
});

// GET /api/properties/:id - Get single property (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        p.*,
        ARRAY_AGG(
          DISTINCT jsonb_build_object(
            'id', pi.id,
            'url', pi.image_url,
            'is_main', pi.is_primary,
            'alt_text', pi.alt_text,
            'display_order', pi.display_order
          ) ORDER BY pi.display_order, pi.id
        ) FILTER (WHERE pi.id IS NOT NULL) as images,
        ARRAY_AGG(
          DISTINCT jsonb_build_object(
            'id', pv.id,
            'url', pv.video_url,
            'thumbnail_url', pv.thumbnail_url,
            'title', pv.title,
            'duration', pv.duration,
            'display_order', pv.display_order
          ) ORDER BY pv.display_order, pv.id
        ) FILTER (WHERE pv.id IS NOT NULL) as videos
      FROM properties p
      LEFT JOIN property_images pi ON p.id = pi.property_id
      LEFT JOIN property_videos pv ON p.id = pv.property_id
      WHERE p.id = $1 AND p.available = true
      GROUP BY p.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    const property = {
      ...result.rows[0],
      images: result.rows[0].images?.filter(img => img.id) || [],
      videos: result.rows[0].videos?.filter(vid => vid.id) || [],
      amenities: result.rows[0].amenities || []
    };

    res.json({
      success: true,
      data: property
    });

  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch property'
    });
  }
});

// POST /api/properties - Create new property (admin only)
router.post('/', adminAuth, async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    const {
      title,
      type,
      status = 'For Sale',
      price,
      currency = 'KES',
      area,
      city,
      country = 'Kenya',
      latitude,
      longitude,
      bedrooms,
      bathrooms,
      parking = 0,
      size,
      size_unit = 'm²',
      description,
      amenities = [],
      year_built,
      furnished = false,
      available = true,
      images = [],
      videos = []
    } = req.body;

    // Validate required fields
    if (!title || !type || !price || !area || !city) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, type, price, area, city'
      });
    }

    // Insert property
    const propertyResult = await client.query(`
      INSERT INTO properties (
        title, property_type, status, price, area, city,
        bedrooms, bathrooms, parking, size, 
        description, amenities
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      title, type, status, price, area, city,
      bedrooms, bathrooms, parking, size, 
      description, amenities
    ]);

    const propertyId = propertyResult.rows[0].id;

    // Insert images if provided
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        await client.query(`
          INSERT INTO property_images (property_id, image_url, is_primary, alt_text, display_order)
          VALUES ($1, $2, $3, $4, $5)
        `, [propertyId, image.url, image.is_main || i === 0, image.alt_text || title, image.display_order || i]);
      }
    }

    // Insert videos if provided
    if (videos && videos.length > 0) {
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        await client.query(`
          INSERT INTO property_videos (property_id, video_url, thumbnail_url, title, duration, display_order)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [propertyId, video.url, video.thumbnail_url, video.title || title, video.duration, video.display_order || i]);
      }
    }

    await client.query('COMMIT');

    // Fetch the created property with images and videos
    const createdProperty = await query(`
      SELECT 
        p.*,
        ARRAY_AGG(
          DISTINCT jsonb_build_object(
            'id', pi.id,
            'url', pi.image_url,
            'is_main', pi.is_primary,
            'alt_text', pi.alt_text,
            'display_order', pi.display_order
          ) ORDER BY pi.display_order, pi.id
        ) FILTER (WHERE pi.id IS NOT NULL) as images,
        ARRAY_AGG(
          DISTINCT jsonb_build_object(
            'id', pv.id,
            'url', pv.video_url,
            'thumbnail_url', pv.thumbnail_url,
            'title', pv.title,
            'duration', pv.duration,
            'display_order', pv.display_order
          ) ORDER BY pv.display_order, pv.id
        ) FILTER (WHERE pv.id IS NOT NULL) as videos
      FROM properties p
      LEFT JOIN property_images pi ON p.id = pi.property_id
      LEFT JOIN property_videos pv ON p.id = pv.property_id
      WHERE p.id = $1
      GROUP BY p.id
    `, [propertyId]);

    const property = {
      ...createdProperty.rows[0],
      images: createdProperty.rows[0].images?.filter(img => img.id) || [],
      videos: createdProperty.rows[0].videos?.filter(vid => vid.id) || [],
      amenities: createdProperty.rows[0].amenities || []
    };

    res.status(201).json({
      success: true,
      data: property,
      message: 'Property created successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating property:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create property'
    });
  } finally {
    client.release();
  }
});

// PUT /api/properties/:id - Update property (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      title,
      type,
      status,
      price,
      currency,
      area,
      city,
      country,
      latitude,
      longitude,
      bedrooms,
      bathrooms,
      parking,
      size,
      size_unit,
      description,
      amenities,
      year_built,
      furnished,
      available,
      images = [],
      videos = []
    } = req.body;

    // Check if property exists
    const existingProperty = await client.query('SELECT id FROM properties WHERE id = $1', [id]);
    if (existingProperty.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Update property
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    const fields = {
      title, type, status, price, currency, area, city, country,
      latitude, longitude, bedrooms, bathrooms, parking, size, size_unit,
      description, amenities, year_built, furnished, available
    };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(value);
      }
    }

    if (updateFields.length > 0) {
      paramCount++;
      updateValues.push(id);
      
      await client.query(`
        UPDATE properties 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
      `, updateValues);
    }

    // Update images if provided
    if (images && images.length > 0) {
      // Delete existing images
      await client.query('DELETE FROM property_images WHERE property_id = $1', [id]);
      
      // Insert new images
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        await client.query(`
          INSERT INTO property_images (property_id, image_url, is_main, alt_text, display_order)
          VALUES ($1, $2, $3, $4, $5)
        `, [id, image.url, image.is_main || i === 0, image.alt_text, image.display_order || i]);
      }
    }

    // Update videos if provided
    if (videos && videos.length > 0) {
      // Delete existing videos
      await client.query('DELETE FROM property_videos WHERE property_id = $1', [id]);
      
      // Insert new videos
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        await client.query(`
          INSERT INTO property_videos (property_id, video_url, thumbnail_url, title, duration, display_order)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [id, video.url, video.thumbnail_url, video.title, video.duration, video.display_order || i]);
      }
    }

    await client.query('COMMIT');

    // Fetch updated property
    const updatedProperty = await query(`
      SELECT 
        p.*,
        ARRAY_AGG(
          DISTINCT jsonb_build_object(
            'id', pi.id,
            'url', pi.image_url,
            'is_main', pi.is_primary,
            'alt_text', pi.alt_text,
            'display_order', pi.display_order
          ) ORDER BY pi.display_order, pi.id
        ) FILTER (WHERE pi.id IS NOT NULL) as images,
        ARRAY_AGG(
          DISTINCT jsonb_build_object(
            'id', pv.id,
            'url', pv.video_url,
            'thumbnail_url', pv.thumbnail_url,
            'title', pv.title,
            'duration', pv.duration,
            'display_order', pv.display_order
          ) ORDER BY pv.display_order, pv.id
        ) FILTER (WHERE pv.id IS NOT NULL) as videos
      FROM properties p
      LEFT JOIN property_images pi ON p.id = pi.property_id
      LEFT JOIN property_videos pv ON p.id = pv.property_id
      WHERE p.id = $1
      GROUP BY p.id
    `, [id]);

    const property = {
      ...updatedProperty.rows[0],
      images: updatedProperty.rows[0].images?.filter(img => img.id) || [],
      videos: updatedProperty.rows[0].videos?.filter(vid => vid.id) || [],
      amenities: updatedProperty.rows[0].amenities || []
    };

    res.json({
      success: true,
      data: property,
      message: 'Property updated successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating property:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update property'
    });
  } finally {
    client.release();
  }
});

// DELETE /api/properties/:id - Delete property (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM properties WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete property'
    });
  }
});

module.exports = router;