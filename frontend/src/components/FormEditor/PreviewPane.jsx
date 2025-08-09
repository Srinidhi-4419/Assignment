import React, { useState, useEffect, useRef } from 'react';
import { GripVertical, Award, Clock, Target, CheckCircle, XCircle } from 'lucide-react';

export const PreviewPane = ({ form }) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOption, setDraggedOption] = useState(null);
  const [answers, setAnswers] = useState({});
  const [categoryItems, setCategoryItems] = useState({});
  const [blankAnswers, setBlankAnswers] = useState({});
  
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

  const getTotalPoints = () => {
    let total = 0;
    form.questions?.forEach(question => {
      if (question.type === 'categorize') {
        question.items?.forEach(item => {
          const category = question.categories?.find(cat => cat.name === item.belongsTo);
          total += category?.points || 0;
        });
      } else if (question.type === 'cloze') {
        question.blanks?.forEach((blank, index) => {
          const options = question.blankOptions?.[index];
          total += options?.points || 0;
        });
      } else if (question.type === 'comprehension') {
        question.subQuestions?.forEach(subQ => {
          total += subQ.points || 1;
        });
      }
    });
    return total;
  };

  const renderCategorizePreview = (question, questionIndex) => {
    const availableItems = question.items?.filter(item => {
      return !Object.values(categoryItems[questionIndex] || {}).some(catItems => 
        catItems.includes(item.text)
      );
    }) || [];

    return (
      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <GripVertical className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">Instructions:</span>
          </div>
          <p className="text-blue-700 text-sm">
            Drag the items below into the correct categories. Each item belongs to exactly one category.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {question.categories?.map((category, catIndex) => {
            const itemsInCategory = categoryItems[questionIndex]?.[catIndex] || [];
            const pointsPerItem = category.points || 0;
            const totalCategoryPoints = itemsInCategory.length * pointsPerItem;

            return (
              <div
                key={catIndex}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[150px] bg-white hover:border-blue-300 transition-colors"
                onDrop={(e) => handleCategoryDrop(e, questionIndex, catIndex)}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800">{category.name}</h4>
                  <div className="flex items-center space-x-1">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">
                      {pointsPerItem}pt each
                    </span>
                  </div>
                </div>
                
                {itemsInCategory.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded p-2 mb-3">
                    <div className="text-xs text-green-700">
                      {itemsInCategory.length} items • {totalCategoryPoints} total points
                    </div>
                  </div>
                )}

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
                      <div className="bg-green-200 text-green-800 px-2 py-0.5 rounded-full text-xs font-bold">
                        +{pointsPerItem}
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

        {/* Available Items */}
        {availableItems.length > 0 && (
          <div className="border-t pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <h4 className="text-lg font-medium text-gray-700">Items to Categorize:</h4>
              <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                {availableItems.length} remaining
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {availableItems.map((item, itemIndex) => {
                const category = question.categories?.find(cat => cat.name === item.belongsTo);
                const points = category?.points || 0;
                
                return (
                  <div
                    key={itemIndex}
                    draggable
                    onDragStart={(e) => handleCategorizeItemDrag(e, item, questionIndex)}
                    className="bg-white border-2 border-blue-300 text-blue-800 px-4 py-3 rounded-lg cursor-move hover:shadow-lg transition-all transform hover:scale-105 flex items-center space-x-2"
                  >
                    <GripVertical className="w-4 h-4 text-blue-400" />
                    <span className="font-medium">{item.text}</span>
                    <div className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-bold">
                      {points}pt
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderClozePreview = (question, questionIndex) => {
    const getAllOptions = () => {
      const allOptions = [];
      if (question.blanks && question.blankOptions) {
        question.blanks.forEach((blank, index) => {
          const options = question.blankOptions[index];
          if (options) {
            // Add correct answer
            allOptions.push({ text: options.correct, type: 'correct', blankIndex: index });
            // Add additional options
            options.additional?.forEach((option) => {
              if (option.trim()) {
                allOptions.push({ text: option, type: 'additional', blankIndex: index });
              }
            });
          }
        });
      }
      return allOptions.sort(() => Math.random() - 0.5); // Shuffle options
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
        const points = question.blankOptions?.[blankIndex]?.points || 0;
        const filledAnswer = blankAnswers[questionIndex]?.[blankIndex];
        
        result += `<span 
          class="inline-block min-w-[100px] border-b-2 border-blue-300 mx-1 px-3 py-2 bg-blue-50 drop-zone relative text-center font-medium cursor-pointer hover:bg-blue-100 transition-colors" 
          data-blank-index="${blankIndex}"
          style="min-height: 32px;"
        >${filledAnswer || '____'}<span class="absolute -top-2 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold" style="font-size: 10px;">${points}pt</span></span>`;
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
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <GripVertical className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">Instructions:</span>
          </div>
          <p className="text-blue-700 text-sm">
            Drag the words from the word bank below to fill in the blanks in the passage.
          </p>
        </div>

        {/* Passage with Blanks */}
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

        {/* Word Bank */}
        {availableOptions.length > 0 && (
          <div className="border-t pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <h4 className="text-lg font-medium text-gray-700">Word Bank:</h4>
              <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                {availableOptions.length} words available
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {availableOptions.map((option, index) => {
                const points = option.type === 'correct' 
                  ? (question.blankOptions?.[option.blankIndex]?.points || 0) 
                  : 0;
                
                return (
                  <div
                    key={index}
                    draggable
                    onDragStart={(e) => handleClozeDrag(e, option.text, questionIndex, option.blankIndex)}
                    className={`px-4 py-3 rounded-lg cursor-move transition-all transform hover:scale-105 hover:shadow-lg flex items-center space-x-2 ${
                      option.type === 'correct' 
                        ? 'bg-green-100 border-2 border-green-300 text-green-800' 
                        : 'bg-blue-100 border-2 border-blue-300 text-blue-800'
                    }`}
                  >
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{option.text}</span>
                    <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      points > 0 
                        ? 'bg-green-200 text-green-800' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {points}pt
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex items-center space-x-4 mt-4 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                <span>Correct answers (award points)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                <span>Distractors (no points)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderComprehensionPreview = (question, questionIndex) => {
    return (
      <div className="space-y-6">
        {/* Passage */}
        {question.passage && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <h4 className="text-lg font-semibold text-gray-800">Reading Passage</h4>
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                {question.passage.length} characters
              </div>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-800 leading-relaxed">{question.passage}</p>
            </div>
          </div>
        )}

        {/* Questions */}
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
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Target className="w-4 h-4 text-green-600" />
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-bold">
                    {subQ.points || 1} pts
                  </span>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                  />
                  <div className="text-xs text-gray-500">
                    This is an essay question. Provide a detailed, well-structured response.
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const totalPoints = getTotalPoints();
  const totalQuestions = form.questions?.length || 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Form Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {form.title || 'Untitled Form'}
          </h1>
          <div className="flex items-center space-x-4">
            {totalPoints > 0 && (
              <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-full flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span className="font-bold">{totalPoints} Total Points</span>
              </div>
            )}
            <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-sm font-medium">
              {totalQuestions} Question{totalQuestions !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {form.headerImage && (
          <img 
            src={form.headerImage} 
            alt="Form Header" 
            className="w-full max-h-64 object-cover rounded-lg shadow-sm" 
          />
        )}
      </div>

      {/* Questions */}
      <div className="p-6">
        {form.questions?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-medium mb-2">No questions yet</h3>
            <p>Add questions to see them in the preview</p>
          </div>
        ) : (
          <div className="space-y-8">
            {form.questions?.map((question, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                {/* Question Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-600 text-white px-3 py-2 rounded-lg font-bold text-lg flex-shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {question.title || `Untitled ${question.type} question`}
                      </h2>
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 capitalize">
                          {question.type.replace('-', ' ')}
                        </span>
                        {(question.type === 'categorize' || question.type === 'cloze' || question.type === 'comprehension') && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <Target className="w-4 h-4" />
                            <span className="text-sm font-medium">
      {(() => {
                                if (question.type === 'categorize') {
                                  return question.items?.reduce((total, item) => {
                                    const category = question.categories?.find(cat => cat.name === item.belongsTo);
                                    return total + (category?.points || 0);
                                  }, 0) || 0;
                                } else if (question.type === 'cloze') {
                                  return question.blanks?.reduce((total, blank, index) => {
                                    const options = question.blankOptions?.[index];
                                    return total + (options?.points || 0);
                                  }, 0) || 0;
                                } else if (question.type === 'comprehension') {
                                  return question.subQuestions?.reduce((total, subQ) => total + (subQ.points || 1), 0) || 0;
                                }
                                return 0;
                              })()} points
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {question.image && (
                  <div className="mb-6">
                    <img 
                      src={question.image} 
                      alt="Question" 
                      className="max-w-md max-h-48 object-cover rounded-lg border border-gray-200 shadow-sm" 
                    />
                  </div>
                )}

                {/* Question Content */}
                {question.type === 'categorize' && renderCategorizePreview(question, index)}
                {question.type === 'cloze' && renderClozePreview(question, index)}
                {question.type === 'comprehension' && renderComprehensionPreview(question, index)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Footer */}
      {form.questions?.length > 0 && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Form preview • {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center space-x-4">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Estimated time: {Math.max(5, totalQuestions * 3)} minutes</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};