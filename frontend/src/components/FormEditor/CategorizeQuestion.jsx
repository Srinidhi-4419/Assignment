import React, { useState } from 'react';
import { Plus, GripVertical, Trash2, ArrowUp, ArrowDown, Move, Target, Award } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export const CategorizeQuestion = ({ question, onUpdate }) => {
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
    
    if (draggedText) {
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

  // React Beautiful DnD handler
  const handleDragEnd = (result) => {
    const { destination, source, type } = result;

    // If no destination, do nothing
    if (!destination) return;

    // If dropped in the same position, do nothing
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Handle category reordering
    if (type === 'category') {
      const newCategories = Array.from(question.categories);
      const [reorderedCategory] = newCategories.splice(source.index, 1);
      newCategories.splice(destination.index, 0, reorderedCategory);
      
      onUpdate({ ...question, categories: newCategories });
      return;
    }

    // Handle item reordering within items list
    if (type === 'item' && destination.droppableId === 'items') {
      const newItems = Array.from(question.items);
      const [reorderedItem] = newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, reorderedItem);
      
      onUpdate({ ...question, items: newItems });
      return;
    }
  };

  const pointsDistribution = getPointsDistribution();
  const totalPoints = calculateTotalPoints();

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
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

          <Droppable droppableId="categories" type="category">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-3 transition-all duration-200 ${
                  snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-2' : ''
                }`}
              >
                {question.categories?.map((category, index) => (
                  <Draggable key={`category-${index}`} draggableId={`category-${index}`} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`border border-gray-300 rounded-lg p-4 bg-white transition-all duration-200 ${
                          snapshot.isDragging 
                            ? 'shadow-2xl rotate-1 scale-105' 
                            : 'hover:shadow-md'
                        }`}
                      >
                        {/* Category Header */}
                        <div className="flex items-center space-x-3">
                          <div 
                            {...provided.dragHandleProps}
                            className="flex items-center space-x-2 cursor-grab active:cursor-grabbing"
                          >
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
                              title="Points per correct item in this category"
                            />
                            <span className="text-xs text-gray-500">pts</span>
                          </div>

                          {/* Category Controls */}
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => moveCategory(index, index - 1)}
                              disabled={index === 0}
                              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                              title="Move up"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveCategory(index, index + 1)}
                              disabled={index === question.categories.length - 1}
                              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                              title="Move down"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteCategory(index)}
                              className="p-1 text-red-500 hover:text-red-700"
                              title="Delete category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Show assigned items (non-draggable) */}
                        <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="text-sm text-gray-600 mb-2">
                            Items assigned to this category:
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {question.items?.filter(item => item.belongsTo === category.name).map((item, itemIndex) => (
                              <div
                                key={itemIndex}
                                className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm border border-blue-200"
                              >
                                {item.text}
                                <span className="ml-1 text-xs">({category.points || 0}pts)</span>
                              </div>
                            ))}
                            {question.items?.filter(item => item.belongsTo === category.name).length === 0 && (
                              <span className="text-gray-400 text-sm italic">No items assigned</span>
                            )}
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
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
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

          <Droppable droppableId="items" type="item">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-3 transition-all duration-200 ${
                  snapshot.isDraggingOver ? 'bg-green-50 rounded-lg p-2' : ''
                }`}
              >
                {question.items?.map((item, index) => {
                  const category = question.categories?.find(cat => cat.name === item.belongsTo);
                  const itemPoints = category?.points || 0;
                  
                  return (
                    <Draggable key={`item-${index}`} draggableId={`item-${index}`} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 transition-all duration-200 ${
                            snapshot.isDragging 
                              ? 'shadow-2xl rotate-1 scale-105' 
                              : 'hover:shadow-md'
                          }`}
                        >
                          {/* Drag Handle */}
                          <div 
                            {...provided.dragHandleProps}
                            className="flex items-center space-x-2 cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="w-4 h-4 text-gray-400" />
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
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    </DragDropContext>
  );
};