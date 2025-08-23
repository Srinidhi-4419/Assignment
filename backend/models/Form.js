const mongoose = require('mongoose');



// Main Form Schema
const formSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  headerImage: String,
  questions: {
    type: [mongoose.Schema.Types.Mixed],
    validate: [
      {
        validator: function (questions) {
          return questions.length > 0;
        },
        message: 'At least one question is required'
      },
      {
        validator: function (questions) {
          return questions.every(q => ['categorize', 'cloze', 'comprehension'].includes(q.type));
        },
        message: 'Invalid question type found'
      }
    ]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamps
formSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Form', formSchema);