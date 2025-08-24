const Form = require('../models/Form');
const Response = require('../models/Response');
const { generatePublicId } = require('../utils/getPublicId');
const cloudinary = require('../config/cloudinary');

exports.createForm = async (req, res) => {
    try {
      const formData = req.body;
  
      // Validate required fields
      if (!formData.title) {
        return res.status(400).json({ success: false, error: "Title is required" });
      }
  
      // Optional: Validate nested structures
      if (formData.questions && !Array.isArray(formData.questions)) {
        return res.status(400).json({ success: false, error: "Questions must be an array" });
      }
  
      const form = new Form(formData); // `updatedAt` is auto-set by middleware
      const savedForm = await form.save();
  
      res.status(201).json({ 
        success: true, 
        formId: savedForm._id, 
        message: 'Form created successfully' 
      });
    } catch (error) {
      console.error("Error creating form:", error); // Log for debugging
      res.status(400).json({ success: false, error: error.message });
    }
  };
  exports.getAllForms = async (req, res) => {
    try {
      const forms = await Form.find({}).sort({ updatedAt: -1 });
      res.json(forms);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

exports.getFormById = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ error: 'Form not found' });
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateForm = async (req, res) => {
  try {
    const formData = req.body;
    formData.updatedAt = new Date();

    const updatedForm = await Form.findByIdAndUpdate(req.params.id, formData, { new: true, runValidators: true });
    if (!updatedForm) return res.status(404).json({ error: 'Form not found' });

    res.json({ success: true, message: 'Form updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};





