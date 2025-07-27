const { query, getClient } = require('../config/database');

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
    conditions.push(`p.type = $${currentParamCount}`);
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

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Check if it's a single property request
      const pathParts = req.url.split('/');
      const propertyId = pathParts[pathParts.length - 1];
      
      if (propertyId && !isNaN(propertyId)) {
        // Get single property
        const result = await query(`
          SELECT 
            p.*,
            ARRAY_AGG(
              DISTINCT jsonb_build_object(
                'id', pi.id,
                'url', pi.image_url,
                'is_main', pi.is_main,
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
        `, [propertyId]);

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

        return res.json({
          success: true,
          data: property
        });
      }

      // Get all properties with filters
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
              'is_main', pi.is_main,
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

      return res.json({
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

    } else if (req.method === 'POST') {
      // Verify Clerk authentication for admin operations
      const { createClerkClient } = require('@clerk/clerk-sdk-node');
      const clerkClient = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const token = authHeader.substring(7);
      
      try {
        await clerkClient.verifyToken(token);
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: 'Invalid authentication token'
        });
      }

      // Create new property
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
            title, type, status, price, currency, area, city, country,
            latitude, longitude, bedrooms, bathrooms, parking, size, size_unit,
            description, amenities, year_built, furnished, available
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
          RETURNING *
        `, [
          title, type, status, price, currency, area, city, country,
          latitude, longitude, bedrooms, bathrooms, parking, size, size_unit,
          description, amenities, year_built, furnished, available
        ]);

        const propertyId = propertyResult.rows[0].id;

        // Insert images if provided
        if (images && images.length > 0) {
          for (let i = 0; i < images.length; i++) {
            const image = images[i];
            await client.query(`
              INSERT INTO property_images (property_id, image_url, is_main, alt_text, display_order)
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
                'is_main', pi.is_main,
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

        return res.status(201).json({
          success: true,
          data: property,
          message: 'Property created successfully'
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('Properties API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};