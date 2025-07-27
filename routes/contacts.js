const express = require('express');
const { query } = require('../config/database');
const { adminAuth } = require('../middleware/admin-auth');
const router = express.Router();

// POST /api/contacts - Submit contact form (public)
router.post('/', async (req, res) => {
  try {
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

    res.status(201).json({
      success: true,
      data: contact,
      message: 'Contact form submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit contact form'
    });
  }
});

// GET /api/contacts - Get all contacts (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
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

    res.json({
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

  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contacts'
    });
  }
});

// GET /api/contacts/:id - Get single contact (admin only)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

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
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact'
    });
  }
});

// PUT /api/contacts/:id - Update contact status (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
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
    `, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Contact status updated successfully'
    });

  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update contact'
    });
  }
});

// DELETE /api/contacts/:id - Delete contact (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM contacts WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete contact'
    });
  }
});

module.exports = router;