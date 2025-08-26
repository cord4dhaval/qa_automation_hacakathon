import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Globe,
  User,
  Calendar,
  Tag,
  Target,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Bot,
  Zap,
  Eye,
  TrendingUp,
  Shield,
  Activity,
  Plus,
  X,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const TaskForm = () => {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [task, setTask] = useState({
    title: "",
    description: "",
    targetUrl: "",
    taskType: "functional",
    priority: "medium",
    status: "pending",
    assignee: "",
    dueDate: "",
    acceptanceCriteria: "",
    tags: [],
    compareWithPrevious: false,
    compareWithDesign: false,
    estimatedHours: "",
  });

  useEffect(() => {
    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/tasks/${taskId}`);
      setTask(response.data.task);
    } catch (error) {
      console.error("Error fetching task:", error);
      toast.error("Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (taskId) {
        await axios.put(`/api/tasks/${taskId}`, task);
        toast.success("Task updated successfully");
      } else {
        await axios.post("/api/tasks", task);
        toast.success("Task created successfully");
      }
      navigate("/tasks");
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTask((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    setTask((prev) => ({
      ...prev,
      tags,
    }));
  };

  const addTag = (tag) => {
    if (tag && !task.tags.includes(tag)) {
      setTask((prev) => ({
        ...prev,
        tags: [...prev.tags, tag.trim()],
      }));
    }
  };

  const removeTag = (tagToRemove) => {
    setTask((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
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
      comprehensive: <FileText className="h-4 w-4" />,
    };
    return icons[type] || icons.functional;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading task...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  to="/tasks"
                  className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Tasks
                </Link>
                <div className="h-6 w-px bg-slate-300"></div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {taskId ? "Edit Task" : "Create New Task"}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Task Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={task.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label
                  htmlFor="taskType"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Task Type *
                </label>
                <select
                  id="taskType"
                  name="taskType"
                  value={task.taskType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="functional">Functional Testing</option>
                  <option value="ui">UI Testing</option>
                  <option value="accessibility">Accessibility Testing</option>
                  <option value="seo">SEO Testing</option>
                  <option value="performance">Performance Testing</option>
                  <option value="automation">Automation</option>
                  <option value="scraping">Web Scraping</option>
                  <option value="comprehensive">Comprehensive Testing</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="priority"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Priority *
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={task.priority}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="assignee"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Assignee *
                </label>
                <input
                  type="text"
                  id="assignee"
                  name="assignee"
                  value={task.assignee}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter assignee name"
                />
              </div>

              <div>
                <label
                  htmlFor="dueDate"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Due Date *
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={task.dueDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="estimatedHours"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Estimated Hours
                </label>
                <input
                  type="number"
                  id="estimatedHours"
                  name="estimatedHours"
                  value={task.estimatedHours}
                  onChange={handleInputChange}
                  min="0.5"
                  max="40"
                  step="0.5"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., 4.5"
                />
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={task.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Describe the task in detail"
              />
            </div>
          </div>

          {/* Target URL */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              Target URL
            </h2>

            <div>
              <label
                htmlFor="targetUrl"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Website URL *
              </label>
              <div className="flex items-center space-x-3">
                <Globe className="h-5 w-5 text-slate-400" />
                <input
                  type="url"
                  id="targetUrl"
                  name="targetUrl"
                  value={task.targetUrl}
                  onChange={handleInputChange}
                  required
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Acceptance Criteria */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              Acceptance Criteria
            </h2>

            <div>
              <label
                htmlFor="acceptanceCriteria"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Acceptance Criteria *
              </label>
              <textarea
                id="acceptanceCriteria"
                name="acceptanceCriteria"
                value={task.acceptanceCriteria}
                onChange={handleInputChange}
                required
                rows={6}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Define the acceptance criteria for this task..."
              />
              <p className="text-sm text-slate-500 mt-2">
                Describe what needs to be validated, tested, or accomplished
              </p>
            </div>
          </div>

          {/* Additional Options */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              Additional Options
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="compareWithPrevious"
                  name="compareWithPrevious"
                  checked={task.compareWithPrevious}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label
                  htmlFor="compareWithPrevious"
                  className="text-sm text-slate-700"
                >
                  Compare with previous version
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="compareWithDesign"
                  name="compareWithDesign"
                  checked={task.compareWithDesign}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label
                  htmlFor="compareWithDesign"
                  className="text-sm text-slate-700"
                >
                  Compare with design mockups
                </label>
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="tags"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Tags
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={task.tags.join(", ")}
                  onChange={handleTagsChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter tags separated by commas"
                />

                {/* Display current tags */}
                {task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Link
              to="/tasks"
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {taskId ? "Update Task" : "Create Task"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
