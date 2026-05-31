/**
 * APK Rental Management System
 * Apartment Controller
 */

const db = require('../config/database');

// Get all apartments for current user
exports.getMyApartments = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT * FROM apartments 
      WHERE owner_id = $1 AND is_active = TRUE
      ORDER BY created_at DESC
    `;
    
    const result = await db.query(query, [userId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch apartments',
      message: error.message
    });
  }
};

// Get apartment by ID
exports.getApartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT * FROM apartments 
      WHERE id = $1 AND is_active = TRUE
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Apartment not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch apartment'
    });
  }
};

// Get apartment details with units and images
exports.getApartmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get apartment info
    const apartmentQuery = `SELECT * FROM apartments WHERE id = $1 AND is_active = TRUE`;
    const apartment = await db.query(apartmentQuery, [id]);
    
    if (apartment.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Apartment not found'
      });
    }
    
    // Get units
    const unitsQuery = `
      SELECT * FROM apartment_units 
      WHERE apartment_id = $1
      ORDER BY unit_number ASC
    `;
    const units = await db.query(unitsQuery, [id]);
    
    // Get images
    const imagesQuery = `
      SELECT * FROM apartment_images 
      WHERE apartment_id = $1
      ORDER BY sort_order ASC
    `;
    const images = await db.query(imagesQuery, [id]);
    
    const apartmentData = apartment.rows[0];
    apartmentData.units = units.rows;
    apartmentData.images = images.rows;
    
    res.json({
      success: true,
      data: apartmentData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch apartment details'
    });
  }
};

// Create apartment
exports.createApartment = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name, address, city, postal_code, country,
      latitude, longitude, description, total_units, price_per_day
    } = req.body;
    
    const query = `
      INSERT INTO apartments (
        owner_id, name, address, city, postal_code, country,
        latitude, longitude, description, total_units, available_units, price_per_day
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      userId, name, address, city, postal_code, country,
      latitude, longitude, description, total_units, total_units, price_per_day
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Apartment created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create apartment',
      message: error.message
    });
  }
};

// Update apartment
exports.updateApartment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, description, price_per_day, total_units } = req.body;
    
    // Verify ownership
    const ownerCheck = await db.query(
      'SELECT owner_id FROM apartments WHERE id = $1',
      [id]
    );
    
    if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].owner_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to update this apartment'
      });
    }
    
    const query = `
      UPDATE apartments SET name = $1, description = $2, price_per_day = $3, total_units = $4
      WHERE id = $5
      RETURNING *
    `;
    
    const result = await db.query(query, [name, description, price_per_day, total_units, id]);
    
    res.json({
      success: true,
      message: 'Apartment updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update apartment'
    });
  }
};

// Delete apartment
exports.deleteApartment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verify ownership
    const ownerCheck = await db.query(
      'SELECT owner_id FROM apartments WHERE id = $1',
      [id]
    );
    
    if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].owner_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to delete this apartment'
      });
    }
    
    // Soft delete
    await db.query(
      'UPDATE apartments SET is_active = FALSE, deleted_at = NOW() WHERE id = $1',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Apartment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete apartment'
    });
  }
};

// Get apartment units
exports.getApartmentUnits = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT * FROM apartment_units 
      WHERE apartment_id = $1
      ORDER BY unit_number ASC
    `;
    
    const result = await db.query(query, [id]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch units'
    });
  }
};

// Search apartments by city
exports.searchByCity = async (req, res) => {
  try {
    const { city } = req.params;
    
    const query = `
      SELECT * FROM apartments 
      WHERE LOWER(city) = LOWER($1) AND is_active = TRUE
      ORDER BY name ASC
    `;
    
    const result = await db.query(query, [city]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search apartments'
    });
  }
};

// Get active apartments
exports.getActiveApartments = async (req, res) => {
  try {
    const query = `
      SELECT * FROM apartments 
      WHERE status = 'active' AND is_active = TRUE
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    const result = await db.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active apartments'
    });
  }
};
