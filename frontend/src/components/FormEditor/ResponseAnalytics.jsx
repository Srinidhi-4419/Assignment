import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Award, 
  Clock, 
  Eye,
  Calendar,
  Target,
  CheckCircle,
  XCircle,
  FileText,
  Loader2,
  ChevronRight,
  User,
  Star,
  Activity,
  PieChart,
  Filter
} from 'lucide-react';

const ResponseAnalytics = ({ formId, formTitle, onBack }) => {
  const [responses, setResponses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('overview'); // 'overview', 'responses', 'detail'
  const [filterScore, setFilterScore] = useState('all');

  useEffect(() => {
    if (formId) {
      loadResponsesAndAnalytics();
    }
  }, [formId]);

  const loadResponsesAndAnalytics = async () => {
    setLoading(true);
    try {
      // Load both responses and analytics
      const [responsesRes, analyticsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/forms/${formId}/responses`),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/forms/${formId}/analytics`)
      ]);

      if (responsesRes.ok && analyticsRes.ok) {
        const responsesData = await responsesRes.json();
        const analyticsData = await analyticsRes.json();
        
        setResponses(responsesData.responses || []);
        setAnalytics(analyticsData);
      } else {
        console.error('Failed to load data');
      }
    } catch (error) {
      console.error('Error loading responses and analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResponseDetail = async (responseId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/forms/responses/${responseId}`);
      if (response.ok) {
        const responseData = await response.json();
        setSelectedResponse(responseData);
        setView('detail');
      }
    } catch (error) {
      console.error('Error loading response detail:', error);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreBadge = (score) => {
    if (score >= 90) return { text: 'Excellent', color: 'bg-green-500' };
    if (score >= 80) return { text: 'Good', color: 'bg-blue-500' };
    if (score >= 70) return { text: 'Average', color: 'bg-yellow-500' };
    if (score >= 60) return { text: 'Below Average', color: 'bg-orange-500' };
    return { text: 'Poor', color: 'bg-red-500' };
  };

  const filteredResponses = responses.filter(response => {
    if (filterScore === 'all') return true;
    const score = response.percentageScore || 0;
    switch (filterScore) {
      case 'excellent': return score >= 90;
      case 'good': return score >= 80 && score < 90;
      case 'average': return score >= 70 && score < 80;
      case 'below': return score < 70;
      default: return true;
    }
  });

  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds) return '0m';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  // Response Detail View
  if (view === 'detail' && selectedResponse) {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setView('responses')}
                  className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Responses
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Response Detail</h1>
                  <p className="text-sm text-gray-600">
                    Submitted on {new Date(selectedResponse.submittedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${getScoreColor(selectedResponse.percentageScore || 0)}`}>
                  Score: {Math.round(selectedResponse.percentageScore || 0)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Response Detail Content */}
        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Score</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(selectedResponse.percentageScore || 0)}%</p>
                </div>
                <Award className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Points Earned</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedResponse.totalScore || 0}</p>
                </div>
                <Target className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Max Points</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedResponse.maxScore || 0}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Time Taken</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatTime(selectedResponse.timeSpent || 0)}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Detailed Response Analysis */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Question-wise Analysis</h3>
            <div className="space-y-6">
              {selectedResponse.responses?.map((qResponse, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        Q{index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Question {index + 1}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">
                          {qResponse.questionType} Question
                        </p>
                        <p className="text-sm text-gray-600">
                          Points: {qResponse.totalPointsEarned || 0} / {qResponse.maxPossiblePoints || 0}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      (qResponse.totalPointsEarned || 0) === (qResponse.maxPossiblePoints || 0) 
                        ? 'bg-green-100 text-green-800' 
                        : (qResponse.totalPointsEarned || 0) > 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {(qResponse.totalPointsEarned || 0) === (qResponse.maxPossiblePoints || 0) 
                        ? 'Correct' 
                        : (qResponse.totalPointsEarned || 0) > 0
                        ? 'Partial'
                        : 'Incorrect'
                      }
                    </div>
                  </div>

                  {/* Show specific response details based on question type */}
                  {qResponse.questionType === 'categorize' && qResponse.categorizedItems && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Categorization Results:</p>
                      <div className="space-y-2">
                        {qResponse.categorizedItems.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm text-gray-700">"{item.itemText}"</span>
                              <span className="text-xs text-gray-500">→</span>
                              <span className="text-sm font-medium text-gray-900">
                                {item.selectedCategory}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {item.correctCategory && item.selectedCategory !== item.correctCategory && (
                                <span className="text-xs text-green-600">
                                  Correct: {item.correctCategory}
                                </span>
                              )}
                              {item.isCorrect ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {qResponse.questionType === 'cloze' && qResponse.blankAnswers && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Fill-in-the-blank Answers:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {qResponse.blankAnswers.map((blank, blankIndex) => (
                          <div key={blankIndex} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs text-gray-500">Blank {blank.blankIndex + 1}</p>
                              {blank.isCorrect ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            <p className={`font-medium text-sm ${blank.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                              "{blank.userAnswer}"
                            </p>
                            {blank.correctAnswer && !blank.isCorrect && (
                              <p className="text-xs text-green-600 mt-1">Correct: "{blank.correctAnswer}"</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {qResponse.questionType === 'comprehension' && qResponse.subQuestionAnswers && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Comprehension Answers:</p>
                      <div className="space-y-3">
                        {qResponse.subQuestionAnswers.map((subAnswer, subIndex) => (
                          <div key={subIndex} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-gray-500">Sub-question {subAnswer.subQuestionIndex + 1}</p>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-600">
                                  {subAnswer.pointsEarned || 0} / {subAnswer.maxPoints || 1} pts
                                </span>
                                {subAnswer.isCorrect ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm text-gray-800">
                                Answer: {typeof subAnswer.answer === 'boolean' ? 
                                  (subAnswer.answer ? 'True' : 'False') : 
                                  typeof subAnswer.answer === 'number' ? 
                                    `Option ${subAnswer.answer + 1}` : 
                                  subAnswer.answer}
                              </p>
                              {subAnswer.correctAnswer !== undefined && !subAnswer.isCorrect && (
                                <p className="text-xs text-green-600">
                                  Correct: {typeof subAnswer.correctAnswer === 'boolean' ? 
                                    (subAnswer.correctAnswer ? 'True' : 'False') : 
                                    typeof subAnswer.correctAnswer === 'number' ? 
                                      `Option ${subAnswer.correctAnswer + 1}` : 
                                    subAnswer.correctAnswer}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Responses List View
  if (view === 'responses') {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setView('overview')}
                  className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Overview
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">All Responses</h1>
                  <p className="text-sm text-gray-600">{formTitle}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <select 
                  value={filterScore}
                  onChange={(e) => setFilterScore(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Scores</option>
                  <option value="excellent">Excellent (90%+)</option>
                  <option value="good">Good (80-89%)</option>
                  <option value="average">Average (70-79%)</option>
                  <option value="below">Below Average (&lt;70%)</option>
                </select>
                <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium">
                  {filteredResponses.length} responses
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Responses List */}
        <div className="max-w-7xl mx-auto p-6">
          {filteredResponses.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No responses found</h3>
              <p className="text-gray-600">No responses match your current filter criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResponses.map((response, index) => {
                const scoreBadge = getScoreBadge(response.percentageScore || 0);
                return (
                  <div
                    key={response._id}
                    onClick={() => loadResponseDetail(response._id)}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full font-medium">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="flex items-center space-x-3">
                            <User className="w-4 h-4 text-gray-400" />
                            <p className="font-medium text-gray-900">Anonymous User</p>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${scoreBadge.color}`}>
                              {scoreBadge.text}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Submitted on {new Date(response.submittedAt).toLocaleDateString()} at{' '}
                            {new Date(response.submittedAt).toLocaleTimeString()}
                          </p>
                          {response.ipAddress && (
                            <p className="text-xs text-gray-500 mt-1">IP: {response.ipAddress}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getScoreColor(response.percentageScore || 0).split(' ')[0]}`}>
                            {Math.round(response.percentageScore || 0)}%
                          </p>
                          <p className="text-sm text-gray-600">
                            {response.totalScore || 0} / {response.maxScore || 0} points
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Time taken</p>
                          <p className="font-medium text-gray-900">
                            {formatTime(response.timeSpent || 0)}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Overview/Analytics View
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Response Analytics</h1>
                <p className="text-sm text-gray-600">{formTitle}</p>
              </div>
            </div>
            <button
              onClick={() => setView('responses')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Eye className="w-4 h-4 mr-2" />
              View All Responses
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Content */}
      <div className="max-w-7xl mx-auto p-6">
        {!analytics || analytics.totalResponses === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
            <p className="text-gray-600">Once people start taking your test, analytics will appear here.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Responses</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.totalResponses}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Average Score</p>
                    <p className="text-3xl font-bold text-gray-900">{Math.round(analytics.averageScore)}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Highest Score</p>
                    <p className="text-3xl font-bold text-gray-900">{Math.round(analytics.highestScore)}%</p>
                  </div>
                  <Award className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Lowest Score</p>
                    <p className="text-3xl font-bold text-gray-900">{Math.round(analytics.lowestScore)}%</p>
                  </div>
                  <Activity className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </div>

            {/* Score Distribution */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                Score Distribution
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {analytics.scoreDistribution?.map((dist, index) => (
                  <div key={index} className="text-center">
                    <div className="bg-gray-100 rounded-lg p-4 mb-2">
                      <p className="text-2xl font-bold text-gray-900">{dist.count}</p>
                      <p className="text-sm text-gray-600">{Math.round(dist.percentage)}%</p>
                    </div>
                    <p className="text-sm font-medium text-gray-700">{dist.range}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Question Analytics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Question Performance
              </h3>
              <div className="space-y-4">
                {analytics.questionAnalytics?.map((qa, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          Q{qa.questionIndex + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{qa.questionTitle || `Question ${qa.questionIndex + 1}`}</p>
                          <p className="text-sm text-gray-600 capitalize">{qa.questionType} question</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{Math.round(qa.accuracyRate)}%</p>
                        <p className="text-sm text-gray-600">accuracy</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span>Total attempts: {qa.totalAttempts}</span>
                        <span>Correct: {qa.correctAnswers}</span>
                        <span>Avg points: {Math.round((qa.averagePoints || 0) * 100) / 100}</span>
                      </div>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${qa.accuracyRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Submissions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Recent Submissions
              </h3>
              <div className="space-y-3">
                {analytics.recentSubmissions?.map((submission, index) => (
                  <div 
                    key={submission.id}
                    onClick={() => loadResponseDetail(submission.id)}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                        #{index + 1}
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(submission.score)}`}>
                        {Math.round(submission.score)}%
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseAnalytics;