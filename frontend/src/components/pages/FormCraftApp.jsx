import React, { useState, useEffect } from 'react';
import { Plus, Save, Eye, Trash2, Upload, Move, GripVertical, X, Loader2, FileText, PenTool, Award, Clock, Target, CheckCircle, XCircle, BookOpen, Home, Edit, Play, Send, ArrowLeft, User, Calendar, Star, BarChart3 } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QuestionEditor } from '../FormEditor/QuestionEditor';
import { QuestionList } from '../FormEditor/QuestionList';
import { FormHeader } from '../FormEditor/FormHeader';
import ResponseAnalytics from '../FormEditor/ResponseAnalytics';
import {PreviewPane} from '../FormEditor/PreviewPane';
// Test Taking Component

// Forms List Component
const FormsList = ({ forms, loading, onCreateNew, onEditForm, onTakeTest, onViewAnalytics, viewType }) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading forms...</span>
        </div>
      );
    }
  
    if (forms.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            {viewType === 'my-forms' ? 'No forms created yet' : 'No tests available'}
          </h3>
          <p className="text-gray-600 mb-6">
            {viewType === 'my-forms' 
              ? 'Create your first form to get started' 
              : 'No tests are currently available to take'
            }
          </p>
          {viewType === 'my-forms' && (
            <button
              onClick={onCreateNew}
              className="flex items-center mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Form
            </button>
          )}
        </div>
      );
    }
  
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.map((form) => {
          // Handle both possible data structures
          const questionCount = (form.questions && Array.isArray(form.questions)) 
            ? form.questions.length 
            : 0;
          
          return (
            <div key={form._id || form.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              {form.headerImage && (
                <img 
                  src={form.headerImage} 
                  alt="Form Header" 
                  className="w-full h-48 object-cover rounded-t-lg" 
                />
              )}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{form.title || 'Untitled Form'}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span>{questionCount} question{questionCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(form.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {/* Warning if no questions found */}
                {questionCount === 0 && (
                  <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-3">
                    ⚠️ Questions data not loaded properly
                  </div>
                )}
                
                {/* THIS IS THE UPDATED SECTION - Action buttons with Analytics */}
                <div className="flex space-x-2">
      {viewType === 'my-forms' ? (
        <>
          <button
            onClick={() => onEditForm(form)}
            className="flex items-center flex-1 justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </button>
          <button
            onClick={() => onTakeTest(form, true)} // Pass true for preview mode
            disabled={questionCount === 0}
            className="flex items-center flex-1 justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 mr-2" />
            Preview
          </button>
          <button
            onClick={() => onViewAnalytics(form)}
            className="flex items-center flex-1 justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </button>
        </>
      ) : (
        <button
          onClick={() => onTakeTest(form, false)} // Pass false for actual test mode
          disabled={questionCount === 0}
          className="flex items-center w-full justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4 mr-2" />
          Take Test
        </button>
      )}
    </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

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
const FormBuilder = ({ onBack, existingForm }) => {
  const [form, setForm] = useState(existingForm || {
    title: '',
    headerImage: '',
    questions: []
  });
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formId, setFormId] = useState(existingForm?._id || null);

  const handleAddQuestion = (type) => {
    const newQuestion = { 
      type,
      title: '',
      ...(type === 'categorize' && { categories: [], items: [] }),
      ...(type === 'cloze' && { text: '', blanks: [] }),
      ...(type === 'comprehension' && { passage: '', subQuestions: [] })
    };
    
    setForm(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    setSelectedQuestionIndex(form.questions.length);
  };

  const handleUpdateQuestion = (updatedQuestion) => {
    const newQuestions = [...form.questions];
    newQuestions[selectedQuestionIndex] = updatedQuestion;
    setForm(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleDeleteQuestion = (index) => {
    const newQuestions = form.questions.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, questions: newQuestions }));
    if (selectedQuestionIndex >= newQuestions.length) {
      setSelectedQuestionIndex(newQuestions.length - 1);
    }
  };

  const handleSaveForm = async () => {
    if (!form.title.trim()) {
      toast.error('Please enter a form title', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
  
    if (form.questions.length === 0) {
      toast.error('Please add at least one question', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
  
    setSaving(true);
    try {
      if (formId) {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/forms/${formId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update form');
        }
  
        toast.success('Form updated successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/forms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save form');
        }
  
        const result = await response.json();
        setFormId(result.formId);
        toast.success(`Form saved successfully! Form ID: ${result.formId}`, {
          position: "top-right",
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error(`Error saving form: ${error.message}`, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedQuestion = selectedQuestionIndex !== null ? form.questions[selectedQuestionIndex] : null;
  const handleReorderQuestions = (sourceIndex, destinationIndex) => {
    const newQuestions = Array.from(form.questions);
    const [reorderedItem] = newQuestions.splice(sourceIndex, 1);
    newQuestions.splice(destinationIndex, 0, reorderedItem);
    
    setForm(prev => ({ ...prev, questions: newQuestions }));
    
    // Update selected question index if necessary
    if (selectedQuestionIndex === sourceIndex) {
      setSelectedQuestionIndex(destinationIndex);
    } else if (selectedQuestionIndex > sourceIndex && selectedQuestionIndex <= destinationIndex) {
      setSelectedQuestionIndex(selectedQuestionIndex - 1);
    } else if (selectedQuestionIndex < sourceIndex && selectedQuestionIndex >= destinationIndex) {
      setSelectedQuestionIndex(selectedQuestionIndex + 1);
    }
  };
  if (showPreview) {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Editor
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Form Preview</h1>
              </div>
            </div>
          </div>
        </nav>
        <div className="max-w-6xl mx-auto p-6">
          <PreviewPane 
            form={form} 
            mode="preview"
            onBack={() => setShowPreview(false)}
          />
        </div>
        
        {/* Toast Container */}
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Form Builder</h1>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>
            <button
              onClick={handleSaveForm}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Saving...' : (formId ? 'Update Form' : 'Save Form')}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <FormHeader form={form} onUpdate={setForm} />
          <QuestionList
            questions={form.questions}
            onAddQuestion={handleAddQuestion}
            onSelectQuestion={setSelectedQuestionIndex}
            selectedQuestionIndex={selectedQuestionIndex}
            onDeleteQuestion={handleDeleteQuestion}
            onReorderQuestions={handleReorderQuestions}
          />
        </div>
        
        {selectedQuestion && (
          <div className="mt-8 border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Edit Question {selectedQuestionIndex + 1}
              </h2>
              <button
                onClick={() => setSelectedQuestionIndex(null)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <QuestionEditor
                question={selectedQuestion}
                onUpdate={handleUpdateQuestion}
              />
            </div>
          </div>
        )}
      </div>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default FormCraftApp;