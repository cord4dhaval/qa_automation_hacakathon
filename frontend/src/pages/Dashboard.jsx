import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock2,
  Bot,
  Zap,
  Globe,
  Download,
  Camera,
  MousePointer,
  BarChart3,
  Users,
  Activity,
  ArrowRight,
  Eye,
  Code,
  Shield,
  Play,
  FileText,
  Layers,
  Cpu,
  AlertCircle,
  CheckCircle2,
  Timer,
  Target,
  TrendingDown,
} from "lucide-react";
import axios from "axios";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTasks: 0,
    totalValidations: 0,
    tasksByStatus: {},
    tasksByPriority: {},
    tasksByType: {},
    averageScore: 0,
    validationSuccessRate: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentValidations, setRecentValidations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, tasksResponse] = await Promise.all([
        axios.get("/api/tasks/stats/overview"),
        axios.get("/api/tasks?limit=5&sortBy=createdAt&sortOrder=desc"),
      ]);

      console.log(statsResponse.data.stats);
      setStats(statsResponse.data.stats);
      setRecentTasks(tasksResponse.data.tasks || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      pending: "bg-slate-50 text-slate-700 border-slate-200",
      in_progress: "bg-blue-50 text-blue-700 border-blue-200",
      failed: "bg-red-50 text-red-700 border-red-200",
    };
    return colors[status] || colors.pending;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-slate-50 text-slate-700 border-slate-200",
      medium: "bg-amber-50 text-amber-700 border-amber-200",
      high: "bg-orange-50 text-orange-700 border-orange-200",
      critical: "bg-red-50 text-red-700 border-red-200",
    };
    return colors[priority] || colors.medium;
  };

  const getTaskTypeColor = (type) => {
    const colors = {
      functional: "bg-blue-50 text-blue-700 border-blue-200",
      ui: "bg-purple-50 text-purple-700 border-purple-200",
      accessibility: "bg-emerald-50 text-emerald-700 border-emerald-200",
      seo: "bg-amber-50 text-amber-700 border-amber-200",
      performance: "bg-orange-50 text-orange-700 border-orange-200",
      automation: "bg-indigo-50 text-indigo-700 border-indigo-200",
      scraping: "bg-teal-50 text-teal-700 border-teal-200",
      comprehensive: "bg-slate-50 text-slate-700 border-slate-200",
    };
    return colors[type] || colors.functional;
  };

  const getTaskTypeIcon = (type) => {
    const icons = {
      functional: <Activity className="h-4 w-4" />,
      ui: <Eye className="h-4 w-4" />,
      accessibility: <Shield className="h-4 w-4" />,
      seo: <TrendingUp className="h-4 w-4" />,
      performance: <Zap className="h-4 w-4" />,
      automation: <Bot className="h-4 w-4" />,
      scraping: <Target className="h-4 w-4" />,
      comprehensive: <Code className="h-4 w-4" />,
    };
    return icons[type] || icons.functional;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatFirestoreDate = (firestoreDate) => {
    if (!firestoreDate || !firestoreDate._seconds) return "N/A";
    return new Date(firestoreDate._seconds * 1000).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                <p className="mt-2 text-lg text-slate-600">
                  Welcome back! Here's an overview of your QA automation tasks.
                </p>
              </div>
              <Link
                to="/tasks/new"
                className="inline-flex items-center px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Task
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">
                  Total Tasks
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.totalTasks}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">
                  Total Validations
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.totalValidations}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Avg Score</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.averageScore}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">
                  Success Rate
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.validationSuccessRate}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Tasks by Status */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <Clock2 className="h-5 w-5 mr-2 text-slate-400" />
              Tasks by Status
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.tasksByStatus || {}).map(
                ([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </div>
                    <span className="text-lg font-semibold text-slate-900">
                      {count}
                    </span>
                  </div>
                )
              )}
              {Object.keys(stats.tasksByStatus || {}).length === 0 && (
                <p className="text-slate-500 text-sm">
                  No status data available
                </p>
              )}
            </div>
          </div>

          {/* Tasks by Priority */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-slate-400" />
              Tasks by Priority
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.tasksByPriority || {}).map(
                ([priority, count]) => (
                  <div
                    key={priority}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                          priority
                        )}`}
                      >
                        {priority}
                      </span>
                    </div>
                    <span className="text-lg font-semibold text-slate-900">
                      {count}
                    </span>
                  </div>
                )
              )}
              {Object.keys(stats.tasksByPriority || {}).length === 0 && (
                <p className="text-slate-500 text-sm">
                  No priority data available
                </p>
              )}
            </div>
          </div>

          {/* Tasks by Type */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <Layers className="h-5 w-5 mr-2 text-slate-400" />
              Tasks by Type
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.tasksByType || {}).map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    {getTaskTypeIcon(type)}
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTaskTypeColor(
                        type
                      )}`}
                    >
                      {type}
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-slate-900">
                    {count}
                  </span>
                </div>
              ))}
              {Object.keys(stats.tasksByType || {}).length === 0 && (
                <p className="text-slate-500 text-sm">No type data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Platform Overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 mb-8 shadow-sm">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              QA Automation Platform
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Comprehensive web validation and testing platform powered by
              advanced automation technology. Validate websites for content,
              SEO, accessibility, performance, and functionality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Content Validation
              </h3>
              <p className="text-sm text-slate-600">
                Verify page content, titles, and metadata against requirements
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                SEO Analysis
              </h3>
              <p className="text-sm text-slate-600">
                Check meta tags, headings, and SEO best practices
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Accessibility
              </h3>
              <p className="text-sm text-slate-600">
                Ensure websites meet accessibility standards
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Performance
              </h3>
              <p className="text-sm text-slate-600">
                Analyze page load times and resource optimization
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Code className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Form Testing
              </h3>
              <p className="text-sm text-slate-600">
                Validate form functionality and user interactions
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Functional Tests
              </h3>
              <p className="text-sm text-slate-600">
                Run automated tests for critical user workflows
              </p>
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Recent Tasks
                </h3>
                <Link
                  to="/tasks"
                  className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentTasks.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No tasks created yet</p>
                  <Link
                    to="/tasks/new"
                    className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Create your first task
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTaskTypeColor(
                              task.taskType
                            )}`}
                          >
                            {task.taskType}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              task.status
                            )}`}
                          >
                            {task.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-slate-900 truncate">
                          {task.title}
                        </h4>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                          <span>Due: {formatDate(task.dueDate)}</span>
                          <span>Validations: {task.validationCount || 0}</span>
                          {task.lastValidationDate && (
                            <span>
                              Last:{" "}
                              {formatFirestoreDate(task.lastValidationDate)}
                            </span>
                          )}
                        </div>
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700"
                              >
                                {tag}
                              </span>
                            ))}
                            {task.tags.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700">
                                +{task.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <Link
                        to={`/tasks/${task.id}`}
                        className="ml-4 flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Quick Actions
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <Link
                  to="/tasks/new"
                  className="flex items-center p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mr-4">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">
                      Create New Task
                    </h4>
                    <p className="text-xs text-slate-500">
                      Set up a new validation task
                    </p>
                  </div>
                </Link>

                <Link
                  to="/tasks"
                  className="flex items-center p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mr-4">
                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">
                      View All Tasks
                    </h4>
                    <p className="text-xs text-slate-500">
                      Browse and manage your tasks
                    </p>
                  </div>
                </Link>

                <Link
                  to="/tasks?status=in_progress"
                  className="flex items-center p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mr-4">
                    <Activity className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">
                      Active Tasks
                    </h4>
                    <p className="text-xs text-slate-500">
                      Monitor ongoing validations
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
