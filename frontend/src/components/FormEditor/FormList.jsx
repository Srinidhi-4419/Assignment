import { Plus, Save, Eye, Trash2, Upload, Move, GripVertical, X, Loader2, FileText, PenTool, Award, Clock, Target, CheckCircle, XCircle, BookOpen, Home, Edit, Play, Send, ArrowLeft, User, Calendar, Star, BarChart3 } from 'lucide-react';
export const FormsList = ({ forms, loading, onCreateNew, onEditForm, onTakeTest, onViewAnalytics, viewType }) => {
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