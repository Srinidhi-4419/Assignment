const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
  responses: [{
    questionIndex: { type: Number, required: true, min: 0 },
    questionType: { type: String, enum: ['categorize', 'cloze', 'comprehension'], required: true },
    
    // Categorize Question Response
    categorizedItems: [{
      itemText: { type: String, required: true },
      selectedCategory: { type: String, required: true }, // Which category the user placed this item in
      correctCategory: String, // What the correct category should be (for reference)
      isCorrect: { type: Boolean, default: false } // Calculated field for grading
    }],
    
    // Cloze Question Response - Using array to match form schema structure
    blankAnswers: [{
      blankIndex: { type: Number, required: true }, // Position of the blank (0, 1, 2, etc.)
      userAnswer: { type: String, required: true }, // What the user filled in for this blank
      correctAnswer: String, // The correct answer for reference
      isCorrect: { type: Boolean, default: false } // Calculated field for grading
    }],
    
    // Comprehension Question Response
    subQuestionAnswers: [{
      subQuestionIndex: { type: Number, required: true, min: 0 },
      subQuestionType: { type: String, enum: ['mcq', 'true-false'], required: true },
      answer: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        validate: {
          validator: function(answer) {
            // Validate based on sub-question type
            if (this.subQuestionType === 'mcq') {
              return typeof answer === 'number' && answer >= 0;
            }
            if (this.subQuestionType === 'true-false') {
              return typeof answer === 'boolean';
            }
            return false;
          },
          message: 'Answer format does not match question type'
        }
      },
      correctAnswer: mongoose.Schema.Types.Mixed, // For reference
      isCorrect: { type: Boolean, default: false }, // Calculated field for grading
      pointsEarned: { type: Number, default: 0, min: 0 }, // Calculated points for this sub-question
      maxPoints: { type: Number, default: 1, min: 0 } // Maximum points possible for this sub-question
    }],
    
    // Common fields for scoring
    totalPointsEarned: { type: Number, default: 0, min: 0 }, // Total points earned for this question
    maxPossiblePoints: { type: Number, default: 0, min: 0 } // Maximum points possible for this question
  }],
  
  // Overall response metadata
  totalScore: { type: Number, default: 0, min: 0 }, // Total points earned across all questions
  maxScore: { type: Number, default: 0, min: 0 }, // Maximum points possible for the entire form
  percentageScore: { type: Number, default: 0, min: 0, max: 100 }, // Calculated percentage score
  
  // Timestamps and metadata
  submittedAt: { type: Date, default: Date.now },
 
});

// Indexes for better query performance
responseSchema.index({ formId: 1, submittedAt: -1 });
responseSchema.index({ formId: 1, totalScore: -1 });

// Calculate percentage score before saving
responseSchema.pre('save', function(next) {
  if (this.maxScore > 0) {
    this.percentageScore = Math.round((this.totalScore / this.maxScore) * 100 * 100) / 100; // Round to 2 decimal places
  }
  next();
});

// Method to calculate total scores
responseSchema.methods.calculateScores = function() {
  this.totalScore = this.responses.reduce((total, response) => {
    return total + (response.totalPointsEarned || 0);
  }, 0);
  
  this.maxScore = this.responses.reduce((total, response) => {
    return total + (response.maxPossiblePoints || 0);
  }, 0);
  
  if (this.maxScore > 0) {
    this.percentageScore = Math.round((this.totalScore / this.maxScore) * 100 * 100) / 100;
  }
  
  return {
    totalScore: this.totalScore,
    maxScore: this.maxScore,
    percentageScore: this.percentageScore
  };
};



module.exports = mongoose.model('Response', responseSchema);