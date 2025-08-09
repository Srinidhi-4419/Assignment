require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const formRoutes = require('./routes/formRoute');
const responseRoutes = require('./routes/responseRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/forms', formRoutes);
app.use('/api/forms', responseRoutes);
app.use('/api/upload', uploadRoutes);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
