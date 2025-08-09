import React, { useState, useEffect, useRef } from 'react';
import { Plus, Save, Eye, Trash2, Upload, Move, GripVertical, X, Loader2 } from 'lucide-react';

// API service for uploading images
const apiService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Upload failed');
    }
    
    return await response.json();
  }
};

export const FormHeader = ({ form, onUpdate }) => {
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadError(null);
    
    try {
      const result = await apiService.uploadImage(file);
      // Assuming your API returns the image URL in a property like 'url' or 'imageUrl'
      const imageUrl = result.url || result.imageUrl || result.secure_url;
      onUpdate({ ...form, headerImage: imageUrl });
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload image: ' + error.message);
    } finally {
      setUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = () => {
    onUpdate({ ...form, headerImage: null });
    setUploadError(null);
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Form Title</label>
        <input
          type="text"
          value={form.title || ''}
          onChange={(e) => onUpdate({ ...form, title: e.target.value })}
          placeholder="Enter form title..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Header Image</label>
        
        {/* Upload button and error message */}
        <div className="flex items-center space-x-4 mb-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {uploading ? 'Uploading...' : 'Upload Image'}
          </button>
          
          {form.headerImage && (
            <button
              onClick={removeImage}
              className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
            >
              <X className="w-4 h-4 mr-1" />
              Remove
            </button>
          )}
        </div>

        {/* Error message */}
        {uploadError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{uploadError}</p>
          </div>
        )}
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        
        {/* Image preview */}
        {form.headerImage && (
          <div className="mt-3">
            <div className="relative inline-block">
              <img 
                src={form.headerImage} 
                alt="Header" 
                className="max-w-xs max-h-32 object-cover rounded border border-gray-200"
                onError={(e) => {
                  console.error('Image load error:', e);
                  setUploadError('Failed to load uploaded image');
                }}
              />
            </div>
          </div>
        )}
        
        {/* Upload guidelines */}
        <p className="text-xs text-gray-500 mt-2">
          Supported formats: JPG, PNG, GIF, WebP. Maximum size: 5MB
        </p>
      </div>
    </div>
  );
};