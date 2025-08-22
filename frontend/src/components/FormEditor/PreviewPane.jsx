import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { GripVertical, Award, Clock, Target, CheckCircle, XCircle, Send, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';

export const PreviewPane = ({ form, mode = 'preview', onBack, onSubmit }) => {
  const [answers, setAnswers] = useState({});
  const [categoryItems, setCategoryItems] = useState({});
  const [blankAnswers, setBlankAnswers] = useState({});
  const [clozeOptions, setClozeOptions] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());
  
  // Initialize category items and cloze options for drag and drop
  useEffect(() => {
    const newCategoryItems = {};
    const newClozeOptions = {};
    
    form.questions?.forEach((question, qIndex) => {
      if (question.type === 'categorize') {
        newCategoryItems[qIndex] = {
          available: question.items?.map((item, itemIndex) => ({
            id: `item-${qIndex}-${itemIndex}`,
            text: item.text,
            belongsTo: item.belongsTo
          })) || [],
          categories: {}
        };
        question.categories?.forEach((category, catIndex) => {
          newCategoryItems[qIndex].categories[catIndex] = [];
        });
      }
      
      if (question.type === 'cloze') {
        // Initialize all available options for cloze questions
        const allOptions = [];
        if (question.blanks && question.blankOptions) {
          question.blanks.forEach((blank, index) => {
            const options = question.blankOptions[index];
            if (options) {
              // Add correct answer (but don't mark it as correct in test mode)
              allOptions.push({ 
                id: `option-${qIndex}-${index}-correct`,
                text: options.correct, 
                type: mode === 'preview' ? 'correct' : 'option',
                blankIndex: index,
                points: options.points || 0
              });
              // Add additional options
              options.additional?.forEach((option, optIndex) => {
                if (option.trim()) {
                  allOptions.push({ 
                    id: `option-${qIndex}-${index}-${optIndex}`,
                    text: option, 
                    type: 'additional', 
                    blankIndex: index,
                    points: 0
                  });
                }
              });
            }
          });
        }
        // Shuffle options
        newClozeOptions[qIndex] = {
          available: allOptions.sort(() => Math.random() - 0.5),
          blanks: {}
        };
        // Initialize blank slots
        question.blanks?.forEach((blank, index) => {
          newClozeOptions[qIndex].blanks[index] = null;
        });
      }
    });
    
    setCategoryItems(newCategoryItems);
    setClozeOptions(newClozeOptions);
  }, [form, mode]);

  const handleDragEnd = (result, questionIndex, questionType) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (questionType === 'categorize') {
      const newCategoryItems = { ...categoryItems };
      const questionItems = { ...newCategoryItems[questionIndex] };
      
      // Find the dragged item
      let draggedItem = null;
      if (source.droppableId === 'available') {
        draggedItem = questionItems.available.find(item => item.id === draggableId);
      } else {
        const sourceCategoryIndex = source.droppableId.replace('category-', '');
        draggedItem = questionItems.categories[sourceCategoryIndex].find(item => item.id === draggableId);
      }
      
      if (!draggedItem) return;
      
      // Remove item from source
      if (source.droppableId === 'available') {
        questionItems.available = questionItems.available.filter(item => item.id !== draggableId);
      } else {
        const sourceCategoryIndex = source.droppableId.replace('category-', '');
        questionItems.categories[sourceCategoryIndex] = questionItems.categories[sourceCategoryIndex].filter(
          item => item.id !== draggableId
        );
      }
      
      // Add item to destination
      if (destination.droppableId === 'available') {
        questionItems.available.splice(destination.index, 0, draggedItem);
      } else {
        const destCategoryIndex = destination.droppableId.replace('category-', '');
        questionItems.categories[destCategoryIndex].splice(destination.index, 0, draggedItem);
      }
      
      newCategoryItems[questionIndex] = questionItems;
      setCategoryItems(newCategoryItems);
    }
    
    if (questionType === 'cloze') {
      const newClozeOptions = { ...clozeOptions };
      const questionOptions = { ...newClozeOptions[questionIndex] };
      
      // Find the dragged option
      let draggedOption = null;
      if (source.droppableId === 'word-bank') {
        draggedOption = questionOptions.available.find(opt => opt.id === draggableId);
      } else {
        const sourceBlankIndex = source.droppableId.replace('blank-', '');
        draggedOption = questionOptions.blanks[sourceBlankIndex];
      }
      
      if (!draggedOption) return;
      
      // Remove option from source
      if (source.droppableId === 'word-bank') {
        questionOptions.available = questionOptions.available.filter(opt => opt.id !== draggableId);
      } else {
        const sourceBlankIndex = source.droppableId.replace('blank-', '');
        questionOptions.blanks[sourceBlankIndex] = null;
      }
      
      // Add option to destination
      if (destination.droppableId === 'word-bank') {
        questionOptions.available.splice(destination.index, 0, draggedOption);
      } else {
        const destBlankIndex = destination.droppableId.replace('blank-', '');
        // If destination blank already has an item, move it back to available
        if (questionOptions.blanks[destBlankIndex]) {
          questionOptions.available.push(questionOptions.blanks[destBlankIndex]);
        }
        questionOptions.blanks[destBlankIndex] = draggedOption;
      }
      
      newClozeOptions[questionIndex] = questionOptions;
      setClozeOptions(newClozeOptions);
    }
  };

  const handleAnswerChange = (questionIndex, subQuestionIndex, value) => {
    setAnswers(prev => ({
      ...prev,
      [`${questionIndex}-${subQuestionIndex}`]: value
    }));
  };

  const handleSubmitTest = async () => {
    if (mode === 'preview') {
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
      // Calculate completion time in seconds
      const completionTimeMs = Date.now() - startTime;
      const completionTimeSeconds = Math.floor(completionTimeMs / 1000);

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
              Object.keys(categoryItems[questionIndex].categories).forEach(categoryIndex => {
                const items = categoryItems[questionIndex].categories[categoryIndex];
                if (items && items.length > 0) {
                  items.forEach(item => {
                    response.categorizedItems.push({
                      itemText: item.text,
                      selectedCategory: question.categories[categoryIndex].name
                    });
                  });
                }
              });
            }
            break;

          case 'cloze':
            response.blankAnswers = [];
            if (clozeOptions[questionIndex]) {
              Object.keys(clozeOptions[questionIndex].blanks).forEach(blankIndex => {
                const filledOption = clozeOptions[questionIndex].blanks[blankIndex];
                if (filledOption) {
                  response.blankAnswers.push({
                    blankIndex: parseInt(blankIndex),
                    userAnswer: filledOption.text
                  });
                }
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
        completionTime: completionTimeSeconds // Send time in seconds
      };

      console.log('Sending test response:', testResponse);
      console.log('Completion time (seconds):', completionTimeSeconds);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/forms/${form._id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testResponse),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Response result:', result);
        
        toast.success('Thank you for submitting!', {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
        });

        // Call the onSubmit callback if provided
        if (onSubmit) {
          onSubmit(result);
        }

        // Redirect after toast shows
        setTimeout(() => {
          if (onBack) onBack();
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
    const questionItems = categoryItems[questionIndex];
    if (!questionItems) return null;

    return (
      <DragDropContext onDragEnd={(result) => handleDragEnd(result, questionIndex, 'categorize')}>
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
              const itemsInCategory = questionItems.categories[catIndex] || [];
              const pointsPerItem = category.points || 0;
              const totalCategoryPoints = itemsInCategory.length * pointsPerItem;

              return (
                <Droppable key={catIndex} droppableId={`category-${catIndex}`}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`border-2 border-dashed rounded-lg p-4 min-h-[150px] bg-white transition-colors ${
                        snapshot.isDraggingOver 
                          ? 'border-blue-400 bg-blue-50' 
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800">{category.name}</h4>
                        {mode === 'preview' && (
                          <div className="flex items-center space-x-1">
                            <Target className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">
                              {pointsPerItem}pt each
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {itemsInCategory.length > 0 && mode === 'preview' && (
                        <div className="bg-green-50 border border-green-200 rounded p-2 mb-3">
                          <div className="text-xs text-green-700">
                            {itemsInCategory.length} items • {totalCategoryPoints} total points
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        {itemsInCategory.map((item, itemIndex) => (
                          <Draggable key={item.id} draggableId={item.id} index={itemIndex}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`${mode === 'preview' ? 'bg-green-100 border-green-300 text-green-800' : 'bg-blue-100 border-blue-300 text-blue-800'} border px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between transition-all ${
                                  snapshot.isDragging ? 'shadow-lg rotate-2 scale-105' : 'hover:shadow-md cursor-move'
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  <GripVertical className="w-4 h-4 text-gray-600" />
                                  <span>{item.text}</span>
                                </div>
                                {mode === 'preview' && (
                                  <div className="bg-green-200 text-green-800 px-2 py-0.5 rounded-full text-xs font-bold">
                                    +{pointsPerItem}
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {itemsInCategory.length === 0 && (
                          <div className="text-gray-400 text-sm italic text-center py-8">
                            Drop items here
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>

          {/* Available Items */}
          {questionItems.available.length > 0 && (
            <div className="border-t pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <h4 className="text-lg font-medium text-gray-700">Items to Categorize:</h4>
                <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                  {questionItems.available.length} remaining
                </div>
              </div>
              
              <Droppable droppableId="available" direction="horizontal">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex flex-wrap gap-3 p-3 rounded-lg transition-colors min-h-[60px] ${
                      snapshot.isDraggingOver ? 'bg-gray-100' : ''
                    }`}
                  >
                    {questionItems.available.map((item, itemIndex) => {
                      const category = question.categories?.find(cat => cat.name === item.belongsTo);
                      const points = category?.points || 0;
                      
                      return (
                        <Draggable key={item.id} draggableId={item.id} index={itemIndex}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white border-2 border-blue-300 text-blue-800 px-4 py-3 rounded-lg transition-all flex items-center space-x-2 ${
                                snapshot.isDragging ? 'shadow-lg rotate-2 scale-105' : 'hover:shadow-lg transform hover:scale-105 cursor-move'
                              }`}
                            >
                              <GripVertical className="w-4 h-4 text-blue-400" />
                              <span className="font-medium">{item.text}</span>
                              {mode === 'preview' && (
                                <div className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-bold">
                                  {points}pt
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          )}
        </div>
      </DragDropContext>
    );
  };

  const renderClozePreview = (question, questionIndex) => {
    const questionOptions = clozeOptions[questionIndex];
    if (!questionOptions) return null;

    const renderPassageWithBlanks = () => {
      let passageText = question.text || '';
      const regex = /\[([^\]]+)\]/g;
      let match;
      let result = [];
      let lastIndex = 0;
      let blankIndex = 0;

      while ((match = regex.exec(passageText)) !== null) {
        // Add text before the blank
        if (match.index > lastIndex) {
          result.push(
            <span key={`text-${blankIndex}-before`}>
              {passageText.substring(lastIndex, match.index)}
            </span>
          );
        }

        // Add the droppable blank
        const points = question.blankOptions?.[blankIndex]?.points || 0;
        const filledOption = questionOptions.blanks[blankIndex];
        
        result.push(
          <Droppable key={`blank-${blankIndex}`} droppableId={`blank-${blankIndex}`}>
            {(provided, snapshot) => (
              <span
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`inline-block min-w-[100px] min-h-[40px] border-2 border-dashed rounded-lg mx-1 px-3 py-2 transition-colors relative ${
                  snapshot.isDraggingOver 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-300'
                } ${filledOption ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'}`}
                style={{ verticalAlign: 'middle' }}
              >
                {filledOption ? (
                  <Draggable draggableId={filledOption.id} index={0}>
                    {(provided, snapshot) => (
                      <span
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md transition-all ${
                          mode === 'preview' && filledOption.type === 'correct' 
                            ? 'bg-green-100 border border-green-300 text-green-800' 
                            : 'bg-blue-100 border border-blue-300 text-blue-800'
                        } ${
                          snapshot.isDragging 
                            ? 'shadow-lg rotate-2 scale-105' 
                            : 'hover:shadow-md cursor-move'
                        }`}
                      >
                        <GripVertical className="w-3 h-3 text-gray-400" />
                        <span className="font-medium text-sm">{filledOption.text}</span>
                        {mode === 'preview' && (
                          <span className={`px-1 py-0.5 rounded-full text-xs font-bold ${
                            filledOption.points > 0 
                              ? 'bg-green-200 text-green-800' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {filledOption.points}pt
                          </span>
                        )}
                      </span>
                    )}
                  </Draggable>
                ) : (
                  <span className="text-gray-400 text-sm italic">
                    ___
                  </span>
                )}
                {provided.placeholder}
              </span>
            )}
          </Droppable>
        );

        lastIndex = regex.lastIndex;
        blankIndex++;
      }

      // Add remaining text
      if (lastIndex < passageText.length) {
        result.push(
          <span key="text-end">
            {passageText.substring(lastIndex)}
          </span>
        );
      }

      return result;
    };

    return (
      <DragDropContext onDragEnd={(result) => handleDragEnd(result, questionIndex, 'cloze')}>
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

          {/* Passage with Interactive Blanks */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Complete the passage:</h4>
            <div className="text-lg leading-relaxed">
              {renderPassageWithBlanks()}
            </div>
          </div>

          {/* Word Bank */}
          {questionOptions.available.length > 0 && (
            <div className="border-t pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <h4 className="text-lg font-medium text-gray-700">Word Bank:</h4>
                <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                  {questionOptions.available.length} words available
                </div>
              </div>
              
              <Droppable droppableId="word-bank" direction="horizontal">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex flex-wrap gap-3 p-3 rounded-lg transition-colors min-h-[60px] ${
                      snapshot.isDraggingOver ? 'bg-gray-100' : ''
                    }`}
                  >
                    {questionOptions.available.map((option, index) => (
                      <Draggable key={option.id} draggableId={option.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`px-4 py-3 rounded-lg transition-all flex items-center space-x-2 ${
                              mode === 'preview' && option.type === 'correct' 
                                ? 'bg-green-100 border-2 border-green-300 text-green-800' 
                                : 'bg-blue-100 border-2 border-blue-300 text-blue-800'
                            } ${
                              snapshot.isDragging 
                                ? 'shadow-lg rotate-2 scale-105' 
                                : 'hover:shadow-lg transform hover:scale-105 cursor-move'
                            }`}
                          >
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{option.text}</span>
                            {mode === 'preview' && (
                              <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                option.points > 0 
                                  ? 'bg-green-200 text-green-800' 
                                  : 'bg-gray-200 text-gray-600'
                              }`}>
                                {option.points}pt
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              
              {mode === 'preview' && (
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
              )}
            </div>
          )}
        </div>
      </DragDropContext>
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
              {mode === 'preview' && (
                <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {question.passage.length} characters
                </div>
              )}
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
                {mode === 'preview' && (
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-bold">
                      {subQ.points || 1} pts
                    </span>
                  </div>
                )}
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
                  {mode === 'preview' && (
                    <div className="text-xs text-gray-500">
                      This is an essay question. Provide a detailed, well-structured response.
                    </div>
                  )}
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
      {/* Single Header - Different styling for test vs preview */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {form.title || 'Untitled Form'}
                {mode === 'preview' && (
                  <span className="text-blue-600 ml-2">(Preview)</span>
                )}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {mode === 'preview' && totalPoints > 0 && (
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
        </div>
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
                        {(question.type === 'categorize' || question.type === 'cloze' || question.type === 'comprehension') && mode === 'preview' && (
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

                {/* Question Image - Full width styling */}
                {(question.headerImage || question.image) && (
                  <div className="mb-6">
                    <img 
                      src={question.image || question.headerImage} 
                      alt="Question" 
                      className="w-full h-[900px] object-cover rounded-lg border border-gray-200 shadow-sm" 
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
              Form {mode} • {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
              {mode === 'test' && (
                <span className="ml-2">• Started {new Date(startTime).toLocaleTimeString()}</span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {mode === 'test' ? (
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
              ) : (
                <>
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Estimated time: {Math.max(5, totalQuestions * 3)} minutes</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};