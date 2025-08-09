import React, { useState, useRef } from 'react';
import { Plus, GripVertical, Trash2, ArrowUp, ArrowDown, Move, Target, Award } from 'lucide-react';

export const CategorizeQuestion = ({ question, onUpdate }) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedCategory, setDraggedCategory] = useState(null);
  const [dragOverCategory, setDragOverCategory] = useState(null);
  const [dropPosition, setDropPosition] = useState(null); // 'above' or 'below'
  
  // New states for item reordering
  const [draggedItemForReorder, setDraggedItemForReorder] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [itemDropPosition, setItemDropPosition] = useState(null);

  const addCategory = () => {
    const categories = [...(question.categories || []), { 
      name: `Category ${(question.categories?.length || 0) + 1}`, 
      items: [],
      points: 1 // Default points per correct item in this category
    }];
    onUpdate({ ...question, categories });
  };

  const updateCategory = (index, field, value) => {
    const categories = [...question.categories];
    categories[index] = { ...categories[index], [field]: value };
    onUpdate({ ...question, categories });
  };

  const deleteCategory = (index) => {
    const categories = question.categories.filter((_, i) => i !== index);
    onUpdate({ ...question, categories });
  };

  const moveCategory = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= question.categories.length) return;
    
    const categories = [...question.categories];
    const [movedCategory] = categories.splice(fromIndex, 1);
    categories.splice(toIndex, 0, movedCategory);
    onUpdate({ ...question, categories });
  };

  const addItem = () => {
    const items = [...(question.items || []), { 
      text: `Item ${(question.items?.length || 0) + 1}`,
      belongsTo: question.categories?.[0]?.name || 'Uncategorized',
      points: 0 // Individual item points (will be calculated from category)
    }];
    onUpdate({ ...question, items });
  };

  const updateItem = (index, field, value) => {
    const items = [...question.items];
    items[index] = { ...items[index], [field]: value };
    onUpdate({ ...question, items });
  };

  const deleteItem = (index) => {
    const items = question.items.filter((_, i) => i !== index);
    onUpdate({ ...question, items });
  };

  const moveItem = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= question.items.length) return;
    
    const items = [...question.items];
    const [movedItem] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, movedItem);
    onUpdate({ ...question, items });
  };

  // Calculate total possible points
  const calculateTotalPoints = () => {
    if (!question.items || !question.categories) return 0;
    
    return question.items.reduce((total, item) => {
      const category = question.categories.find(cat => cat.name === item.belongsTo);
      return total + (category?.points || 0);
    }, 0);
  };

  // Calculate points distribution
  const getPointsDistribution = () => {
    if (!question.items || !question.categories) return {};
    
    const distribution = {};
    question.categories.forEach(category => {
      const itemsInCategory = question.items.filter(item => item.belongsTo === category.name);
      distribution[category.name] = {
        itemCount: itemsInCategory.length,
        pointsPerItem: category.points || 0,
        totalPoints: itemsInCategory.length * (category.points || 0)
      };
    });
    return distribution;
  };

  // Handle text drag from input to input
  const handleInputDragStart = (e) => {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      e.dataTransfer.setData('text/plain', selectedText);
      e.dataTransfer.effectAllowed = 'copy';
    }
  };

  const handleInputDrop = (e, targetType, targetIndex, targetField = 'text') => {
    e.preventDefault();
    const draggedText = e.dataTransfer.getData('text/plain');
    
    if (draggedText && !draggedCategory && draggedItem === null && draggedItemForReorder === null) {
      if (targetType === 'item') {
        const items = [...question.items];
        items[targetIndex] = { 
          ...items[targetIndex], 
          [targetField]: (items[targetIndex][targetField] || '') + draggedText 
        };
        onUpdate({ ...question, items });
      } else if (targetType === 'category') {
        const categories = [...question.categories];
        categories[targetIndex] = { 
          ...categories[targetIndex], 
          [targetField]: (categories[targetIndex][targetField] || '') + draggedText 
        };
        onUpdate({ ...question, categories });
      } else if (targetType === 'question' && targetField === 'title') {
        onUpdate({ ...question, title: (question.title || '') + draggedText });
      }
    }
  };

  // Handle drag start for items (to category)
  const handleItemDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', question.items[index].text);
  };

  // NEW: Handle drag start for item reordering
  const handleItemReorderDragStart = (e, index) => {
    setDraggedItemForReorder(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // Prevent text selection interference
  };

  // NEW: Handle drag over for item reordering
  const handleItemDragOver = (e, index) => {
    e.preventDefault();
    
    if (draggedItemForReorder !== null && draggedItemForReorder !== index) {
      const rect = e.currentTarget.getBoundingClientRect();
      const midPoint = rect.top + rect.height / 2;
      const position = e.clientY < midPoint ? 'above' : 'below';
      
      setDragOverItem(index);
      setItemDropPosition(position);
    }
  };

  // NEW: Handle drag leave for items
  const handleItemDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverItem(null);
      setItemDropPosition(null);
    }
  };

  // NEW: Handle item reordering drop
  const handleItemDrop = (targetIndex, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedItemForReorder !== null && draggedItemForReorder !== targetIndex) {
      let newIndex = targetIndex;
      
      // Adjust index based on drop position
      if (itemDropPosition === 'below') {
        newIndex = targetIndex + 1;
      }
      
      // Adjust for the fact that we're removing an item first
      if (draggedItemForReorder < targetIndex) {
        newIndex = newIndex - 1;
      }
      
      moveItem(draggedItemForReorder, newIndex);
      setDraggedItemForReorder(null);
    }
    
    setDragOverItem(null);
    setItemDropPosition(null);
  };

  // Handle drag start for categories - entire div draggable
  const handleCategoryDragStart = (e, index) => {
    setDraggedCategory(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // Prevent text selection interference
  };

  // Handle drag over for category reordering with visual feedback
  const handleCategoryDragOver = (e, index) => {
    e.preventDefault();
    
    if (draggedCategory !== null && draggedCategory !== index) {
      const rect = e.currentTarget.getBoundingClientRect();
      const midPoint = rect.top + rect.height / 2;
      const position = e.clientY < midPoint ? 'above' : 'below';
      
      setDragOverCategory(index);
      setDropPosition(position);
    }
  };

  const handleCategoryDragLeave = (e) => {
    // Only clear if we're leaving the category container entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverCategory(null);
      setDropPosition(null);
    }
  };

  // Handle drop for item to category
  const handleDropToCategory = (categoryIndex, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedItem !== null) {
      const categories = [...question.categories];
      const item = question.items[draggedItem];
      
      // Remove item from all categories
      categories.forEach(cat => {
        cat.items = cat.items.filter(i => i !== item.text);
      });
      
      // Add to target category
      if (!categories[categoryIndex].items.includes(item.text)) {
        categories[categoryIndex].items.push(item.text);
      }
      
      // Update the item's belongsTo field
      const items = [...question.items];
      items[draggedItem] = { ...items[draggedItem], belongsTo: categories[categoryIndex].name };
      
      onUpdate({ ...question, categories, items });
      setDraggedItem(null);
    }
    
    setDragOverCategory(null);
    setDropPosition(null);
  };

  // Handle category reordering drop
  const handleCategoryDrop = (targetIndex, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedCategory !== null && draggedCategory !== targetIndex) {
      let newIndex = targetIndex;
      
      // Adjust index based on drop position
      if (dropPosition === 'below') {
        newIndex = targetIndex + 1;
      }
      
      // Adjust for the fact that we're removing an item first
      if (draggedCategory < targetIndex) {
        newIndex = newIndex - 1;
      }
      
      moveCategory(draggedCategory, newIndex);
      setDraggedCategory(null);
    }
    
    setDragOverCategory(null);
    setDropPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedCategory(null);
    setDraggedItem(null);
    setDragOverCategory(null);
    setDropPosition(null);
    // Clear item reordering states
    setDraggedItemForReorder(null);
    setDragOverItem(null);
    setItemDropPosition(null);
  };

  const pointsDistribution = getPointsDistribution();
  const totalPoints = calculateTotalPoints();

  return (
    <div className="space-y-6">
      {/* Question Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Question Title</label>
        <input
          type="text"
          value={question.title || ''}
          onChange={(e) => onUpdate({ ...question, title: e.target.value })}
          onDragStart={handleInputDragStart}
          onDrop={(e) => handleInputDrop(e, 'question', 0, 'title')}
          onDragOver={(e) => e.preventDefault()}
          placeholder="Enter question title..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          draggable="true"
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
            {Object.entries(pointsDistribution).map(([categoryName, data]) => (
              <div key={categoryName} className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-sm font-medium text-gray-700">{categoryName}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {data.itemCount} items × {data.pointsPerItem} pts = {data.totalPoints} pts
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${totalPoints > 0 ? (data.totalPoints / totalPoints) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="text-sm font-medium text-gray-700">Categories</label>
          <button
            onClick={addCategory}
            className="flex items-center px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Category
          </button>
        </div>

        <div className="space-y-3">
          {question.categories?.map((category, index) => (
            <div key={index} className="relative">
              {/* Drop indicator above */}
              {dragOverCategory === index && dropPosition === 'above' && draggedCategory !== null && (
                <div className="absolute -top-2 left-0 right-0 h-1 bg-blue-400 rounded z-10"></div>
              )}
              
              <div
                draggable
                onDragStart={(e) => handleCategoryDragStart(e, index)}
                onDragOver={(e) => handleCategoryDragOver(e, index)}
                onDragLeave={handleCategoryDragLeave}
                onDrop={(e) => handleCategoryDrop(index, e)}
                onDragEnd={handleDragEnd}
                className={`border border-gray-300 rounded-lg p-4 bg-white hover:shadow-md transition-all cursor-move ${
                  draggedCategory === index ? 'opacity-50 scale-105' : ''
                } ${dragOverCategory === index ? 'ring-2 ring-blue-300' : ''}`}
              >
                {/* Category Header */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">#{index + 1}</span>
                  </div>
                  
                  <div className="flex-1">
                    <input
                      type="text"
                      value={category.name}
                      onChange={(e) => updateCategory(index, 'name', e.target.value)}
                      onDragStart={handleInputDragStart}
                      onDrop={(e) => handleInputDrop(e, 'category', index, 'name')}
                      onDragOver={(e) => e.preventDefault()}
                      className="w-full px-3 py-2 border border-gray-200 rounded font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Category name..."
                      draggable="true"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Points Input */}
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <input
                      type="number"
                      value={category.points || 0}
                      onChange={(e) => updateCategory(index, 'points', parseInt(e.target.value) || 0)}
                      min="0"
                      max="1000"
                      className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Pts"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      title="Points per correct item in this category"
                    />
                    <span className="text-xs text-gray-500">pts</span>
                  </div>

                  {/* Category Controls */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveCategory(index, index - 1);
                      }}
                      disabled={index === 0}
                      className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveCategory(index, index + 1);
                      }}
                      disabled={index === question.categories.length - 1}
                      className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCategory(index);
                      }}
                      className="p-1 text-red-500 hover:text-red-700"
                      title="Delete category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Category Points Info */}
                {pointsDistribution[category.name] && pointsDistribution[category.name].itemCount > 0 && (
                  <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-700">
                        {pointsDistribution[category.name].itemCount} items assigned
                      </span>
                      <span className="font-semibold text-green-800">
                        {pointsDistribution[category.name].totalPoints} total points
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Drop indicator below */}
              {dragOverCategory === index && dropPosition === 'below' && draggedCategory !== null && (
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-blue-400 rounded z-10"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Items Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="text-sm font-medium text-gray-700">Items to Categorize</label>
          <button
            onClick={addItem}
            className="flex items-center px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </button>
        </div>

        <div className="space-y-3">
          {question.items?.map((item, index) => {
            const category = question.categories?.find(cat => cat.name === item.belongsTo);
            const itemPoints = category?.points || 0;
            
            return (
              <div key={index} className="relative">
                {/* Drop indicator above */}
                {dragOverItem === index && itemDropPosition === 'above' && draggedItemForReorder !== null && (
                  <div className="absolute -top-2 left-0 right-0 h-1 bg-green-400 rounded z-10"></div>
                )}
                
                <div
                  onDragOver={(e) => handleItemDragOver(e, index)}
                  onDragLeave={handleItemDragLeave}
                  onDrop={(e) => handleItemDrop(index, e)}
                  className={`flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 transition-all ${
                    draggedItemForReorder === index ? 'opacity-50 scale-105' : ''
                  } ${dragOverItem === index ? 'ring-2 ring-green-300 bg-green-50' : ''}`}
                >
                  {/* Drag Handle for Reordering */}
                  <div className="flex items-center space-x-2">
                    <div
                      draggable
                      onDragStart={(e) => handleItemReorderDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      className="cursor-move p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Drag to reorder items"
                    >
                      <GripVertical className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-500">#{index + 1}</span>
                  </div>

                  {/* Item Text */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => updateItem(index, 'text', e.target.value)}
                      onDragStart={handleInputDragStart}
                      onDrop={(e) => handleInputDrop(e, 'item', index, 'text')}
                      onDragOver={(e) => e.preventDefault()}
                      className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Item text..."
                      draggable="true"
                    />
                  </div>

                  {/* Belongs To Dropdown */}
                  <div className="w-48">
                    <select
                      value={item.belongsTo || ''}
                      onChange={(e) => updateItem(index, 'belongsTo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select category...</option>
                      {question.categories?.map((cat, catIndex) => (
                        <option key={catIndex} value={cat.name}>
                          {cat.name} ({cat.points || 0} pts)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Points Display */}
                  <div className="flex items-center space-x-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      itemPoints > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {itemPoints} pts
                    </div>
                  </div>

                  {/* Item Controls */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => moveItem(index, index - 1)}
                      disabled={index === 0}
                      className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveItem(index, index + 1)}
                      disabled={index === question.items.length - 1}
                      className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteItem(index)}
                      className="p-1 text-red-500 hover:text-red-700"
                      title="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Drop indicator below */}
                {dragOverItem === index && itemDropPosition === 'below' && draggedItemForReorder !== null && (
                  <div className="absolute -bottom-2 left-0 right-0 h-1 bg-green-400 rounded z-10"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};