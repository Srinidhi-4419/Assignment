const multer = require('multer');

const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }

  return res.status(500).json({ error: err.message });
};

module.exports = errorHandler;
