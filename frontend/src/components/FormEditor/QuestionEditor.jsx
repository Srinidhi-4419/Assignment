import React, { useState, useEffect, useRef } from 'react';
import { Plus, Save, Eye, Trash2, Upload, Move, GripVertical, X, Loader2 } from 'lucide-react';
import { CategorizeQuestion } from './CategorizeQuestion';
import { ClozeQuestion } from './ClozeQuesiton';
import { ComprehensionQuestion } from './ComprehensionQuestion';

// API service for uploading images
const apiService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    return await response.json();
  }
};

export const QuestionEditor = ({ question, onUpdate }) => {
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      try {
        const result = await apiService.uploadImage(file);
        onUpdate({ ...question, image: result.imageUrl });
      } catch (error) {
        alert('Error uploading image: ' + error.message);
      } finally {
        setUploading(false);
      }
    }
  };
  
  if (!question) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Select a question to edit
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">
          {question.type} Question
        </h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          {uploading ? 'Uploading...' : 'Add Image'}
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
      
      {question.image && (
        <div className="mb-4 relative">
          <img
            src={question.image}
            alt="Question"
            className="max-w-full h-auto rounded-lg border"
          />
          <button
            onClick={() => onUpdate({ ...question, image: null })}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {question.type === 'categorize' && (
        <CategorizeQuestion
          question={question}
          onUpdate={onUpdate}
        />
      )}
      {question.type === 'cloze' && (
        <ClozeQuestion
          question={question}
          onUpdate={onUpdate}
        />
      )}
      {question.type === 'comprehension' && (
        <ComprehensionQuestion
          question={question}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
};