import React, { useState, useEffect } from 'react';
import { Plus, Save, Eye, Trash2, Upload, Move, GripVertical, X, Loader2, FileText, PenTool, Award, Clock, Target, CheckCircle, XCircle, BookOpen, Home, Edit, Play, Send, ArrowLeft, User, Calendar, Star, BarChart3 } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QuestionEditor } from '../FormEditor/QuestionEditor';
import { QuestionList } from '../FormEditor/QuestionList';
import { FormHeader } from '../FormEditor/FormHeader';
import ResponseAnalytics from '../FormEditor/ResponseAnalytics';
// Test Taking Component
const TestTaker = ({ form, onBack, isPreview = false }) => {
  const [answers, setAnswers] = useState({});
  const [categoryItems, setCategoryItems] = useState({});
  const [blankAnswers, setBlankAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOption, setDraggedOption] = useState(null);

  // Initialize category items for drag and drop
  useEffect(() => {
    const newCategoryItems = {};
    form.questions?.forEach((question, qIndex) => {
      if (question.type === 'categorize') {
        newCategoryItems[qIndex] = {};
        question.categories?.forEach((category, catIndex) => {
          newCategoryItems[qIndex][catIndex] = [];
        });
      }
    });
    setCategoryItems(newCategoryItems);
  }, [form]);

  const handleCategorizeItemDrag = (e, item, questionIndex) => {
    setDraggedItem({ item, questionIndex });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.text);
  };

  const handleCategoryDrop = (e, questionIndex, categoryIndex) => {
    e.preventDefault();
    if (draggedItem && draggedItem.questionIndex === questionIndex) {
      const newCategoryItems = { ...categoryItems };
      
      // Remove item from all categories first
      Object.keys(newCategoryItems[questionIndex] || {}).forEach(catKey => {
        newCategoryItems[questionIndex][catKey] = newCategoryItems[questionIndex][catKey].filter(
          item => item !== draggedItem.item.text
        );
      });
      
      // Add to target category
      if (!newCategoryItems[questionIndex]) {
        newCategoryItems[questionIndex] = {};
      }
      if (!newCategoryItems[questionIndex][categoryIndex]) {
        newCategoryItems[questionIndex][categoryIndex] = [];
      }
      if (!newCategoryItems[questionIndex][categoryIndex].includes(draggedItem.item.text)) {
        newCategoryItems[questionIndex][categoryIndex].push(draggedItem.item.text);
      }
      
      setCategoryItems(newCategoryItems);
      setDraggedItem(null);
    }
  };

  const handleClozeDrag = (e, option, questionIndex, blankIndex) => {
    setDraggedOption({ option, questionIndex, blankIndex });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleBlankDrop = (e, questionIndex, blankIndex) => {
    e.preventDefault();
    if (draggedOption && draggedOption.questionIndex === questionIndex) {
      const newBlankAnswers = { ...blankAnswers };
      if (!newBlankAnswers[questionIndex]) {
        newBlankAnswers[questionIndex] = {};
      }
      newBlankAnswers[questionIndex][blankIndex] = draggedOption.option;
      setBlankAnswers(newBlankAnswers);
      setDraggedOption(null);
    }
  };

  const handleAnswerChange = (questionIndex, subQuestionIndex, value) => {
    setAnswers(prev => ({
      ...prev,
      [`${questionIndex}-${subQuestionIndex}`]: value
    }));
  };

  const [startTime] = useState(Date.now());

  const handleSubmitTest = async () => {
    if (isPreview) {
      toast.info('This is preview mode - test cannot be submitted', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }
  
    setSubmitting(true);
    try {
      // Transform frontend data to match backend expected format
      const responses = [];
  
      form.questions.forEach((question, questionIndex) => {
        const response = {
          questionIndex: questionIndex,
          questionType: question.type
        };
  
        switch (question.type) {
          case 'categorize':
            response.categorizedItems = [];
            // Convert categoryItems format to backend expected format
            if (categoryItems[questionIndex]) {
              Object.keys(categoryItems[questionIndex]).forEach(categoryIndex => {
                const items = categoryItems[questionIndex][categoryIndex];
                if (items && items.length > 0) {
                  items.forEach(itemText => {
                    response.categorizedItems.push({
                      itemText: itemText,
                      selectedCategory: question.categories[categoryIndex].name
                    });
                  });
                }
              });
            }
            break;
  
          case 'cloze':
            response.blankAnswers = [];
            if (blankAnswers[questionIndex]) {
              Object.keys(blankAnswers[questionIndex]).forEach(blankIndex => {
                response.blankAnswers.push({
                  blankIndex: parseInt(blankIndex),
                  userAnswer: blankAnswers[questionIndex][blankIndex]
                });
              });
            }
            break;
  
          case 'comprehension':
            response.subQuestionAnswers = [];
            question.subQuestions?.forEach((subQ, subIndex) => {
              const answerKey = `${questionIndex}-${subIndex}`;
              if (answers[answerKey] !== undefined) {
                response.subQuestionAnswers.push({
                  subQuestionIndex: subIndex,
                  subQuestionType: subQ.type,
                  answer: answers[answerKey]
                });
              }
            });
            break;
        }
  
        responses.push(response);
      });
  
      const testResponse = {
        responses: responses,
        submittedAt: new Date().toISOString(),
        completionTime: Date.now() - startTime
      };
  
      console.log('Sending test response:', testResponse); // Debug log
  console.log(import.meta.env.VITE_BACKEND_URL);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/forms/${form._id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testResponse),
      });
  
      if (response.ok) {
        const result = await response.json();
        console.log('Response result:', result); // Debug log
        
        toast.success('Thank you for submitting!', {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
        });
  
        // Redirect after toast shows
        setTimeout(() => {
          onBack();
        }, 2200);
      } 
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error(`Submission failed: ${error.message}`, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderCategorizeTest = (question, questionIndex) => {
    const availableItems = question.items?.filter(item => {
      return !Object.values(categoryItems[questionIndex] || {}).some(catItems => 
        catItems.includes(item.text)
      );
    }) || [];

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <GripVertical className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">Instructions:</span>
          </div>
          <p className="text-blue-700 text-sm">
            Drag the items below into the correct categories. Each item belongs to exactly one category.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {question.categories?.map((category, catIndex) => {
            const itemsInCategory = categoryItems[questionIndex]?.[catIndex] || [];

            return (
              <div
                key={catIndex}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[150px] bg-white hover:border-blue-300 transition-colors"
                onDrop={(e) => handleCategoryDrop(e, questionIndex, catIndex)}
                onDragOver={(e) => e.preventDefault()}
              >
                <h4 className="font-semibold text-gray-800 mb-3">{category.name}</h4>
                
                <div className="space-y-2">
                  {itemsInCategory.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      draggable
                      onDragStart={(e) => handleCategorizeItemDrag(e, { text: item }, questionIndex)}
                      className="bg-green-100 border border-green-300 text-green-800 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between cursor-move hover:shadow-md transition-all"
                    >
                      <div className="flex items-center space-x-2">
                        <GripVertical className="w-4 h-4 text-green-600" />
                        <span>{item}</span>
                      </div>
                    </div>
                  ))}
                  {itemsInCategory.length === 0 && (
                    <div className="text-gray-400 text-sm italic text-center py-8">
                      Drop items here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {availableItems.length > 0 && (
          <div className="border-t pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <h4 className="text-lg font-medium text-gray-700">Items to Categorize:</h4>
              <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                {availableItems.length} remaining
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {availableItems.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  draggable
                  onDragStart={(e) => handleCategorizeItemDrag(e, item, questionIndex)}
                  className="bg-white border-2 border-blue-300 text-blue-800 px-4 py-3 rounded-lg cursor-move hover:shadow-lg transition-all transform hover:scale-105 flex items-center space-x-2"
                >
                  <GripVertical className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderClozeTest = (question, questionIndex) => {
    const getAllOptions = () => {
      const allOptions = [];
      if (question.blanks && question.blankOptions) {
        question.blanks.forEach((blank, index) => {
          const options = question.blankOptions[index];
          if (options) {
            allOptions.push({ text: options.correct, type: 'correct', blankIndex: index });
            options.additional?.forEach((option) => {
              if (option.trim()) {
                allOptions.push({ text: option, type: 'additional', blankIndex: index });
              }
            });
          }
        });
      }
      return allOptions.sort(() => Math.random() - 0.5);
    };

    const getPreviewText = () => {
      let previewText = question.text || '';
      const regex = /\[([^\]]+)\]/g;
      let match;
      let result = '';
      let lastIndex = 0;
      let blankIndex = 0;

      while ((match = regex.exec(previewText)) !== null) {
        result += previewText.substring(lastIndex, match.index);
        const filledAnswer = blankAnswers[questionIndex]?.[blankIndex];
        
        result += `<span 
          class="inline-block min-w-[100px] border-b-2 border-blue-300 mx-1 px-3 py-2 bg-blue-50 drop-zone relative text-center font-medium cursor-pointer hover:bg-blue-100 transition-colors" 
          data-blank-index="${blankIndex}"
          style="min-height: 32px;"
        >${filledAnswer || '____'}</span>`;
        lastIndex = regex.lastIndex;
        blankIndex++;
      }
      result += previewText.substring(lastIndex);
      return result;
    };

    const allOptions = getAllOptions();
    const usedOptions = Object.values(blankAnswers[questionIndex] || {});
    const availableOptions = allOptions.filter(option => !usedOptions.includes(option.text));

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <GripVertical className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">Instructions:</span>
          </div>
          <p className="text-blue-700 text-sm">
            Drag the words from the word bank below to fill in the blanks in the passage.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div 
            className="text-lg leading-relaxed"
            dangerouslySetInnerHTML={{ __html: getPreviewText() }}
            onDrop={(e) => {
              const blankIndex = e.target.getAttribute('data-blank-index');
              if (blankIndex !== null) {
                handleBlankDrop(e, questionIndex, parseInt(blankIndex));
              }
            }}
            onDragOver={(e) => e.preventDefault()}
          />
        </div>

        {availableOptions.length > 0 && (
          <div className="border-t pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <h4 className="text-lg font-medium text-gray-700">Word Bank:</h4>
              <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                {availableOptions.length} words available
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {availableOptions.map((option, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={(e) => handleClozeDrag(e, option.text, questionIndex, option.blankIndex)}
                  className="bg-blue-100 border-2 border-blue-300 text-blue-800 px-4 py-3 rounded-lg cursor-move transition-all transform hover:scale-105 hover:shadow-lg flex items-center space-x-2"
                >
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{option.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderComprehensionTest = (question, questionIndex) => {
    return (
      <div className="space-y-6">
        {question.passage && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Reading Passage</h4>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-800 leading-relaxed">{question.passage}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Questions</h4>
          {question.subQuestions?.map((subQ, subIndex) => (
            <div key={subIndex} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex-shrink-0 mt-1">
                    Q{subIndex + 1}
                  </div>
                  <h5 className="text-lg font-medium text-gray-800 leading-relaxed">
                    {subQ.question}
                  </h5>
                </div>
              </div>

              {subQ.type === 'mcq' && (
                <div className="space-y-3">
                  {subQ.options?.map((option, optIndex) => (
                    <label
                      key={optIndex}
                      className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="radio"
                        name={`q${questionIndex}_sub${subIndex}`}
                        value={optIndex}
                        checked={answers[`${questionIndex}-${subIndex}`] === optIndex}
                        onChange={(e) => handleAnswerChange(questionIndex, subIndex, parseInt(e.target.value))}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-600 font-medium">
                        {String.fromCharCode(65 + optIndex)}.
                      </span>
                      <span className="text-gray-800">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {subQ.type === 'true-false' && (
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name={`q${questionIndex}_sub${subIndex}_tf`}
                      value="true"
                      checked={answers[`${questionIndex}-${subIndex}`] === true}
                      onChange={() => handleAnswerChange(questionIndex, subIndex, true)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 font-semibold">True</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name={`q${questionIndex}_sub${subIndex}_tf`}
                      value="false"
                      checked={answers[`${questionIndex}-${subIndex}`] === false}
                      onChange={() => handleAnswerChange(questionIndex, subIndex, false)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-700 font-semibold">False</span>
                  </label>
                </div>
              )}

              {subQ.type === 'essay' && (
                <div className="space-y-3">
                  <textarea
                    placeholder="Type your detailed answer here..."
                    value={answers[`${questionIndex}-${subIndex}`] || ''}
                    onChange={(e) => handleAnswerChange(questionIndex, subIndex, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {form.title} {isPreview && <span className="text-blue-600">(Preview)</span>}
              </h1>
            </div>
            {!isPreview && (
              <button
                onClick={handleSubmitTest}
                disabled={submitting}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Send className="w-5 h-5 mr-2" />
                )}
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Test Content */}
      <div className="max-w-6xl mx-auto p-6">
        {form.headerImage && (
          <div className="mb-6">
            <img 
              src={form.headerImage} 
              alt="Form Header" 
              className="w-full max-h-64 object-cover rounded-lg shadow-sm" 
            />
          </div>
        )}

        <div className="space-y-8">
          {form.questions?.map((question, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-600 text-white px-3 py-2 rounded-lg font-bold text-lg flex-shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {question.title || `Question ${index + 1}`}
                    </h2>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 capitalize">
                      {question.type.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {question.image && (
                <div className="mb-6">
                  <img 
                    src={question.image} 
                    alt="Question" 
                    className="max-w object-cover rounded-lg border border-gray-200 shadow-sm" 
                  />
                </div>
              )}

              {question.type === 'categorize' && renderCategorizeTest(question, index)}
              {question.type === 'cloze' && renderClozeTest(question, index)}
              {question.type === 'comprehension' && renderComprehensionTest(question, index)}
            </div>
          ))}
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

// Forms List Component
const FormsList = ({ forms, loading, onCreateNew, onEditForm, onTakeTest, onViewAnalytics, viewType }) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading forms...</span>
        </div>
      );
    }
  
    if (forms.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            {viewType === 'my-forms' ? 'No forms created yet' : 'No tests available'}
          </h3>
          <p className="text-gray-600 mb-6">
            {viewType === 'my-forms' 
              ? 'Create your first form to get started' 
              : 'No tests are currently available to take'
            }
          </p>
          {viewType === 'my-forms' && (
            <button
              onClick={onCreateNew}
              className="flex items-center mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Form
            </button>
          )}
        </div>
      );
    }
  
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.map((form) => {
          // Handle both possible data structures
          const questionCount = (form.questions && Array.isArray(form.questions)) 
            ? form.questions.length 
            : 0;
          
          return (
            <div key={form._id || form.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              {form.headerImage && (
                <img 
                  src={form.headerImage} 
                  alt="Form Header" 
                  className="w-full h-48 object-cover rounded-t-lg" 
                />
              )}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{form.title || 'Untitled Form'}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span>{questionCount} question{questionCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(form.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {/* Warning if no questions found */}
                {questionCount === 0 && (
                  <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-3">
                    ⚠️ Questions data not loaded properly
                  </div>
                )}
                
                {/* THIS IS THE UPDATED SECTION - Action buttons with Analytics */}
                <div className="flex space-x-2">
      {viewType === 'my-forms' ? (
        <>
          <button
            onClick={() => onEditForm(form)}
            className="flex items-center flex-1 justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </button>
          <button
            onClick={() => onTakeTest(form, true)} // Pass true for preview mode
            disabled={questionCount === 0}
            className="flex items-center flex-1 justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 mr-2" />
            Preview
          </button>
          <button
            onClick={() => onViewAnalytics(form)}
            className="flex items-center flex-1 justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </button>
        </>
      ) : (
        <button
          onClick={() => onTakeTest(form, false)} // Pass false for actual test mode
          disabled={questionCount === 0}
          className="flex items-center w-full justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4 mr-2" />
          Take Test
        </button>
      )}
    </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Main App Component
const FormCraftApp = () => {
    const [currentView, setCurrentView] = useState('home');
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedForm, setSelectedForm] = useState(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Load forms when needed
  const loadForms = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/forms`);
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data); // Debug log
        console.log('First form:', data[0]); // Debug log
        setForms(data);
      } else {
        console.error('Failed to load forms', response.status, response.statusText);
        toast.error('Failed to load forms. Please check if the server is running.', {
          position: "top-right",
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error('Error loading forms:', error);
      toast.error(`Error loading forms: ${error.message}`, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === 'my-forms' || currentView === 'take-test') {
      loadForms();
    }
  }, [currentView]);

  const handleCreateNew = () => {
    setCurrentView('form-builder');
  };

  const handleEditForm = (form) => {
    setSelectedForm(form);
    setCurrentView('form-builder');
  };

  const handleTakeTest = (form, isPreview = false) => {
    setSelectedForm(form);
    setIsPreviewMode(isPreview);
    setCurrentView('test-taking');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedForm(null);
    setIsPreviewMode(false);
  };

  
  const handleViewAnalytics = (form) => {
    setSelectedForm(form);
    setCurrentView('analytics');
  };

  const handleBackToForms = () => {
    setCurrentView('my-forms');
    setSelectedForm(null);
    setIsPreviewMode(false);
  };
  // Home View
  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg">
                  <PenTool className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">FormCraft</h1>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">Welcome back!</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Create Interactive Forms & Tests
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Build engaging categorization, cloze, and comprehension exercises with our intuitive drag-and-drop interface
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div 
              onClick={() => setCurrentView('my-forms')}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-100"
            >
              <div className="text-center">
                <div className="bg-blue-100 text-blue-600 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">My Forms</h3>
                <p className="text-gray-600 mb-6">
                  View, edit, and manage all your created forms. Build interactive exercises with drag-and-drop functionality.
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Edit className="w-4 h-4" />
                    <span>Create & Edit</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </div>
                </div>
              </div>
            </div>

            <div 
              onClick={() => setCurrentView('take-test')}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-100"
            >
              <div className="text-center">
                <div className="bg-green-100 text-green-600 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Take Tests</h3>
                <p className="text-gray-600 mb-6">
                  Browse and take available tests. Experience interactive categorization, cloze exercises, and comprehension questions.
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Play className="w-4 h-4" />
                    <span>Interactive</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Award className="w-4 h-4" />
                    <span>Scored</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-20">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">Powerful Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-purple-100 text-purple-600 p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <GripVertical className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Drag & Drop</h4>
                <p className="text-gray-600">Intuitive drag-and-drop interface for categorization and cloze exercises</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 text-green-600 p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Point System</h4>
                <p className="text-gray-600">Flexible scoring system with customizable points for each question</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 text-blue-600 p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Multiple Types</h4>
                <p className="text-gray-600">Support for categorization, cloze tests, and reading comprehension</p>
              </div>
            </div>
          </div>
        </div>

        {/* Toast Container */}
        <ToastContainer />
      </div>
    );
  }

  // My Forms View
  if (currentView === 'my-forms') {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackToHome}
                  className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Home
                </button>
                <h1 className="text-2xl font-bold text-gray-900">My Forms</h1>
              </div>
              <button
                onClick={handleCreateNew}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Form
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto p-6">
          <FormsList 
            forms={forms} 
            loading={loading} 
            onCreateNew={handleCreateNew}
            onEditForm={handleEditForm}
            onTakeTest={handleTakeTest}
            onViewAnalytics={handleViewAnalytics}
            viewType="my-forms"
          />
        </div>
      </div>
    );
  }

  // Take Test View
  if (currentView === 'take-test') {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackToHome}
                  className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Home
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Available Tests</h1>
              </div>
              <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg">
                <BookOpen className="w-4 h-4" />
                <span className="font-medium">{forms.length} tests available</span>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto p-6">
          <FormsList 
            forms={forms} 
            loading={loading} 
            onTakeTest={handleTakeTest}
            viewType="take-test"
          />
        </div>
      </div>
    );
  }

  // Test Taking View
  if (currentView === 'test-taking' && selectedForm) {
    return (
      <TestTaker 
        form={selectedForm} 
        onBack={() => setCurrentView('take-test')}
        isPreview={isPreviewMode}
      />
    );
  }
  if (currentView === 'analytics' && selectedForm) {
    return (
      <ResponseAnalytics 
        formId={selectedForm._id || selectedForm.id}
        formTitle={selectedForm.title}
        onBack={handleBackToForms}
      />
    );
  }
  // Form Builder View
  if (currentView === 'form-builder') {
    return <FormBuilder onBack={handleBackToForms} existingForm={selectedForm} />;
  }

  return null;
};

// Form Builder Component (simplified version of your existing CreateForm)
const FormBuilder = ({ onBack, existingForm }) => {
  const [form, setForm] = useState(existingForm || {
    title: '',
    headerImage: '',
    questions: []
  });
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formId, setFormId] = useState(existingForm?._id || null);

  const handleAddQuestion = (type) => {
    const newQuestion = { 
      type,
      title: '',
      ...(type === 'categorize' && { categories: [], items: [] }),
      ...(type === 'cloze' && { text: '', blanks: [] }),
      ...(type === 'comprehension' && { passage: '', subQuestions: [] })
    };
    
    setForm(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    setSelectedQuestionIndex(form.questions.length);
  };

  const handleUpdateQuestion = (updatedQuestion) => {
    const newQuestions = [...form.questions];
    newQuestions[selectedQuestionIndex] = updatedQuestion;
    setForm(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleDeleteQuestion = (index) => {
    const newQuestions = form.questions.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, questions: newQuestions }));
    if (selectedQuestionIndex >= newQuestions.length) {
      setSelectedQuestionIndex(newQuestions.length - 1);
    }
  };

  const handleSaveForm = async () => {
    if (!form.title.trim()) {
      toast.error('Please enter a form title', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
  
    if (form.questions.length === 0) {
      toast.error('Please add at least one question', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
  
    setSaving(true);
    try {
      if (formId) {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/forms/${formId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update form');
        }
  
        toast.success('Form updated successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/forms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save form');
        }
  
        const result = await response.json();
        setFormId(result.formId);
        toast.success(`Form saved successfully! Form ID: ${result.formId}`, {
          position: "top-right",
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error(`Error saving form: ${error.message}`, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedQuestion = selectedQuestionIndex !== null ? form.questions[selectedQuestionIndex] : null;

  if (showPreview) {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Editor
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Form Preview</h1>
              </div>
            </div>
          </div>
        </nav>
        <div className="max-w-6xl mx-auto p-6">
          <TestTaker form={form} onBack={() => setShowPreview(false)} isPreview={true} />
        </div>
        
        {/* Toast Container */}
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Form Builder</h1>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>
            <button
              onClick={handleSaveForm}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Saving...' : (formId ? 'Update Form' : 'Save Form')}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <FormHeader form={form} onUpdate={setForm} />
          <QuestionList
            questions={form.questions}
            onAddQuestion={handleAddQuestion}
            onSelectQuestion={setSelectedQuestionIndex}
            selectedQuestionIndex={selectedQuestionIndex}
            onDeleteQuestion={handleDeleteQuestion}
          />
        </div>
        
        {selectedQuestion && (
          <div className="mt-8 border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Edit Question {selectedQuestionIndex + 1}
              </h2>
              <button
                onClick={() => setSelectedQuestionIndex(null)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <QuestionEditor
                question={selectedQuestion}
                onUpdate={handleUpdateQuestion}
              />
            </div>
          </div>
        )}
      </div>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default FormCraftApp;