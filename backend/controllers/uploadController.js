const cloudinary = require('../config/cloudinary');

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({ imageUrl: req.file.path });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { uploadImage };
