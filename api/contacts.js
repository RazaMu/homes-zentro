const { query } = require('../config/database');

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
    if (req.method === 'POST') {
      // Submit contact form (public)
      const {
        name,
        email,
        phone,
        message,
        property_id,
        subject = 'Property Inquiry'
      } = req.body;

      // Validate required fields
      if (!name || !email || !message) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, email, message'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }

      // Insert contact
      const result = await query(`
        INSERT INTO contacts (name, email, phone, message, property_id, subject, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'new')
        RETURNING *
      `, [name, email, phone, message, property_id, subject]);

      const contact = result.rows[0];

      return res.status(201).json({
        success: true,
        data: contact,
        message: 'Contact form submitted successfully'
      });

    } else if (req.method === 'GET') {
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

      // Check if it's a single contact request
      const pathParts = req.url.split('/');
      const contactId = pathParts[pathParts.length - 1];
      
      if (contactId && !isNaN(contactId)) {
        // Get single contact
        const result = await query(`
          SELECT 
            c.*,
            p.title as property_title,
            p.area as property_area,
            p.city as property_city,
            p.price as property_price,
            p.type as property_type
          FROM contacts c
          LEFT JOIN properties p ON c.property_id = p.id
          WHERE c.id = $1
        `, [contactId]);

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Contact not found'
          });
        }

        return res.json({
          success: true,
          data: result.rows[0]
        });
      }

      // Get all contacts with filters
      const {
        status,
        property_id,
        limit = 50,
        offset = 0,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      let queryText = `
        SELECT 
          c.*,
          p.title as property_title,
          p.area as property_area,
          p.city as property_city
        FROM contacts c
        LEFT JOIN properties p ON c.property_id = p.id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 0;

      // Add filters
      if (status) {
        paramCount++;
        queryText += ` AND c.status = $${paramCount}`;
        params.push(status);
      }

      if (property_id) {
        paramCount++;
        queryText += ` AND c.property_id = $${paramCount}`;
        params.push(parseInt(property_id));
      }

      // Order and pagination
      queryText += ` ORDER BY c.${sort_by} ${sort_order}`;

      paramCount++;
      queryText += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit));

      paramCount++;
      queryText += ` OFFSET $${paramCount}`;
      params.push(parseInt(offset));

      const result = await query(queryText, params);

      // Get total count for pagination
      let countQuery = `SELECT COUNT(*) as total FROM contacts c WHERE 1=1`;
      const countParams = [];
      let countParamCount = 0;

      if (status) {
        countParamCount++;
        countQuery += ` AND c.status = $${countParamCount}`;
        countParams.push(status);
      }

      if (property_id) {
        countParamCount++;
        countQuery += ` AND c.property_id = $${countParamCount}`;
        countParams.push(parseInt(property_id));
      }

      const countResult = await query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      return res.json({
        success: true,
        data: {
          contacts: result.rows,
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
            totalPages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } else if (req.method === 'PUT') {
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

      // Update contact status
      const pathParts = req.url.split('/');
      const contactId = pathParts[pathParts.length - 1];
      const { status } = req.body;

      // Validate status
      const validStatuses = ['new', 'in_progress', 'responded', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
        });
      }

      const result = await query(`
        UPDATE contacts 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [status, contactId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Contact not found'
        });
      }

      return res.json({
        success: true,
        data: result.rows[0],
        message: 'Contact status updated successfully'
      });

    } else if (req.method === 'DELETE') {
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

      // Delete contact
      const pathParts = req.url.split('/');
      const contactId = pathParts[pathParts.length - 1];

      const result = await query('DELETE FROM contacts WHERE id = $1 RETURNING id', [contactId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Contact not found'
        });
      }

      return res.json({
        success: true,
        message: 'Contact deleted successfully'
      });

    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('Contacts API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};