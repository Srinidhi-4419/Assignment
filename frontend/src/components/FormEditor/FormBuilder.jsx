 import { useState } from "react";
 import { Plus, Save, Eye, Trash2, Upload, Move, GripVertical, X, Loader2, FileText, PenTool, Award, Clock, Target, CheckCircle, XCircle, BookOpen, Home, Edit, Play, Send, ArrowLeft, User, Calendar, Star, BarChart3 } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
import { FormHeader } from "./FormHeader";
import { QuestionList } from "./QuestionList";
import { QuestionEditor } from "./QuestionEditor";
import { PreviewPane } from "./PreviewPane";

 export const FormBuilder = ({ onBack, existingForm }) => {
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