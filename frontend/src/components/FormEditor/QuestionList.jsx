import React from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export const QuestionList = ({ 
  questions = [], 
  onAddQuestion, 
  onSelectQuestion, 
  selectedQuestionIndex, 
  onDeleteQuestion,
  onReorderQuestions // New prop for handling question reordering
}) => {
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

  const handleDeleteQuestion = (index) => {
    if (onDeleteQuestion) {
      onDeleteQuestion(index);
    }
  };

  const handleSelectQuestion = (index) => {
    if (onSelectQuestion) {
      onSelectQuestion(index);
    }
  };

  // Handle drag end event
  const handleDragEnd = (result) => {
    // If dropped outside the list, do nothing
    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    // If dropped in the same position, do nothing
    if (sourceIndex === destinationIndex) {
      return;
    }

    // Call the reorder function with source and destination indices
    if (onReorderQuestions) {
      onReorderQuestions(sourceIndex, destinationIndex);
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

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="questions-list">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`space-y-2 ${snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg' : ''}`}
            >
              {questions.map((question, index) => (
                <Draggable 
                  key={`question-${index}`} 
                  draggableId={`question-${index}`} 
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`
                        group flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200
                        ${selectedQuestionIndex === index 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm hover:bg-gray-50'
                        }
                        ${snapshot.isDragging ? 'shadow-lg bg-white border-blue-400 rotate-2' : ''}
                      `}
                      onClick={() => handleSelectQuestion(index)}
                    >
                      {/* Drag Handle */}
                      <div
                        {...provided.dragHandleProps}
                        className="flex-shrink-0 mr-3 p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-grab active:cursor-grabbing"
                        onClick={(e) => e.stopPropagation()} // Prevent selection when clicking drag handle
                      >
                        <GripVertical size={16} />
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
                              Selected
                            </span>
                          )}
                          {snapshot.isDragging && (
                            <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                              Moving...
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {getQuestionPreview(question)}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this question?')) {
                              handleDeleteQuestion(index);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete question"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              {questions.length === 0 && (
                <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-4xl mb-4">📝</div>
                  <h4 className="text-lg font-medium text-gray-700 mb-2">No questions yet</h4>
                  <p className="text-gray-500">Click one of the "Add" buttons above to create your first question.</p>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};