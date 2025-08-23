import React, { useState, useEffect } from 'react';
import { Plus, Save, Eye, Trash2, Upload, Move, GripVertical, X, Loader2, FileText, PenTool, Award, Clock, Target, CheckCircle, XCircle, BookOpen, Home, Edit, Play, Send, ArrowLeft, User, Calendar, Star, BarChart3 } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FormBuilder } from '../FormEditor/FormBuilder';
import ResponseAnalytics from '../FormEditor/ResponseAnalytics';
import {PreviewPane} from '../FormEditor/PreviewPane';
import { FormsList } from '../FormEditor/FormList';


// Main App Component
const FormCraftApp = () => {
    const [currentView, setCurrentView] = useState('home');
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedForm, setSelectedForm] = useState(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Load forms when needed
  const loadForms = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/forms`);
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data); // Debug log
        console.log('First form:', data[0]); // Debug log
        setForms(data);
      } else {
        console.error('Failed to load forms', response.status, response.statusText);
        toast.error('Failed to load forms. Please check if the server is running.', {
          position: "top-right",
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error('Error loading forms:', error);
      toast.error(`Error loading forms: ${error.message}`, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === 'my-forms' || currentView === 'take-test') {
      loadForms();
    }
  }, [currentView]);

  const handleCreateNew = () => {
    setCurrentView('form-builder');
  };

  const handleEditForm = (form) => {
    setSelectedForm(form);
    setCurrentView('form-builder');
  };

  const handleTakeTest = (form, isPreview = false) => {
    setSelectedForm(form);
    setIsPreviewMode(isPreview);
    setCurrentView('test-taking');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedForm(null);
    setIsPreviewMode(false);
  };

  
  const handleViewAnalytics = (form) => {
    setSelectedForm(form);
    setCurrentView('analytics');
  };

  const handleBackToForms = () => {
    setCurrentView('my-forms');
    setSelectedForm(null);
    setIsPreviewMode(false);
  };
  // Home View
  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg">
                  <PenTool className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">FormCraft</h1>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">Welcome back!</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Create Interactive Forms & Tests
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Build engaging categorization, cloze, and comprehension exercises with our intuitive drag-and-drop interface
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div 
              onClick={() => setCurrentView('my-forms')}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-100"
            >
              <div className="text-center">
                <div className="bg-blue-100 text-blue-600 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">My Forms</h3>
                <p className="text-gray-600 mb-6">
                  View, edit, and manage all your created forms. Build interactive exercises with drag-and-drop functionality.
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Edit className="w-4 h-4" />
                    <span>Create & Edit</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </div>
                </div>
              </div>
            </div>

            <div 
              onClick={() => setCurrentView('take-test')}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-100"
            >
              <div className="text-center">
                <div className="bg-green-100 text-green-600 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Take Tests</h3>
                <p className="text-gray-600 mb-6">
                  Browse and take available tests. Experience interactive categorization, cloze exercises, and comprehension questions.
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Play className="w-4 h-4" />
                    <span>Interactive</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Award className="w-4 h-4" />
                    <span>Scored</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-20">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">Powerful Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-purple-100 text-purple-600 p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <GripVertical className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Drag & Drop</h4>
                <p className="text-gray-600">Intuitive drag-and-drop interface for categorization and cloze exercises</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 text-green-600 p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Point System</h4>
                <p className="text-gray-600">Flexible scoring system with customizable points for each question</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 text-blue-600 p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Multiple Types</h4>
                <p className="text-gray-600">Support for categorization, cloze tests, and reading comprehension</p>
              </div>
            </div>
          </div>
        </div>

        {/* Toast Container */}
        <ToastContainer />
      </div>
    );
  }

  // My Forms View
  if (currentView === 'my-forms') {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackToHome}
                  className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Home
                </button>
                <h1 className="text-2xl font-bold text-gray-900">My Forms</h1>
              </div>
              <button
                onClick={handleCreateNew}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Form
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto p-6">
          <FormsList 
            forms={forms} 
            loading={loading} 
            onCreateNew={handleCreateNew}
            onEditForm={handleEditForm}
            onTakeTest={handleTakeTest}
            onViewAnalytics={handleViewAnalytics}
            viewType="my-forms"
          />
        </div>
      </div>
    );
  }

  // Take Test View
  if (currentView === 'take-test') {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackToHome}
                  className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Home
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Available Tests</h1>
              </div>
              <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg">
                <BookOpen className="w-4 h-4" />
                <span className="font-medium">{forms.length} tests available</span>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto p-6">
          <FormsList 
            forms={forms} 
            loading={loading} 
            onTakeTest={handleTakeTest}
            viewType="take-test"
          />
        </div>
      </div>
    );
  }

  // Test Taking View
  if (currentView === 'test-taking' && selectedForm) {
    return (
      <PreviewPane 
        form={selectedForm} 
        mode={isPreviewMode ? 'preview' : 'test'}
        onBack={() => setCurrentView(isPreviewMode ? 'my-forms' : 'take-test')}
        onSubmit={(result) => {
          // Handle successful submission
          console.log('Test submitted:', result);
          // Redirect to appropriate view
          setCurrentView(isPreviewMode ? 'my-forms' : 'take-test');
        }}
      />
    );
  }
  if (currentView === 'analytics' && selectedForm) {
    return (
      <ResponseAnalytics 
        formId={selectedForm._id || selectedForm.id}
        formTitle={selectedForm.title}
        onBack={handleBackToForms}
      />
    );
  }
  // Form Builder View
  if (currentView === 'form-builder') {
    return <FormBuilder onBack={handleBackToForms} existingForm={selectedForm} />;
  }

  return null;
};

// Form Builder Component (simplified version of your existing CreateForm)


export default FormCraftApp;