const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { query } = require('../config/database');
const { adminAuth } = require('../middleware/admin-auth');
const router = express.Router();

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '..', 'uploads');
const imagesDir = path.join(uploadDir, 'images');
const videosDir = path.join(uploadDir, 'videos');
const thumbnailsDir = path.join(uploadDir, 'thumbnails');

async function ensureDirectories() {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.mkdir(imagesDir, { recursive: true });
    await fs.mkdir(videosDir, { recursive: true });
    await fs.mkdir(thumbnailsDir, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directories:', error);
  }
}

ensureDirectories();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, imagesDir);
    } else if (file.mimetype.startsWith('video/')) {
      cb(null, videosDir);
    } else {
      cb(new Error('Invalid file type'), null);
    }
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${randomString}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

// POST /api/upload/property-media - Upload images and videos for a property (admin only)
router.post('/property-media', adminAuth, upload.array('files', 20), async (req, res) => {
  try {
    const { property_id } = req.body;
    
    if (!property_id) {
      return res.status(400).json({
        success: false,
        error: 'Property ID is required'
      });
    }

    // Verify property exists
    const propertyCheck = await query('SELECT id FROM properties WHERE id = $1', [property_id]);
    if (propertyCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const uploadedFiles = [];
    const errors = [];

    for (const file of req.files) {
      try {
        let fileUrl = `/uploads/${file.mimetype.startsWith('image/') ? 'images' : 'videos'}/${file.filename}`;
        let thumbnailUrl = null;

        if (file.mimetype.startsWith('image/')) {
          // Process image - create thumbnail and optimize
          const thumbnailFilename = `thumb_${file.filename}`;
          const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
          
          // Create thumbnail
          await sharp(file.path)
            .resize(300, 300, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);

          // Optimize original image
          await sharp(file.path)
            .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toFile(file.path + '_optimized');

          // Replace original with optimized version
          await fs.rename(file.path + '_optimized', file.path);

          thumbnailUrl = `/uploads/thumbnails/${thumbnailFilename}`;

          // Insert into property_images table
          const result = await query(`
            INSERT INTO property_images (property_id, image_url, alt_text, display_order)
            VALUES ($1, $2, $3, (SELECT COALESCE(MAX(display_order), -1) + 1 FROM property_images WHERE property_id = $1))
            RETURNING *
          `, [property_id, fileUrl, file.originalname]);

          uploadedFiles.push({
            type: 'image',
            id: result.rows[0].id,
            filename: file.filename,
            originalName: file.originalname,
            url: fileUrl,
            thumbnailUrl,
            size: file.size
          });

        } else if (file.mimetype.startsWith('video/')) {
          // For videos, we'll just store the file info
          // In a production environment, you might want to generate video thumbnails using ffmpeg

          // Insert into property_videos table
          const result = await query(`
            INSERT INTO property_videos (property_id, video_url, title, display_order)
            VALUES ($1, $2, $3, (SELECT COALESCE(MAX(display_order), -1) + 1 FROM property_videos WHERE property_id = $1))
            RETURNING *
          `, [property_id, fileUrl, file.originalname]);

          uploadedFiles.push({
            type: 'video',
            id: result.rows[0].id,
            filename: file.filename,
            originalName: file.originalname,
            url: fileUrl,
            size: file.size
          });
        }

      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
        errors.push({
          filename: file.originalname,
          error: fileError.message
        });
        
        // Clean up failed file
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up failed file:', unlinkError);
        }
      }
    }

    res.json({
      success: true,
      data: {
        uploadedFiles,
        errors,
        propertyId: property_id
      },
      message: `Successfully uploaded ${uploadedFiles.length} file(s)${errors.length > 0 ? ` with ${errors.length} error(s)` : ''}`
    });

  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload files'
    });
  }
});

// DELETE /api/upload/image/:id - Delete an image (admin only)
router.delete('/image/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get image info before deleting
    const imageResult = await query('SELECT * FROM property_images WHERE id = $1', [id]);
    
    if (imageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }

    const image = imageResult.rows[0];
    
    // Delete from database
    await query('DELETE FROM property_images WHERE id = $1', [id]);

    // Delete physical files
    try {
      const imagePath = path.join(__dirname, '..', image.image_url);
      await fs.unlink(imagePath);

      // Delete thumbnail if exists
      const filename = path.basename(image.image_url);
      const thumbnailPath = path.join(thumbnailsDir, `thumb_${filename}`);
      try {
        await fs.unlink(thumbnailPath);
      } catch (thumbnailError) {
        // Thumbnail might not exist, ignore error
      }
    } catch (fileError) {
      console.error('Error deleting physical file:', fileError);
      // Don't fail the request if file deletion fails
    }

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete image'
    });
  }
});

// DELETE /api/upload/video/:id - Delete a video (admin only)
router.delete('/video/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get video info before deleting
    const videoResult = await query('SELECT * FROM property_videos WHERE id = $1', [id]);
    
    if (videoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    const video = videoResult.rows[0];
    
    // Delete from database
    await query('DELETE FROM property_videos WHERE id = $1', [id]);

    // Delete physical file
    try {
      const videoPath = path.join(__dirname, '..', video.video_url);
      await fs.unlink(videoPath);

      // Delete thumbnail if exists
      if (video.thumbnail_url) {
        const thumbnailPath = path.join(__dirname, '..', video.thumbnail_url);
        try {
          await fs.unlink(thumbnailPath);
        } catch (thumbnailError) {
          // Thumbnail might not exist, ignore error
        }
      }
    } catch (fileError) {
      console.error('Error deleting physical file:', fileError);
      // Don't fail the request if file deletion fails
    }

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete video'
    });
  }
});

// GET /api/upload/property/:id/media - Get all media for a property (admin only)
router.get('/property/:id/media', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [imagesResult, videosResult] = await Promise.all([
      query(`
        SELECT * FROM property_images 
        WHERE property_id = $1 
        ORDER BY display_order, id
      `, [id]),
      query(`
        SELECT * FROM property_videos 
        WHERE property_id = $1 
        ORDER BY display_order, id
      `, [id])
    ]);

    res.json({
      success: true,
      data: {
        images: imagesResult.rows,
        videos: videosResult.rows,
        propertyId: id
      }
    });

  } catch (error) {
    console.error('Error fetching property media:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch property media'
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 50MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum is 20 files per upload.'
      });
    }
  }
  
  if (error.message === 'Only image and video files are allowed') {
    return res.status(400).json({
      success: false,
      error: 'Only image and video files are allowed'
    });
  }

  res.status(500).json({
    success: false,
    error: 'Upload failed'
  });
});

module.exports = router;