import React, { useState, useEffect, useRef } from 'react';
import { Plus, Save, Eye, Trash2, Upload, Move, GripVertical, X, Loader2, Target, Award } from 'lucide-react';

export const ClozeQuestion = ({ question, onUpdate }) => {
  const [selectedText, setSelectedText] = useState('');
  const [draggedOption, setDraggedOption] = useState(null);
  const [dragOverBlank, setDragOverBlank] = useState(null);
  const textareaRef = useRef();

  const handleTextSelect = () => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (selectedText.trim()) {
      setSelectedText(selectedText);
    }
  };

  const createBlank = () => {
    if (selectedText.trim()) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      
      const newText = text.substring(0, start) + `[${selectedText}]` + text.substring(end);
      const blanks = [...(question.blanks || [])];
      const blankOptions = { ...(question.blankOptions || {}) };
      
      // Add the correct answer and initialize with empty additional options
      const blankIndex = blanks.length;
      blanks.push(selectedText);
      blankOptions[blankIndex] = {
        correct: selectedText,
        additional: ['', '', ''], // Three empty additional options
        points: 1 // Default points for each blank
      };
      
      onUpdate({ ...question, text: newText, blanks, blankOptions });
      setSelectedText('');
    }
  };

  const updateBlankOption = (blankIndex, optionIndex, value) => {
    const blankOptions = { ...(question.blankOptions || {}) };
    if (!blankOptions[blankIndex]) {
      blankOptions[blankIndex] = { correct: question.blanks[blankIndex], additional: ['', '', ''], points: 1 };
    }
    blankOptions[blankIndex].additional[optionIndex] = value;
    onUpdate({ ...question, blankOptions });
  };

  const updateBlankPoints = (blankIndex, points) => {
    const blankOptions = { ...(question.blankOptions || {}) };
    if (!blankOptions[blankIndex]) {
      blankOptions[blankIndex] = { correct: question.blanks[blankIndex], additional: ['', '', ''], points: 1 };
    }
    blankOptions[blankIndex].points = points;
    onUpdate({ ...question, blankOptions });
  };

  const addOption = (blankIndex) => {
    const blankOptions = { ...(question.blankOptions || {}) };
    if (!blankOptions[blankIndex]) {
      blankOptions[blankIndex] = { correct: question.blanks[blankIndex], additional: [''], points: 1 };
    } else {
      blankOptions[blankIndex].additional.push('');
    }
    onUpdate({ ...question, blankOptions });
  };

  const removeOption = (blankIndex, optionIndex) => {
    const blankOptions = { ...(question.blankOptions || {}) };
    if (blankOptions[blankIndex]) {
      blankOptions[blankIndex].additional.splice(optionIndex, 1);
      onUpdate({ ...question, blankOptions });
    }
  };

  const getAllOptions = () => {
    const allOptions = [];
    if (question.blanks && question.blankOptions) {
      question.blanks.forEach((blank, index) => {
        const options = question.blankOptions[index];
        if (options) {
          // Add correct answer
          allOptions.push({ text: options.correct, type: 'correct', blankIndex: index });
          // Add additional options
          options.additional.forEach((option, optIndex) => {
            if (option.trim()) {
              allOptions.push({ text: option, type: 'additional', blankIndex: index, optionIndex: optIndex });
            }
          });
        }
      });
    }
    return allOptions;
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
      result += `<span 
        class="inline-block min-w-[80px] border-b-2 border-blue-300 mx-1 px-2 py-1 bg-blue-50 drop-zone relative" 
        data-blank-index="${blankIndex}"
        style="min-height: 24px;"
      >____<span class="absolute -top-2 -right-1 bg-green-500 text-white text-xs px-1 rounded-full" style="font-size: 10px;">${points}pt</span></span>`;
      lastIndex = regex.lastIndex;
      blankIndex++;
    }
    result += previewText.substring(lastIndex);
    return result;
  };

  // Calculate total points
  const calculateTotalPoints = () => {
    if (!question.blanks || !question.blankOptions) return 0;
    
    return question.blanks.reduce((total, blank, index) => {
      const options = question.blankOptions[index];
      return total + (options?.points || 0);
    }, 0);
  };

  // Get points distribution
  const getPointsDistribution = () => {
    if (!question.blanks || !question.blankOptions) return [];
    
    return question.blanks.map((blank, index) => ({
      blankIndex: index,
      text: blank,
      points: question.blankOptions[index]?.points || 0,
      optionCount: question.blankOptions[index]?.additional?.filter(opt => opt.trim()).length || 0
    }));
  };

  // Drag and drop handlers
  const handleDragStart = (e, option) => {
    setDraggedOption(option);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const blankIndex = e.target.getAttribute('data-blank-index');
    if (draggedOption && blankIndex !== null) {
      // Here you could implement logic to place the dragged option in the blank
      console.log(`Dropped "${draggedOption.text}" into blank ${blankIndex}`);
    }
    setDraggedOption(null);
    setDragOverBlank(null);
  };

  const handleDragEnd = () => {
    setDraggedOption(null);
    setDragOverBlank(null);
  };

  // Add event listeners to preview blanks
  useEffect(() => {
    const previewElement = document.querySelector('.preview-container');
    if (previewElement) {
      const blanks = previewElement.querySelectorAll('.drop-zone');
      blanks.forEach(blank => {
        blank.addEventListener('dragover', handleDragOver);
        blank.addEventListener('drop', handleDrop);
      });

      return () => {
        blanks.forEach(blank => {
          blank.removeEventListener('dragover', handleDragOver);
          blank.removeEventListener('drop', handleDrop);
        });
      };
    }
  }, [question.text]);

  const totalPoints = calculateTotalPoints();
  const pointsDistribution = getPointsDistribution();

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Question Title</label>
        <input
          type="text"
          value={question.title || ''}
          onChange={(e) => onUpdate({ ...question, title: e.target.value })}
          placeholder="Enter question title..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Points Summary */}
      {totalPoints > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-800">Points Summary</h3>
            </div>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
              Total: {totalPoints} points
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pointsDistribution.map((blank, index) => (
              <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-sm font-medium text-gray-700">
                  Blank {blank.blankIndex + 1}: "{blank.text}"
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {blank.optionCount} distractors • {blank.points} points
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${totalPoints > 0 ? (blank.points / totalPoints) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Section - Now above the text input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
        <div 
          className="preview-container p-4 border border-gray-300 rounded-md bg-gray-50 min-h-[100px]"
          dangerouslySetInnerHTML={{ __html: getPreviewText() }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Passage Text</label>
        <textarea
          ref={textareaRef}
          value={question.text || ''}
          onChange={(e) => onUpdate({ ...question, text: e.target.value })}
          onMouseUp={handleTextSelect}
          onKeyUp={handleTextSelect}
          placeholder="Enter the passage text. Select words to create blanks..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {selectedText && (
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-sm text-gray-600">Selected: "{selectedText}"</span>
            <button
              onClick={createBlank}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Create Blank
            </button>
          </div>
        )}
      </div>

      {/* Blank Options Configuration */}
      {question.blanks && question.blanks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-700">Configure Answer Options</h3>
          {question.blanks.map((blank, blankIndex) => {
            const options = question.blankOptions?.[blankIndex] || { correct: blank, additional: ['', '', ''], points: 1 };
            return (
              <div key={blankIndex} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-700">Blank {blankIndex + 1}: "{blank}"</h4>
                  
                  {/* Points Input */}
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <input
                      type="number"
                      value={options.points || 0}
                      onChange={(e) => updateBlankPoints(blankIndex, parseInt(e.target.value) || 0)}
                      min="0"
                      max="1000"
                      className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Pts"
                      title="Points for this blank"
                    />
                    <span className="text-xs text-gray-500">pts</span>
                  </div>
                </div>
                
                {/* Points Info */}
                <div className="mb-3 bg-green-50 border border-green-200 rounded-lg p-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-700">
                      {options.additional.filter(opt => opt.trim()).length} distractors configured
                    </span>
                    <span className="font-semibold text-green-800">
                      {options.points || 0} points per correct answer
                    </span>
                  </div>
                </div>
                
                {/* Correct Answer */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-green-600 mb-1">Correct Answer</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={options.correct}
                      readOnly
                      className="flex-1 px-3 py-2 border border-green-300 bg-green-50 rounded-md text-green-800"
                    />
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                      +{options.points || 0} pts
                    </div>
                  </div>
                </div>

                {/* Additional Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Additional Options (Distractors)</label>
                  <div className="space-y-2">
                    {options.additional.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateBlankOption(blankIndex, optionIndex, e.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                          0 pts
                        </div>
                        <button
                          onClick={() => removeOption(blankIndex, optionIndex)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addOption(blankIndex)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Add Option</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Draggable Answer Choices */}
      {getAllOptions().length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Answer Choices (Drag to Blanks Above)</label>
          <div className="flex flex-wrap gap-2">
            {getAllOptions().map((option, index) => {
              const blankOptions = question.blankOptions?.[option.blankIndex];
              const points = option.type === 'correct' ? (blankOptions?.points || 0) : 0;
              
              return (
                <div
                  key={index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, option)}
                  onDragEnd={handleDragEnd}
                  className={`px-3 py-2 rounded-md cursor-move transition-all relative ${
                    option.type === 'correct' 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300' 
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300'
                  } ${draggedOption === option ? 'opacity-50 scale-95' : ''}`}
                >
                  <div className="flex items-center space-x-2">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <span>{option.text}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      points > 0 
                        ? 'bg-green-200 text-green-800' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {points}pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            <span className="inline-block w-3 h-3 bg-green-100 border border-green-300 rounded mr-1"></span>
            Correct answers (award points)
            <span className="inline-block w-3 h-3 bg-blue-100 border border-blue-300 rounded mr-1 ml-4"></span>
            Distractors (no points)
          </p>
        </div>
      )}
    </div>
  );
};