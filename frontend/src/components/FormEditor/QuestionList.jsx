import React, { useState, useEffect, useRef } from 'react';
import { Plus, Save, Eye, Trash2, Upload, Move, GripVertical, X, Loader2, Minus, Copy } from 'lucide-react';

export const QuestionList = ({ 
  questions = [], 
  onAddQuestion, 
  onSelectQuestion, 
  selectedQuestionIndex, 
  onDeleteQuestion, 
  onReorderQuestions 
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [insertPosition, setInsertPosition] = useState(null);
  const draggedElementRef = useRef(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    setIsDragging(true);
    draggedElementRef.current = e.target;
    
    // Set drag effect
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    
    // Create a custom drag image to avoid conflicts
    const dragImage = e.target.cloneNode(true);
    dragImage.style.transform = 'rotate(5deg)';
    dragImage.style.opacity = '0.8';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 20, 20);
    
    // Clean up the temporary element
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 0);
  };

  const calculateInsertPosition = (e, targetElement) => {
    const rect = targetElement.getBoundingClientRect();
    const midpoint = rect.top + (rect.height / 2);
    return e.clientY < midpoint ? 'above' : 'below';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedIndex === null || draggedIndex === index) return;
    
    e.dataTransfer.dropEffect = 'move';
    
    const position = calculateInsertPosition(e, e.currentTarget);
    setDragOverIndex(index);
    setInsertPosition(position);
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedIndex === null || draggedIndex === index) return;
    
    const position = calculateInsertPosition(e, e.currentTarget);
    setDragOverIndex(index);
    setInsertPosition(position);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only clear if we're actually leaving the container
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX: x, clientY: y } = e;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      // Add a small delay to prevent flickering
      setTimeout(() => {
        setDragOverIndex(null);
        setInsertPosition(null);
      }, 50);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      resetDragState();
      return;
    }

    const newQuestions = [...questions];
    const draggedQuestion = newQuestions[draggedIndex];
    
    // Remove the dragged item
    newQuestions.splice(draggedIndex, 1);
    
    // Calculate insertion index
    let insertIndex = dropIndex;
    
    if (insertPosition === 'below') {
      insertIndex = dropIndex + 1;
    }
    
    // Adjust for the removed item
    if (draggedIndex < dropIndex) {
      insertIndex = insertIndex - 1;
    }
    
    // Ensure bounds
    insertIndex = Math.max(0, Math.min(insertIndex, newQuestions.length));
    
    // Insert at new position
    newQuestions.splice(insertIndex, 0, draggedQuestion);
    
    if (onReorderQuestions) {
      onReorderQuestions(newQuestions);
    }
    
    resetDragState();
  };

  const handleDragEnd = (e) => {
    e.preventDefault();
    resetDragState();
  };

  const resetDragState = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
    setInsertPosition(null);
    draggedElementRef.current = null;
  };

  const handleDropAtEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedIndex === null || draggedIndex === questions.length - 1) {
      resetDragState();
      return;
    }

    const newQuestions = [...questions];
    const draggedQuestion = newQuestions[draggedIndex];
    
    newQuestions.splice(draggedIndex, 1);
    newQuestions.push(draggedQuestion);
    
    if (onReorderQuestions) {
      onReorderQuestions(newQuestions);
    }
    
    resetDragState();
  };

  const questionTypes = [
    { type: 'categorize', label: 'Categorize', icon: '📂' },
    { type: 'cloze', label: 'Cloze', icon: '📝' },
    { type: 'comprehension', label: 'Comprehension', icon: '📖' }
  ];

  const getQuestionTypeIcon = (type) => {
    const questionType = questionTypes.find(qt => qt.type === type);
    return questionType ? questionType.icon : '❓';
  };

  const getQuestionTypeLabel = (type) => {
    const questionType = questionTypes.find(qt => qt.type === type);
    return questionType ? questionType.label : 'Unknown';
  };

  const getQuestionPreview = (question) => {
    if (question.title?.trim()) {
      return question.title;
    }
    
    switch (question.type) {
      case 'categorize':
        const categoryCount = question.categories?.length || 0;
        const itemCount = question.items?.length || 0;
        return `${categoryCount} categories, ${itemCount} items`;
      case 'cloze':
        const blanksCount = question.blanks?.length || 0;
        return blanksCount ? `${blanksCount} blanks` : 'No blanks yet';
      case 'comprehension':
        const subQuestionCount = question.subQuestions?.length || 0;
        return subQuestionCount ? `${subQuestionCount} questions` : 'No questions yet';
      default:
        return `Untitled ${question.type} question`;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Questions ({questions.length})
        </h3>
        <div className="flex space-x-2">
          {questionTypes.map((qt) => (
            <button
              key={qt.type}
              onClick={() => onAddQuestion && onAddQuestion(qt.type)}
              className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm transition-colors"
            >
              <span className="mr-2">{qt.icon}</span>
              Add {qt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 relative">
        {questions && questions.length > 0 ? (
          <>
            {questions.map((question, index) => (
              <div 
                key={`question-${index}`} 
                className="relative"
                style={{ 
                  // Ensure proper stacking context
                  position: 'relative',
                  zIndex: draggedIndex === index ? 1000 : 1
                }}
              >
                {/* Insertion line above */}
                {dragOverIndex === index && 
                 insertPosition === 'above' && 
                 draggedIndex !== index && 
                 isDragging && (
                  <div 
                    className="absolute left-0 right-0 flex items-center justify-center"
                    style={{ 
                      top: '-4px', 
                      zIndex: 1001,
                      pointerEvents: 'none'
                    }}
                  >
                    <div className="h-1 bg-green-500 rounded-full shadow-lg flex-1 mx-4 relative">
                      <div className="absolute -left-2 -top-1.5 w-4 h-4 bg-green-500 rounded-full shadow-md"></div>
                      <div className="absolute -right-2 -top-1.5 w-4 h-4 bg-green-500 rounded-full shadow-md"></div>
                    </div>
                  </div>
                )}
                
                <div
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`
                    group flex items-center p-4 border rounded-lg transition-all duration-200 relative
                    ${draggedIndex === index 
                      ? 'opacity-50 scale-98 shadow-xl border-blue-400 bg-blue-50 z-50' 
                      : ''
                    }
                    ${dragOverIndex === index && draggedIndex !== index && isDragging
                      ? 'border-blue-500 bg-blue-50 border-2 shadow-md scale-101'
                      : selectedQuestionIndex === index 
                        ? 'border-blue-500 bg-blue-50 cursor-pointer' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md cursor-pointer hover:bg-gray-50'
                    }
                  `}
                  onClick={() => onSelectQuestion && onSelectQuestion(index)}
                  style={{
                    // Prevent text selection during drag
                    userSelect: draggedIndex === index ? 'none' : 'auto',
                    // Ensure smooth transitions
                    transform: draggedIndex === index ? 'scale(0.98)' : 
                               (dragOverIndex === index && draggedIndex !== index && isDragging) ? 'scale(1.01)' : 'scale(1)',
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  {/* Drag Handle */}
                  <div 
                    className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded mr-3 transition-colors flex-shrink-0"
                    title="Drag to reorder"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      // Prevent the parent click event
                    }}
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Question Icon */}
                  <div className="text-xl mr-3 flex-shrink-0">
                    {getQuestionTypeIcon(question.type)}
                  </div>

                  {/* Question Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1 flex-wrap">
                      <span className="font-medium text-gray-800">
                        Question {index + 1}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {getQuestionTypeLabel(question.type)}
                      </span>
                      {selectedQuestionIndex === index && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                          Editing
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {getQuestionPreview(question)}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {/* Move Up Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (index > 0 && onReorderQuestions) {
                          const newQuestions = [...questions];
                          [newQuestions[index], newQuestions[index - 1]] = 
                            [newQuestions[index - 1], newQuestions[index]];
                          onReorderQuestions(newQuestions);
                        }
                      }}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Move up"
                    >
                      <Move size={14} className="rotate-180" />
                    </button>

                    {/* Move Down Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (index < questions.length - 1 && onReorderQuestions) {
                          const newQuestions = [...questions];
                          [newQuestions[index], newQuestions[index + 1]] = 
                            [newQuestions[index + 1], newQuestions[index]];
                          onReorderQuestions(newQuestions);
                        }
                      }}
                      disabled={index === questions.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Move down"
                    >
                      <Move size={14} />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDeleteQuestion && confirm('Are you sure you want to delete this question?')) {
                          onDeleteQuestion(index);
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete question"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                {/* Insertion line below */}
                {dragOverIndex === index && 
                 insertPosition === 'below' && 
                 draggedIndex !== index && 
                 isDragging && (
                  <div 
                    className="absolute left-0 right-0 flex items-center justify-center"
                    style={{ 
                      bottom: '-4px', 
                      zIndex: 1001,
                      pointerEvents: 'none'
                    }}
                  >
                    <div className="h-1 bg-green-500 rounded-full shadow-lg flex-1 mx-4 relative">
                      <div className="absolute -left-2 -top-1.5 w-4 h-4 bg-green-500 rounded-full shadow-md"></div>
                      <div className="absolute -right-2 -top-1.5 w-4 h-4 bg-green-500 rounded-full shadow-md"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Drop zone at the end */}
            {isDragging && draggedIndex !== questions.length - 1 && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={handleDropAtEnd}
                className="p-4 border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg text-center text-sm text-blue-600 transition-all duration-200 hover:bg-blue-100 hover:border-blue-400"
                style={{ zIndex: 999 }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <GripVertical className="w-4 h-4" />
                  <span>Drop here to move to end</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-4xl mb-4">📝</div>
            <h4 className="text-lg font-medium text-gray-700 mb-2">No questions yet</h4>
            <p className="text-gray-500">Click one of the "Add" buttons above to create your first question.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Demo component to show the drag and drop functionality
const DragDropDemo = () => {
  const [questions, setQuestions] = useState([
    { type: 'comprehension', title: 'Reading Comprehension 1', subQuestions: [{}, {}, {}] },
    { type: 'categorize', title: 'Category Exercise', categories: ['A', 'B'], items: ['1', '2', '3'] },
    { type: 'cloze', title: 'Fill in the Blanks', blanks: [{}, {}] },
    { type: 'comprehension', title: 'Reading Comprehension 2', subQuestions: [{}] },
    { type: 'categorize', title: 'Another Category', categories: ['X', 'Y', 'Z'], items: ['Item 1', 'Item 2'] },
    { type: 'cloze', title: 'Complex Cloze Test', blanks: [{}, {}, {}, {}] }
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleAddQuestion = (type) => {
    const newQuestion = { 
      type, 
      title: `New ${type} question`,
      ...(type === 'comprehension' ? { subQuestions: [] } : {}),
      ...(type === 'categorize' ? { categories: [], items: [] } : {}),
      ...(type === 'cloze' ? { blanks: [] } : {})
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleReorderQuestions = (newQuestions) => {
    setQuestions(newQuestions);
    if (selectedIndex >= newQuestions.length) {
      setSelectedIndex(Math.max(0, newQuestions.length - 1));
    }
  };

  const handleDeleteQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    if (selectedIndex >= index) {
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Enhanced Drag & Drop Question Reordering</h1>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-800 mb-2">✨ Key Features Fixed:</h2>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• <strong>Smooth drag animations</strong> - No more jumpy movements</li>
            <li>• <strong>Clear visual feedback</strong> - Green insertion line shows exactly where items will drop</li>
            <li>• <strong>Better z-index management</strong> - Proper layering prevents CSS conflicts</li>
            <li>• <strong>Improved event handling</strong> - Prevents unwanted clicks during drag operations</li>
            <li>• <strong>Custom drag image</strong> - Consistent drag appearance across browsers</li>
            <li>• <strong>Enhanced drop zone</strong> - Clear drop target at the end of the list</li>
          </ul>
        </div>
        
        <QuestionList
          questions={questions}
          onAddQuestion={handleAddQuestion}
          onSelectQuestion={setSelectedIndex}
          selectedQuestionIndex={selectedIndex}
          onDeleteQuestion={handleDeleteQuestion}
          onReorderQuestions={handleReorderQuestions}
        />
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 mt-4">
          <h3 className="font-semibold text-gray-800 mb-2">Current Order:</h3>
          <div className="text-sm text-gray-600">
            {questions.map((q, i) => (
              <div key={i} className="flex items-center space-x-2 mb-1">
                <span className="w-8 text-center font-mono bg-gray-100 rounded px-1">{i + 1}.</span>
                <span className="font-medium">{q.title}</span>
                <span className="text-gray-400 text-xs">({q.type})</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
          <h3 className="font-semibold text-green-800 mb-2">🎯 How to Use:</h3>
          <ol className="text-green-700 text-sm space-y-1">
            <li>1. Grab any question by the grip handle (⋮⋮) on the left</li>
            <li>2. Drag it over another question - watch for the green insertion line</li>
            <li>3. Drop above or below any question to reorder</li>
            <li>4. Use the drop zone at the bottom to move items to the end</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default DragDropDemo;