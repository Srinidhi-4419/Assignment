const mongoose = require('mongoose');

/* ----------------- Categorize Question Schema ----------------- */
const categorizeSchema = new mongoose.Schema({
  type: { type: String, default: 'categorize' },
  title: { type: String, required: true },
  headerImage: String,
  categories: {
    type: [{
      name: { type: String, required: true },
      points: { type: Number, default: 1, min: 0 }
    }],
    validate: {
      validator: function(categories) {
        return categories.length > 0;
      },
      message: 'At least one category is required'
    }
  },
  items: {
    type: [{
      text: { type: String, required: true },
      belongsTo: { type: String, required: true }
    }],
    validate: {
      validator: function(items) {
        return items.length > 0;
      },
      message: 'At least one item is required'
    }
  }
}, { _id: false });

/* ----------------- Cloze Question Schema ----------------- */
const clozeSchema = new mongoose.Schema({
  type: { type: String, default: 'cloze' },
  title: { type: String, required: true },
  headerImage: String,
  text: { type: String, required: true },
  blanks: {
    type: [String],
    required: true,
    validate: {
      validator: function(blanks) {
        return blanks.length > 0;
      },
      message: 'At least one blank answer is required'
    }
  },
  blankOptions: {
    type: Map,
    of: {
      correct: { type: String, required: true },
      additional: { type: [String], default: [] },
      points: { type: Number, default: 1, min: 0 }
    }
  }
}, { _id: false });

/* ----------------- Comprehension Question Schema ----------------- */
const comprehensionSchema = new mongoose.Schema({
  type: { type: String, default: 'comprehension' },
  title: { type: String, required: true },
  headerImage: String,
  passage: { type: String, required: true },
  subQuestions: {
    type: [{
      type: { type: String, enum: ['mcq', 'true-false'], default: 'mcq' },
      question: { type: String, required: true },
      options: [String],
      answer: { type: mongoose.Schema.Types.Mixed, required: true },
      points: { type: Number, default: 1, min: 0 }
    }],
    validate: {
      validator: function(subQuestions) {
        return subQuestions.length > 0;
      },
      message: 'At least one sub-question is required'
    }
  }
}, { _id: false });

/* ----------------- Base Question Schema (for discriminators) ----------------- */
const baseQuestionSchema = new mongoose.Schema(
  { type: { type: String, required: true } },
  { discriminatorKey: 'type', _id: false }   // important for discriminators
);

/* ----------------- Main Form Schema ----------------- */
const formSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  headerImage: String,
  questions: [baseQuestionSchema], // use base schema instead of Mixed
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// auto-update timestamp
formSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

/* ----------------- Build Model ----------------- */
const Form = mongoose.model('Form', formSchema);

// Attach discriminators (sub-schemas)
Form.discriminator('categorize', categorizeSchema);
Form.discriminator('cloze', clozeSchema);
Form.discriminator('comprehension', comprehensionSchema);

module.exports = Form;
