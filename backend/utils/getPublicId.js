const mongoose = require('mongoose');

// Function to generate a public ID
const generatePublicId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

module.exports = { generatePublicId };
