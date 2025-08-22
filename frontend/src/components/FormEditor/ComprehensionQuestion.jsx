import React, { useState } from 'react';
import { Plus, Save, Eye, Trash2, Upload, Move, GripVertical, X, Loader2, Minus, Copy } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export const ComprehensionQuestion = ({ question, onUpdate }) => {
  const addSubQuestion = () => {
    const subQuestions = [...(question.subQuestions || []), { 
      type: 'mcq', 
      question: '', 
      options: ['', ''], // Start with 2 options instead of 4
      answer: 0,
      points: 1
    }];
    onUpdate({ ...question, subQuestions });
  };

  const updateSubQuestion = (index, field, value) => {
    const subQuestions = [...question.subQuestions];
    subQuestions[index] = { ...subQuestions[index], [field]: value };
    onUpdate({ ...question, subQuestions });
  };

  const updateOption = (qIndex, optIndex, value) => {
    const subQuestions = [...question.subQuestions];
    subQuestions[qIndex].options[optIndex] = value;
    onUpdate({ ...question, subQuestions });
  };

  const addOption = (qIndex) => {
    const subQuestions = [...question.subQuestions];
    subQuestions[qIndex].options.push('');
    onUpdate({ ...question, subQuestions });
  };

  const removeOption = (qIndex, optIndex) => {
    const subQuestions = [...question.subQuestions];
    if (subQuestions[qIndex].options.length > 2) { // Minimum 2 options
      subQuestions[qIndex].options.splice(optIndex, 1);
      // Adjust answer if it was pointing to removed option or beyond
      if (subQuestions[qIndex].answer >= optIndex) {
        subQuestions[qIndex].answer = Math.max(0, subQuestions[qIndex].answer - 1);
      }
      onUpdate({ ...question, subQuestions });
    }
  };

  const removeSubQuestion = (index) => {
    const subQuestions = [...question.subQuestions];
    subQuestions.splice(index, 1);
    onUpdate({ ...question, subQuestions });
  };

  const duplicateSubQuestion = (index) => {
    const subQuestions = [...question.subQuestions];
    const questionToDuplicate = { ...subQuestions[index] };
    questionToDuplicate.question = questionToDuplicate.question + ' (Copy)';
    questionToDuplicate.options = [...questionToDuplicate.options];
    subQuestions.splice(index + 1, 0, questionToDuplicate);
    onUpdate({ ...question, subQuestions });
  };

  const moveSubQuestion = (index, direction) => {
    const subQuestions = [...question.subQuestions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < subQuestions.length) {
      [subQuestions[index], subQuestions[newIndex]] = [subQuestions[newIndex], subQuestions[index]];
      onUpdate({ ...question, subQuestions });
    }
  };

  // react-beautiful-dnd drag end handler
  const handleDragEnd = (result) => {
    if (!result.destination) return; // dropped outside list

    const items = Array.from(question.subQuestions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onUpdate({ ...question, subQuestions: items });
  };

  const getTotalPoints = () => {
    return question.subQuestions?.reduce((total, subQ) => total + (subQ.points || 1), 0) || 0;
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border">
      {/* Header Stats */}
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
        <div className="flex space-x-6">
          <div className="text-sm">
            <span className="text-gray-600">Questions:</span>
            <span className="ml-2 font-semibold text-blue-600">{question.subQuestions?.length || 0}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Total Points:</span>
            <span className="ml-2 font-semibold text-green-600">{getTotalPoints()}</span>
          </div>
        </div>
      </div>

      {/* Question Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question Title *
        </label>
        <input
          type="text"
          value={question.title || ''}
          onChange={(e) => onUpdate({ ...question, title: e.target.value })}
          placeholder="Enter a descriptive title for this comprehension question..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Passage */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reading Passage *
        </label>
        <textarea
          value={question.passage || ''}
          onChange={(e) => onUpdate({ ...question, passage: e.target.value })}
          placeholder="Enter the reading passage that students will need to comprehend..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg h-40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y"
        />
        <div className="text-xs text-gray-500 mt-1">
          {question.passage?.length || 0} characters
        </div>
      </div>

      {/* Sub-questions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="text-lg font-medium text-gray-700">Questions</label>
          <button
            onClick={addSubQuestion}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
          >
            <Plus size={16} />
            <span>Add Question</span>
          </button>
        </div>

        {question.subQuestions?.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            No questions added yet. Click "Add Question" to get started.
          </div>
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="subQuestions">
            {(provided, snapshot) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef}
                className={`space-y-4 ${snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-2' : ''}`}
              >
                {question.subQuestions?.map((subQ, index) => (
                  <Draggable key={`subQ-${index}`} draggableId={`subQ-${index}`} index={index}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`border rounded-lg p-6 bg-white transition-all duration-200 ${
                          snapshot.isDragging 
                            ? 'shadow-2xl rotate-3 transform scale-105' 
                            : 'hover:shadow-md'
                        }`}
                      >
                        {/* Question Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-3">
                            {/* Drag Handle */}
                            <div 
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                              title="Drag to reorder"
                            >
                              <GripVertical size={16} />
                            </div>
                            
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                              Q{index + 1}
                            </span>
                            <select
                              value={subQ.type}
                              onChange={(e) => updateSubQuestion(index, 'type', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="mcq">Multiple Choice</option>
                              <option value="true-false">True/False</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {/* Points Input */}
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-600">Points:</span>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={subQ.points || 1}
                                onChange={(e) => updateSubQuestion(index, 'points', parseInt(e.target.value) || 1)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            
                            {/* Action Buttons */}
                            <button
                              onClick={() => moveSubQuestion(index, 'up')}
                              disabled={index === 0}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              <Move size={14} className="rotate-180" />
                            </button>
                            <button
                              onClick={() => moveSubQuestion(index, 'down')}
                              disabled={index === question.subQuestions.length - 1}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              <Move size={14} />
                            </button>
                            <button
                              onClick={() => duplicateSubQuestion(index)}
                              className="p-1 text-gray-400 hover:text-blue-600"
                              title="Duplicate question"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={() => removeSubQuestion(index)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Delete question"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Question Input */}
                        <div className="mb-4">
                          <input
                            type="text"
                            value={subQ.question}
                            onChange={(e) => updateSubQuestion(index, 'question', e.target.value)}
                            placeholder="Enter the question..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        {/* Options for MCQ */}
                        {subQ.type === 'mcq' && (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">Answer Options</span>
                              <button
                                onClick={() => addOption(index)}
                                className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Plus size={14} />
                                <span>Add Option</span>
                              </button>
                            </div>
                            
                            {subQ.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center space-x-3 group">
                                <div className="flex items-center">
                                  <input
                                    type="radio"
                                    name={`q${index}_answer`}
                                    checked={subQ.answer === optIndex}
                                    onChange={() => updateSubQuestion(index, 'answer', optIndex)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-600 w-6">
                                    {String.fromCharCode(65 + optIndex)}.
                                  </span>
                                </div>
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => updateOption(index, optIndex, e.target.value)}
                                  placeholder={`Option ${String.fromCharCode(65 + optIndex)}...`}
                                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button
                                  onClick={() => removeOption(index, optIndex)}
                                  disabled={subQ.options.length <= 2}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                                  title="Remove option"
                                >
                                  <Minus size={16} />
                                </button>
                              </div>
                            ))}
                            
                            <div className="text-xs text-gray-500 mt-2">
                              Select the correct answer by clicking the radio button next to it.
                            </div>
                          </div>
                        )}

                        {/* True/False Options */}
                        {subQ.type === 'true-false' && (
                          <div className="space-y-2">
                            <span className="text-sm font-medium text-gray-700">Correct Answer</span>
                            <div className="flex space-x-6">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`q${index}_tf_answer`}
                                  checked={subQ.answer === true}
                                  onChange={() => updateSubQuestion(index, 'answer', true)}
                                  className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-green-600 font-medium">True</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`q${index}_tf_answer`}
                                  checked={subQ.answer === false}
                                  onChange={() => updateSubQuestion(index, 'answer', false)}
                                  className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-red-600 font-medium">False</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {/* Essay placeholder */}
                        {subQ.type === 'essay' && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-600">
                              Students will provide a detailed essay response to this question.
                            </div>
                            <div className="mt-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Expected Answer / Grading Notes (Optional)
                              </label>
                              <textarea
                                value={subQ.expectedAnswer || ''}
                                onChange={(e) => updateSubQuestion(index, 'expectedAnswer', e.target.value)}
                                placeholder="Enter key points or expected answer for grading reference..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
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
        </DragDropContext>
      </div>
    </div>
  );
};