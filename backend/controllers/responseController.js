const Response = require('../models/Response');
const Form = require('../models/Form');

exports.submitResponse = async (req, res) => {
    console.log('=== SUBMIT RESPONSE STARTED ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    try {
      const formId = req.params.id;
      const responseData = req.body;
  
      console.log('Form ID:', formId);
  
      // Find and validate form exists
      const form = await Form.findById(formId);
      if (!form) {
        console.log('Form not found');
        return res.status(404).json({ error: 'Form not found' });
      }
  
      console.log('Form found:', form.title);
      console.log('Form questions:', form.questions.map(q => ({ type: q.type, title: q.title })));
  
      // Validate response data structure
      if (!responseData.responses || !Array.isArray(responseData.responses)) {
        console.log('Invalid response format');
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid response format. Expected responses array.' 
        });
      }
  
      console.log('Processing responses:', responseData.responses.length);
  
      // Process and grade each response
      const processedResponses = await Promise.all(
        responseData.responses.map(async (userResponse, index) => {
          console.log(`\n--- Processing response ${index} ---`);
          console.log('User response:', JSON.stringify(userResponse, null, 2));
          
          const question = form.questions[userResponse.questionIndex];
          if (!question) {
            throw new Error(`Question at index ${userResponse.questionIndex} not found`);
          }
  
          console.log('Question type:', question.type);
          console.log('Question data:', JSON.stringify({
            type: question.type,
            title: question.title,
            blanks: question.blanks,
            blankOptions: question.blankOptions
          }, null, 2));
  
          const processedResponse = {
            questionIndex: userResponse.questionIndex,
            questionType: question.type,
            totalPointsEarned: 0,
            maxPossiblePoints: 0
          };
  
          // Process based on question type
          switch (question.type) {
            case 'categorize':
              processedResponse.categorizedItems = await processCategorizeResponse(
                userResponse, question, processedResponse
              );
              break;
  
            case 'cloze':
              console.log('CALLING CLOZE PROCESSING');
              processedResponse.blankAnswers = await processClozeResponse(
                userResponse, question, processedResponse
              );
              console.log('CLOZE PROCESSING COMPLETE');
              break;
  
            case 'comprehension':
              processedResponse.subQuestionAnswers = await processComprehensionResponse(
                userResponse, question, processedResponse
              );
              break;
  
            default:
              throw new Error(`Unknown question type: ${question.type}`);
          }
  
          console.log('Processed response:', JSON.stringify(processedResponse, null, 2));
          return processedResponse;
        })
      );
  
      console.log('All responses processed successfully');
  
      // Create response document
      const response = new Response({
        formId,
        responses: processedResponses
      });
  
      // Calculate overall scores
      response.calculateScores();
  
      // Save response
      await response.save();
  
      console.log('Response saved with ID:', response._id);
      console.log('Final scores:', {
        totalScore: response.totalScore,
        maxScore: response.maxScore,
        percentage: response.percentageScore
      });
  
      res.status(201).json({ 
        success: true,
        responses: processedResponses,
        responseId: response._id,
        score: {
          totalScore: response.totalScore,
          maxScore: response.maxScore,
          percentage: response.percentageScore
        }
      });
      
    } catch (error) {
      console.error('=== SUBMIT RESPONSE ERROR ===');
      console.error('Error details:', error);
      console.error('Stack trace:', error.stack);
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  };
  
  // Helper function for categorize questions
  async function processCategorizeResponse(userResponse, question, processedResponse) {
    const categorizedItems = [];
    
    // Calculate max possible points based on new schema structure
    processedResponse.maxPossiblePoints = 0;
    question.categories.forEach(category => {
      const itemsInThisCategory = question.items.filter(item => item.belongsTo === category.name);
      processedResponse.maxPossiblePoints += itemsInThisCategory.length * (category.points || 1);
    });
  
    // Process each user's categorized item
    if (userResponse.categorizedItems && Array.isArray(userResponse.categorizedItems)) {
      for (const userItem of userResponse.categorizedItems) {
        // Find the correct item and its category from the schema
        const correctItem = question.items.find(item => item.text === userItem.itemText);
        const correctCategory = correctItem ? 
          question.categories.find(cat => cat.name === correctItem.belongsTo) : null;
        
        const isCorrect = correctCategory && correctCategory.name === userItem.selectedCategory;
        
        categorizedItems.push({
          itemText: userItem.itemText,
          selectedCategory: userItem.selectedCategory,
          correctCategory: correctItem ? correctItem.belongsTo : null,
          isCorrect
        });
  
        // Add points if correct
        if (isCorrect && correctCategory) {
          processedResponse.totalPointsEarned += correctCategory.points || 1;
        }
      }
    }
  
    return categorizedItems;
  }
  
  // FIXED Helper function for cloze questions
  // FIXED Helper function for cloze questions with enhanced debugging
// CORRECTED Helper function for cloze questions - treating additional as distractors
async function processClozeResponse(userResponse, question, processedResponse) {
    const blankAnswers = [];
    
    console.log('Processing cloze response:', {
      questionId: question._id,
      userResponse: userResponse,
      questionBlankOptions: question.blankOptions,
      questionBlanks: question.blanks
    });
    
    // Calculate max possible points based on new schema structure
    if (question.blankOptions && Object.keys(question.blankOptions).length > 0) {
      // If blankOptions are provided, use their point values
      Object.values(question.blankOptions).forEach(blankOption => {
        processedResponse.maxPossiblePoints += blankOption.points || 1;
      });
    } else {
      // If no blankOptions, default to 1 point per blank
      processedResponse.maxPossiblePoints = question.blanks ? question.blanks.length : 0;
    }
  
    // Process each blank answer
    if (userResponse.blankAnswers && Array.isArray(userResponse.blankAnswers)) {
      for (const userBlank of userResponse.blankAnswers) {
        const blankIndex = userBlank.blankIndex.toString();
        const userAnswer = userBlank.userAnswer ? userBlank.userAnswer.toString().trim() : '';
        
        console.log(`Processing blank ${blankIndex}:`, {
          userAnswer: userAnswer,
          userAnswerLength: userAnswer.length,
          userAnswerLower: userAnswer.toLowerCase()
        });
        
        let isCorrect = false;
        let correctAnswer = null;
        
        // Check if blankOptions exist for this blank
        if (question.blankOptions && question.blankOptions[blankIndex]) {
          const blankOption = question.blankOptions[blankIndex];
          correctAnswer = blankOption.correct;
          
          console.log(`Blank option found for index ${blankIndex}:`, {
            correctAnswer: correctAnswer,
            correctAnswerType: typeof correctAnswer,
            correctAnswerLength: correctAnswer ? correctAnswer.toString().length : 0,
            additional: blankOption.additional,
            note: 'Additional options are distractors, not correct answers'
          });
          
          // FIXED: Only check against the main correct answer, ignore additional (distractors)
          if (correctAnswer) {
            const correctAnsStr = correctAnswer.toString().toLowerCase().trim();
            const userAnsStr = userAnswer.toLowerCase().trim();
            
            console.log(`Comparing with correct answer only:`, {
              correctAnswer: correctAnswer,
              correctAnsStr: `"${correctAnsStr}"`,
              userAnsStr: `"${userAnsStr}"`,
              areEqual: correctAnsStr === userAnsStr,
              correctLength: correctAnsStr.length,
              userLength: userAnsStr.length
            });
            
            isCorrect = correctAnsStr === userAnsStr;
            
            if (isCorrect) {
              console.log(`✓ CORRECT MATCH FOUND`);
              processedResponse.totalPointsEarned += blankOption.points || 1;
            } else {
              console.log(`✗ NO MATCH - Answer is incorrect`);
            }
          }
        } else {
          // Fallback to checking against blanks array (1 point each)
          const blankIndexNum = parseInt(blankIndex);
          if (question.blanks && blankIndexNum < question.blanks.length) {
            correctAnswer = question.blanks[blankIndexNum];
            const correctAnsStr = correctAnswer ? correctAnswer.toString().toLowerCase().trim() : '';
            const userAnsStr = userAnswer.toLowerCase().trim();
            
            console.log(`Fallback comparison for blank ${blankIndex}:`, {
              correctAnswer: correctAnswer,
              correctAnsStr: correctAnsStr,
              userAnsStr: userAnsStr,
              areEqual: correctAnsStr === userAnsStr
            });
            
            isCorrect = correctAnsStr === userAnsStr;
            if (isCorrect) {
              processedResponse.totalPointsEarned += 1;
            }
          }
        }
        
        blankAnswers.push({
          blankIndex: userBlank.blankIndex,
          userAnswer: userAnswer,
          correctAnswer: correctAnswer,
          isCorrect: isCorrect
        });
        
        console.log(`Added blank answer:`, {
          blankIndex: userBlank.blankIndex,
          userAnswer: userAnswer,
          correctAnswer: correctAnswer,
          isCorrect: isCorrect
        });
      }
    }
  
    console.log('Final processed response:', {
      totalPointsEarned: processedResponse.totalPointsEarned,
      maxPossiblePoints: processedResponse.maxPossiblePoints,
      blankAnswers: blankAnswers
    });
  
    return blankAnswers;
  }
  // Helper function for comprehension questions
  async function processComprehensionResponse(userResponse, question, processedResponse) {
    const subQuestionAnswers = [];
    
    // Calculate max possible points
    processedResponse.maxPossiblePoints = question.subQuestions.reduce((total, sq) => 
      total + (sq.points || 1), 0
    );
  
    // Process each sub-question answer
    if (userResponse.subQuestionAnswers && Array.isArray(userResponse.subQuestionAnswers)) {
      for (const userSubAnswer of userResponse.subQuestionAnswers) {
        const subQuestion = question.subQuestions[userSubAnswer.subQuestionIndex];
        if (!subQuestion) continue;
  
        let isCorrect = false;
        let pointsEarned = 0;
  
        // Auto-grade MCQ and true-false questions
        if (subQuestion.type === 'mcq') {
          // For MCQ, answer should be the index of the correct option
          isCorrect = userSubAnswer.answer === subQuestion.answer;
          pointsEarned = isCorrect ? (subQuestion.points || 1) : 0;
        } else if (subQuestion.type === 'true-false') {
          // For true-false, answer should be a boolean
          isCorrect = userSubAnswer.answer === subQuestion.answer;
          pointsEarned = isCorrect ? (subQuestion.points || 1) : 0;
        }
  
        processedResponse.totalPointsEarned += pointsEarned;
  
        subQuestionAnswers.push({
          subQuestionIndex: userSubAnswer.subQuestionIndex,
          subQuestionType: userSubAnswer.subQuestionType,
          answer: userSubAnswer.answer,
          correctAnswer: subQuestion.answer,
          isCorrect,
          pointsEarned,
          maxPoints: subQuestion.points || 1
        });
      }
    }
  
    return subQuestionAnswers;
  }

// Improved endpoints for form responses
exports.getFormResponses = async (req, res) => {
    try {
      const responses = await Response.find({ formId: req.params.id })
        .populate('formId', 'title questions headerImage')
        .sort({ submittedAt: -1 });
      
      // Add summary statistics
      const summary = {
        totalResponses: responses.length,
        averageScore: responses.length > 0 ? 
          responses.reduce((sum, r) => sum + (r.percentageScore || 0), 0) / responses.length : 0,
        highestScore: responses.length > 0 ? 
          Math.max(...responses.map(r => r.percentageScore || 0)) : 0,
        lowestScore: responses.length > 0 ? 
          Math.min(...responses.map(r => r.percentageScore || 0)) : 0
      };

      res.json({
        responses,
        summary
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  // Get detailed response by ID
  exports.getResponseById = async (req, res) => {
    try {
      const response = await Response.findById(req.params.responseId)
        .populate({
          path: 'formId',
          select: 'title questions headerImage'
        });
      
      if (!response) {
        return res.status(404).json({ error: 'Response not found' });
      }

      // Transform the response to include detailed question information
      const detailedResponse = {
        _id: response._id,
        submittedAt: response.submittedAt,
        completionTime: response.completionTime,
        totalScore: response.totalScore,
        maxScore: response.maxScore,
        percentageScore: response.percentageScore,
        form: response.formId,
        responses: response.responses.map((resp) => {
          const question = response.formId.questions[resp.questionIndex];
          return {
            ...resp.toObject(), // Convert mongoose document to plain object
            questionTitle: question ? question.title : `Question ${resp.questionIndex + 1}`,
            questionHeaderImage: question ? question.headerImage : null,
            questionData: question
          };
        })
      };

      res.json(detailedResponse);
    } catch (error) {
      console.error('Error fetching response detail:', error);
      res.status(500).json({ error: error.message });
    }
  };

// FIXED Analytics helper functions
function calculateClozeAnalytics(question, questionResponses) {
  let correctAnswers = [];
  let partiallyCorrectAnswers = [];
  let totalPossiblePoints = 0;
  let totalEarnedPoints = 0;

  // Calculate total possible points for cloze questions
  if (question.blankOptions && Object.keys(question.blankOptions).length > 0) {
    totalPossiblePoints = Object.values(question.blankOptions).reduce((total, blank) => 
      total + (blank.points || 1), 0);
  } else {
    totalPossiblePoints = question.blanks ? question.blanks.length : 0;
  }

  questionResponses.forEach(qr => {
    if (qr.blankAnswers && Array.isArray(qr.blankAnswers)) {
      const correctBlanks = qr.blankAnswers.filter(blank => blank.isCorrect === true);
      const totalBlanks = qr.blankAnswers.length;
      
      totalEarnedPoints += qr.totalPointsEarned || 0;
      
      // A response is fully correct if ALL blanks are correct
      if (correctBlanks.length === totalBlanks && totalBlanks > 0) {
        correctAnswers.push(qr);
      } 
      // A response is partially correct if SOME blanks are correct (but not all)
      else if (correctBlanks.length > 0) {
        partiallyCorrectAnswers.push(qr);
      }
      // If no blanks are correct, it's incorrect (not added to either array)
    }
  });

  return {
    correctAnswers: correctAnswers.length,
    partiallyCorrectAnswers: partiallyCorrectAnswers.length,
    incorrectAnswers: questionResponses.length - correctAnswers.length - partiallyCorrectAnswers.length,
    totalEarnedPoints,
    totalPossiblePoints
  };
}

function calculateCategorizeAnalytics(question, questionResponses) {
  let correctAnswers = [];
  let partiallyCorrectAnswers = [];
  let totalPossiblePoints = 0;
  let totalEarnedPoints = 0;

  // Calculate total possible points for categorize questions
  totalPossiblePoints = question.categories.reduce((total, cat) => {
    const itemsInCategory = question.items.filter(item => item.belongsTo === cat.name);
    return total + (itemsInCategory.length * (cat.points || 1));
  }, 0);

  questionResponses.forEach(qr => {
    if (qr.categorizedItems && Array.isArray(qr.categorizedItems)) {
      const correctItems = qr.categorizedItems.filter(item => item.isCorrect === true);
      const totalItems = qr.categorizedItems.length;
      
      totalEarnedPoints += qr.totalPointsEarned || 0;
      
      if (correctItems.length === totalItems && totalItems > 0) {
        correctAnswers.push(qr);
      } else if (correctItems.length > 0) {
        partiallyCorrectAnswers.push(qr);
      }
    }
  });

  return {
    correctAnswers: correctAnswers.length,
    partiallyCorrectAnswers: partiallyCorrectAnswers.length,
    incorrectAnswers: questionResponses.length - correctAnswers.length - partiallyCorrectAnswers.length,
    totalEarnedPoints,
    totalPossiblePoints
  };
}

function calculateComprehensionAnalytics(question, questionResponses) {
  let correctAnswers = [];
  let partiallyCorrectAnswers = [];
  let totalPossiblePoints = 0;
  let totalEarnedPoints = 0;

  // Calculate total possible points for comprehension questions
  totalPossiblePoints = question.subQuestions.reduce((total, sq) => 
    total + (sq.points || 1), 0);

  questionResponses.forEach(qr => {
    if (qr.subQuestionAnswers && Array.isArray(qr.subQuestionAnswers)) {
      const correctSubQuestions = qr.subQuestionAnswers.filter(sq => sq.isCorrect === true);
      const totalSubQuestions = qr.subQuestionAnswers.length;
      
      totalEarnedPoints += qr.totalPointsEarned || 0;
      
      if (correctSubQuestions.length === totalSubQuestions && totalSubQuestions > 0) {
        correctAnswers.push(qr);
      } else if (correctSubQuestions.length > 0) {
        partiallyCorrectAnswers.push(qr);
      }
    }
  });

  return {
    correctAnswers: correctAnswers.length,
    partiallyCorrectAnswers: partiallyCorrectAnswers.length,
    incorrectAnswers: questionResponses.length - correctAnswers.length - partiallyCorrectAnswers.length,
    totalEarnedPoints,
    totalPossiblePoints
  };
}
  
  // FIXED Get analytics for a specific form
  exports.getFormAnalytics = async (req, res) => {
    try {
      const responses = await Response.find({ formId: req.params.id })
        .populate('formId', 'title questions headerImage');

      if (responses.length === 0) {
        return res.json({
          totalResponses: 0,
          averageScore: 0,
          scoreDistribution: [],
          questionAnalytics: []
        });
      }

      // Calculate score distribution
      const scoreRanges = {
        '90-100%': 0,
        '80-89%': 0,
        '70-79%': 0,
        '60-69%': 0,
        'Below 60%': 0
      };

      responses.forEach(response => {
        const score = response.percentageScore || 0;
        if (score >= 90) scoreRanges['90-100%']++;
        else if (score >= 80) scoreRanges['80-89%']++;
        else if (score >= 70) scoreRanges['70-79%']++;
        else if (score >= 60) scoreRanges['60-69%']++;
        else scoreRanges['Below 60%']++;
      });

      // Calculate question-wise analytics
      const questionAnalytics = [];
      const form = responses[0].formId;
      
      if (form && form.questions) {
        form.questions.forEach((question, questionIndex) => {
          const questionResponses = responses.map(r => 
            r.responses.find(res => res.questionIndex === questionIndex)
          ).filter(Boolean);

          let analytics = {
            correctAnswers: 0,
            partiallyCorrectAnswers: 0,
            incorrectAnswers: 0,
            totalEarnedPoints: 0,
            totalPossiblePoints: 0
          };

          // FIXED: Calculate question-specific analytics based on type
          if (question.type === 'categorize') {
            analytics = calculateCategorizeAnalytics(question, questionResponses);
          } 
          else if (question.type === 'cloze') {
            analytics = calculateClozeAnalytics(question, questionResponses);
          } 
          else if (question.type === 'comprehension') {
            analytics = calculateComprehensionAnalytics(question, questionResponses);
          }

          questionAnalytics.push({
            questionIndex,
            questionType: question.type,
            questionTitle: question.title || `Question ${questionIndex + 1}`,
            totalAttempts: questionResponses.length,
            correctAnswers: analytics.correctAnswers,
            partiallyCorrectAnswers: analytics.partiallyCorrectAnswers,
            incorrectAnswers: analytics.incorrectAnswers,
            accuracyRate: questionResponses.length > 0 ? 
              (analytics.correctAnswers / questionResponses.length) * 100 : 0,
            partialAccuracyRate: questionResponses.length > 0 ? 
              ((analytics.correctAnswers + analytics.partiallyCorrectAnswers) / questionResponses.length) * 100 : 0,
            averagePoints: questionResponses.length > 0 ?
              (analytics.totalEarnedPoints / questionResponses.length) : 0,
            maxPossiblePoints: analytics.totalPossiblePoints,
            pointsEfficiency: analytics.totalPossiblePoints > 0 ? 
              ((analytics.totalEarnedPoints / (questionResponses.length * analytics.totalPossiblePoints)) * 100) : 0
          });
        });
      }

      const analytics = {
        totalResponses: responses.length,
        averageScore: responses.reduce((sum, r) => sum + (r.percentageScore || 0), 0) / responses.length,
        highestScore: Math.max(...responses.map(r => r.percentageScore || 0)),
        lowestScore: Math.min(...responses.map(r => r.percentageScore || 0)),
        scoreDistribution: Object.entries(scoreRanges).map(([range, count]) => ({
          range,
          count,
          percentage: (count / responses.length) * 100
        })),
        questionAnalytics,
        recentSubmissions: responses.slice(0, 10).map(r => ({
          id: r._id,
          score: r.percentageScore,
          submittedAt: r.submittedAt,
          totalPoints: r.totalScore,
          maxPoints: r.maxScore
        })),
        formInfo: {
          title: form.title,
          headerImage: form.headerImage,
          totalQuestions: form.questions.length,
          questionTypes: form.questions.reduce((acc, q) => {
            acc[q.type] = (acc[q.type] || 0) + 1;
            return acc;
          }, {})
        }
      };

      res.json(analytics);
    } catch (error) {
      console.error('Error in getFormAnalytics:', error);
      res.status(500).json({ error: error.message });
    }
  };