import React, { useState, useEffect, useRef } from 'react';
import { Plus, Save, Eye, Trash2, Upload, X, Loader2 } from 'lucide-react';

import { FormHeader } from './FormHeader';
import { QuestionList } from './QuestionList';
import { PreviewPane } from './PreviewPane';
import { QuestionEditor } from './QuestionEditor';
import { ClozeQuestion } from './ClozeQuesiton';
import { CategorizeQuestion } from './CategorizeQuestion';
import { ComprehensionQuestion } from './ComprehensionQuestion';

const CreateForm = () => {
  const [form, setForm] = useState({
    title: '',
    headerImage: '',
    questions: []
  });
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formId, setFormId] = useState(null);

  const handleAddQuestion = (type) => {
    const newQuestion = { 
      type,
      title: '',
      headerImage: '',
      // Categorize Question Fields
      ...(type === 'categorize' && { 
        categories: [], // Array of {name, points}
        items: [] // Array of {text, belongsTo}
      }),
      // Cloze Question Fields
      ...(type === 'cloze' && { 
        text: '', // The passage with blanks marked as [word]
        blanks: [], // Array of correct answers for each blank
        blankOptions: {} // Map of blank positions to {correct, additional, points}
      }),
      // Comprehension Question Fields
      ...(type === 'comprehension' && { 
        passage: '', // The reading passage
        subQuestions: [] // Array of sub-questions
      })
    };
    
    setForm(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    // Set the newly added question as selected
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
    
    // Update selected question index after deletion
    if (selectedQuestionIndex === index) {
      // If we deleted the selected question, select the previous one or null if it was the first
      setSelectedQuestionIndex(index > 0 ? index - 1 : (newQuestions.length > 0 ? 0 : null));
    } else if (selectedQuestionIndex !== null && selectedQuestionIndex > index) {
      // If we deleted a question before the selected one, adjust the index
      setSelectedQuestionIndex(selectedQuestionIndex - 1);
    }
  };

  // Validation function to ensure data matches schema
  const validateFormData = (formData) => {
    const errors = [];

    // Validate form title (required, must be trimmed)
    if (!formData.title?.trim()) {
      errors.push('Form title is required');
    }

    // Validate at least one question exists
    if (!formData.questions || formData.questions.length === 0) {
      errors.push('At least one question is required');
    }

    formData.questions.forEach((question, index) => {
      // Validate question type
      if (!['categorize', 'cloze', 'comprehension'].includes(question.type)) {
        errors.push(`Question ${index + 1}: Invalid question type`);
      }

      // Validate required title for each question
      if (!question.title?.trim()) {
        errors.push(`Question ${index + 1}: Question title is required`);
      }

      // Validate categorize questions
      if (question.type === 'categorize') {
        if (!question.categories || !Array.isArray(question.categories) || question.categories.length === 0) {
          errors.push(`Question ${index + 1}: At least one category is required`);
        } else {
          question.categories.forEach((cat, catIndex) => {
            if (!cat.name || typeof cat.name !== 'string' || !cat.name.trim()) {
              errors.push(`Question ${index + 1}, Category ${catIndex + 1}: Category name is required`);
            }
            if (cat.points !== undefined && (typeof cat.points !== 'number' || cat.points < 0)) {
              errors.push(`Question ${index + 1}, Category ${catIndex + 1}: Points must be a non-negative number`);
            }
          });
        }

        if (!question.items || !Array.isArray(question.items) || question.items.length === 0) {
          errors.push(`Question ${index + 1}: At least one item is required`);
        } else {
          question.items.forEach((item, itemIndex) => {
            if (!item.text || typeof item.text !== 'string' || !item.text.trim()) {
              errors.push(`Question ${index + 1}, Item ${itemIndex + 1}: Item text is required`);
            }
            if (!item.belongsTo || typeof item.belongsTo !== 'string' || !item.belongsTo.trim()) {
              errors.push(`Question ${index + 1}, Item ${itemIndex + 1}: BelongsTo category is required`);
            }
          });
        }
      }

      // Validate cloze questions
      if (question.type === 'cloze') {
        if (!question.text || typeof question.text !== 'string' || !question.text.trim()) {
          errors.push(`Question ${index + 1}: Text is required for cloze questions`);
        }
        if (!question.blanks || !Array.isArray(question.blanks) || question.blanks.length === 0) {
          errors.push(`Question ${index + 1}: At least one blank answer is required`);
        }
        // Validate blankOptions if provided
        if (question.blankOptions && typeof question.blankOptions === 'object') {
          Object.entries(question.blankOptions).forEach(([key, value]) => {
            if (!value.correct || typeof value.correct !== 'string') {
              errors.push(`Question ${index + 1}, Blank ${key}: Correct answer is required`);
            }
            if (value.points !== undefined && (typeof value.points !== 'number' || value.points < 0)) {
              errors.push(`Question ${index + 1}, Blank ${key}: Points must be a non-negative number`);
            }
          });
        }
      }

      // Validate comprehension questions
      if (question.type === 'comprehension') {
        if (!question.passage || typeof question.passage !== 'string' || !question.passage.trim()) {
          errors.push(`Question ${index + 1}: Passage is required for comprehension questions`);
        }
        if (!question.subQuestions || !Array.isArray(question.subQuestions) || question.subQuestions.length === 0) {
          errors.push(`Question ${index + 1}: At least one sub-question is required`);
        } else {
          question.subQuestions.forEach((subQ, subIndex) => {
            if (!['mcq', 'true-false'].includes(subQ.type)) {
              errors.push(`Question ${index + 1}, SubQuestion ${subIndex + 1}: Invalid sub-question type`);
            }
            if (!subQ.question || typeof subQ.question !== 'string' || !subQ.question.trim()) {
              errors.push(`Question ${index + 1}, SubQuestion ${subIndex + 1}: Question text is required`);
            }
            if (subQ.type === 'mcq' && (!subQ.options || !Array.isArray(subQ.options) || subQ.options.length === 0)) {
              errors.push(`Question ${index + 1}, SubQuestion ${subIndex + 1}: Options array is required for MCQ`);
            }
            if (subQ.answer === undefined || subQ.answer === null) {
              errors.push(`Question ${index + 1}, SubQuestion ${subIndex + 1}: Answer is required`);
            }
            if (subQ.points !== undefined && (typeof subQ.points !== 'number' || subQ.points < 0)) {
              errors.push(`Question ${index + 1}, SubQuestion ${subIndex + 1}: Points must be a non-negative number`);
            }
          });
        }
      }
    });

    return errors;
  };

  // Transform form data to match schema before saving
  const transformFormDataForSchema = (formData) => {
    const transformedForm = {
      title: formData.title.trim(),
      headerImage: formData.headerImage || '',
      questions: formData.questions.map(question => {
        const baseQuestion = {
          type: question.type,
          title: question.title.trim(),
          headerImage: question.headerImage || ''
        };

        if (question.type === 'categorize') {
          baseQuestion.categories = (question.categories || []).map(cat => ({
            name: cat.name.trim(),
            points: cat.points || 1
          }));

          baseQuestion.items = (question.items || []).map(item => ({
            text: item.text.trim(),
            belongsTo: item.belongsTo.trim()
          }));
        }

        if (question.type === 'cloze') {
          baseQuestion.text = question.text || '';
          baseQuestion.blanks = question.blanks || [];
          baseQuestion.blankOptions = question.blankOptions || {};
        }

        if (question.type === 'comprehension') {
          baseQuestion.passage = question.passage || '';
          baseQuestion.subQuestions = (question.subQuestions || []).map(subQ => ({
            type: subQ.type || 'mcq',
            question: subQ.question.trim(),
            options: subQ.options || [],
            answer: subQ.answer,
            points: subQ.points || 1
          }));
        }

        return baseQuestion;
      })
    };

    return transformedForm;
  };

  const handleSaveForm = async () => {
    // Validate form data
    const validationErrors = validateFormData(form);
    if (validationErrors.length > 0) {
      alert('Please fix the following errors:\n' + validationErrors.join('\n'));
      return;
    }

    // Transform form data to match schema
    const transformedForm = transformFormDataForSchema(form);

    setSaving(true);
    try {
      if (formId) {
        // Update existing form - PUT request
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/forms/${formId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transformedForm),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update form');
        }

        const result = await response.json();
        alert('Form updated successfully!');
        return result;
      } else {
        // Create new form - POST request
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/forms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transformedForm),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save form');
        }

        const result = await response.json();
        setFormId(result.formId);
        alert(`Form saved successfully! Form ID: ${result.formId}`);
        return result;
      }
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Error saving form: ' + error.message);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const selectedQuestion = selectedQuestionIndex !== null ? form.questions[selectedQuestionIndex] : null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full">
        <div className="px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Form Builder</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  showPreview 
                    ? 'bg-gray-500 text-white hover:bg-gray-600' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'Edit' : 'Preview'}
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
        </div>

        {showPreview ? (
          <div className="w-full">
            <PreviewPane form={form} />
          </div>
        ) : (
          <div className="px-4">
            <div className="space-y-6">
              <div className="space-y-6 w-full">
                <FormHeader form={form} onUpdate={setForm} />
                <QuestionList
                  questions={form.questions}
                  onAddQuestion={handleAddQuestion}
                  onSelectQuestion={setSelectedQuestionIndex}
                  selectedQuestionIndex={selectedQuestionIndex}
                  onDeleteQuestion={handleDeleteQuestion}
                />
              </div>
              
              {selectedQuestion && (
                <div className="mt-8 border-t pt-6 w-full">
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
                  <div className="bg-white rounded-lg shadow-sm border p-6 w-full">
                    <QuestionEditor
                      question={selectedQuestion}
                      onUpdate={handleUpdateQuestion}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateForm;