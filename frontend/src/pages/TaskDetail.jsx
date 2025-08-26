import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Play,
  Download,
  Share2,
  Calendar,
  User,
  Tag,
  Globe,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  BarChart3,
  Bot,
  Zap,
  Clock2,
  Target,
  TrendingUp,
  Shield,
  Eye,
  Code,
  RefreshCw,
  Settings,
  Layers,
  Cpu,
  Monitor,
  Smartphone,
  Database,
  Network,
  Brain,
  Info,
  AlertCircle,
  PlayCircle,
  Pause,
  ExternalLink,
  Download as DownloadIcon,
  FileImage,
  History,
  Filter,
  ChevronDown,
  Search,
  MoreVertical,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import ValidationProgress from "../components/ValidationProgress";
import AISummary from "../components/AISummary";

const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [validations, setValidations] = useState([]);
  const [latestValidation, setLatestValidation] = useState(null);
  const [hasValidation, setHasValidation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedValidation, setSelectedValidation] = useState(null);
  const [showValidationHistory, setShowValidationHistory] = useState(false);

  // Validation progress state
  const [validationSteps, setValidationSteps] = useState([
    {
      title: "Initializing Validation",
      description: "Setting up validation environment and parameters",
      status: "pending",
    },
    {
      title: "Page Scraping",
      description: "Extracting page content and metadata",
      status: "pending",
    },
    {
      title: "Content Validation",
      description: "Validating page content against acceptance criteria",
      status: "pending",
    },
    {
      title: "SEO Analysis",
      description: "Analyzing SEO elements and best practices",
      status: "pending",
    },
    {
      title: "Accessibility Check",
      description: "Checking accessibility compliance",
      status: "pending",
    },
    {
      title: "Performance Analysis",
      description: "Analyzing page performance metrics",
      status: "pending",
    },
    {
      title: "Functional Testing",
      description: "Running automated functional tests",
      status: "pending",
    },
    {
      title: "AI Analysis",
      description: "Generating intelligent insights and recommendations",
      status: "pending",
    },
    {
      title: "Report Generation",
      description: "Compiling final validation report",
      status: "pending",
    },
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isValidationRunning, setIsValidationRunning] = useState(false);

  useEffect(() => {
    fetchTaskData();
  }, [taskId]);

  useEffect(() => {
    if (validations.length > 0 && !selectedValidation) {
      setSelectedValidation(validations[0]);
      setLatestValidation(validations);
    }
  }, [validations]);

  const fetchTaskData = async () => {
    try {
      setLoading(true);

      // Fetch task details
      const taskResponse = await axios.get(`/api/tasks/${taskId}`);
      setTask(taskResponse.data.task);

      // Fetch validation history
      const validationsResponse = await axios.get(
        `/api/validate/task/${taskId}`
      );
      setValidations(validationsResponse.data.validations || []);

      // Check for latest validation
      try {
        const latestValidationResponse = await axios.get(
          `/api/validate/task/${taskId}/latest`
        );
        if (latestValidationResponse.data.success) {
          setHasValidation(latestValidationResponse.data.hasValidation);
          setLatestValidation(latestValidationResponse.data.validation);
        }
      } catch (error) {
        console.log("No latest validation found");
        setHasValidation(false);
        setLatestValidation(null);
      }
    } catch (error) {
      console.error("Error fetching task data:", error);
      toast.error("Failed to load task details");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this task? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await axios.delete(`/api/tasks/${taskId}`);
      toast.success("Task deleted successfully");
      navigate("/tasks");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const startValidation = async () => {
    if (!task) return;

    try {
      setValidating(true);
      setIsValidationRunning(true);
      setCurrentStep(0);

      // Reset validation steps
      setValidationSteps((prev) =>
        prev.map((step) => ({ ...step, status: "pending" }))
      );

      // Simulate step-by-step progress
      const simulateProgress = async () => {
        for (let i = 0; i < validationSteps.length; i++) {
          setCurrentStep(i);

          // Update step status to running
          setValidationSteps((prev) =>
            prev.map((step, index) =>
              index === i ? { ...step, status: "running" } : step
            )
          );

          // Simulate processing time
          await new Promise((resolve) =>
            setTimeout(resolve, 2000 + Math.random() * 3000)
          );

          // Update step status to completed
          setValidationSteps((prev) =>
            prev.map((step, index) =>
              index === i
                ? {
                    ...step,
                    status: "completed",
                    duration: Math.floor(2000 + Math.random() * 3000),
                  }
                : step
            )
          );
        }

        // Complete validation
        setIsValidationRunning(false);
        setValidating(false);

        // Refresh task data to show new validation
        await fetchTaskData();
        toast.success("Validation completed successfully");
      };

      // Start the actual validation
      const validationResponse = await axios.post("/api/validate", {
        taskId: task.id,
        targetUrl: task.targetUrl,
        acceptanceCriteria: {
          title: task.title || "Task Validation",
          content: task.acceptanceCriteria,
          extractData: true,
          generateScreenshots: true,
          generatePDF: false,
          testForms: true,
          crawlSPA: false,
          automationTasks: [
            "Page load validation",
            "Content verification",
            "Form functionality testing",
            "Navigation testing",
            "Performance analysis",
          ],
        },
        taskType: task.taskType,
        priority: task.priority,
      });

      // Start progress simulation
      simulateProgress();
    } catch (error) {
      console.error("Error starting validation:", error);
      toast.error("Failed to start validation");
      setValidating(false);
      setIsValidationRunning(false);
    }
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

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-slate-50 text-slate-700 border-slate-200",
      medium: "bg-amber-50 text-amber-700 border-amber-200",
      high: "bg-orange-50 text-orange-700 border-orange-200",
      critical: "bg-red-50 text-red-700 border-red-200",
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-slate-50 text-slate-700 border-slate-200",
      in_progress: "bg-blue-50 text-blue-700 border-blue-200",
      completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      failed: "bg-red-50 text-red-700 border-red-200",
    };
    return colors[status] || colors.pending;
  };

  const getVerdictColor = (verdict) => {
    const colors = {
      Pass: "bg-emerald-100 text-emerald-800 border-emerald-200",
      Fail: "bg-red-100 text-red-800 border-red-200",
      Partial: "bg-amber-100 text-amber-800 border-amber-200",
      Pending: "bg-slate-100 text-slate-800 border-slate-200",
    };
    return colors[verdict] || colors.Pending;
  };

  const formatDuration = (ms) => {
    if (!ms) return "N/A";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const renderValidationScore = (score, verdict) => {
    const getScoreColor = (score) => {
      if (score >= 80)
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-200";
      return "text-red-600 bg-red-50 border-red-200";
    };

    return (
      <div
        className={`inline-flex items-center px-4 py-2 rounded-lg border font-semibold ${getScoreColor(
          score
        )}`}
      >
        <span className="text-2xl mr-2">{score}%</span>
        <span className="text-sm capitalize">{verdict}</span>
      </div>
    );
  };

  const renderCheckItem = (check, index) => (
    <div
      key={index}
      className="flex items-start justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
    >
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          {check.passed ? (
            <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          )}
          <span className="font-medium text-slate-900">
            {check.type?.replace(/_/g, " ").toUpperCase()}
          </span>
        </div>
        <p className="text-sm text-slate-700 mb-2">{check.description}</p>
        {check.evidence && (
          <p className="text-xs text-slate-500 bg-white p-2 rounded border">
            <strong>Evidence:</strong> {check.evidence}
          </p>
        )}
      </div>
      <div className="ml-4 flex flex-col items-end space-y-1">
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            check.priority === "high"
              ? "bg-red-100 text-red-700"
              : check.priority === "medium"
              ? "bg-amber-100 text-amber-700"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {check.priority}
        </span>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            check.passed
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {check.passed ? "Passed" : "Failed"}
        </span>
      </div>
    </div>
  );

  const renderAutomationStep = (step, index) => {
    const getStatusColor = (status) => {
      switch (status) {
        case "completed":
          return "bg-emerald-100 text-emerald-800 border-emerald-200";
        case "failed":
          return "bg-red-100 text-red-800 border-red-200";
        case "running":
          return "bg-blue-100 text-blue-800 border-blue-200";
        default:
          return "bg-slate-100 text-slate-800 border-slate-200";
      }
    };

    return (
      <div
        key={step.stepId}
        className="border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-600">
              Step {step.stepIndex}
            </span>
            <span
              className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(
                step.status
              )}`}
            >
              {step.status}
            </span>
          </div>
          <span className="text-xs text-slate-500">
            {formatDuration(step.duration)}
          </span>
        </div>

        <h4 className="font-medium text-slate-900 mb-1">{step.description}</h4>
        <p className="text-xs text-slate-600 mb-2 capitalize">
          <strong>Category:</strong> {step.category} | <strong>Action:</strong>{" "}
          {step.action}
        </p>

        {step.evidence && (
          <div className="bg-slate-50 p-3 rounded text-xs text-slate-600 mb-2">
            <strong>Evidence:</strong> {step.evidence}
          </div>
        )}

        {step.error && (
          <div className="bg-red-50 border border-red-200 p-3 rounded text-xs text-red-700">
            <strong>Error:</strong> {step.error}
          </div>
        )}

        {step.files && step.files.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium text-slate-600 mb-1">
              Generated Files:
            </p>
            {step.files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-2 text-xs text-slate-500"
              >
                <FileImage className="h-3 w-3" />
                <span>
                  {file.filename} ({(file.size / 1024).toFixed(1)}KB)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderFunctionalTestResult = (test, index) => {
    const getStatusIcon = (status) => {
      switch (status) {
        case "passed":
          return <CheckCircle className="h-4 w-4 text-emerald-500" />;
        case "failed":
          return <XCircle className="h-4 w-4 text-red-500" />;
        default:
          return <Clock className="h-4 w-4 text-slate-400" />;
      }
    };

    return (
      <div key={index} className="border border-slate-200 rounded-lg p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getStatusIcon(test.status)}
            <span className="font-medium text-slate-900">{test.step}</span>
          </div>
          <span className="text-xs text-slate-500">
            {formatDuration(test.duration)}
          </span>
        </div>

        <p className="text-sm text-slate-600 mb-2 capitalize">
          <strong>Action:</strong> {test.action}
        </p>

        {test.evidence && (
          <div className="bg-slate-50 p-3 rounded text-xs text-slate-600 mb-2">
            <strong>Evidence:</strong> {test.evidence}
          </div>
        )}

        {test.error && (
          <div className="bg-red-50 border border-red-200 p-3 rounded text-xs text-red-700">
            <strong>Error:</strong> {test.error}
          </div>
        )}
      </div>
    );
  };

  const renderValidationHistory = () => (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center">
          <History className="h-5 w-5 mr-2" />
          Validation History ({validations.length})
        </h3>
        <button
          onClick={() => setShowValidationHistory(!showValidationHistory)}
          className="text-slate-500 hover:text-slate-700"
        >
          <ChevronDown
            className={`h-5 w-5 transition-transform ${
              showValidationHistory ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {showValidationHistory && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {validations.map((validation) => (
            <div
              key={validation.id}
              onClick={() => setSelectedValidation(validation)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedValidation?.id === validation.id
                  ? "bg-blue-50 border-blue-200"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getVerdictColor(
                      validation.validationResults?.verdict
                    )}`}
                  >
                    {validation.validationResults?.verdict || "Pending"}
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    Score: {validation.validationResults?.score || 0}%
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(validation.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Processing: {formatDuration(validation.processingTime)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Task not found</p>
          <Link
            to="/tasks"
            className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Back to tasks
          </Link>
        </div>
      </div>
    );
  }

  const currentValidation = selectedValidation || latestValidation;

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
                  {task.title}
                </h1>
              </div>
              <div className="flex items-center space-x-3">
                {currentValidation && (
                  <>
                    {renderValidationScore(
                      currentValidation.validationResults?.score || 0,
                      currentValidation.validationResults?.verdict || "pending"
                    )}
                  </>
                )}
                <Link
                  to={`/tasks/${taskId}/edit`}
                  className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
                <button
                  onClick={handleDeleteTask}
                  className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        {currentValidation && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Validation Score
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {currentValidation.validationResults?.score || 0}%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Processing Time
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatDuration(currentValidation.processingTime)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-emerald-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Automation Success
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {currentValidation.automationResults?.successRate || 0}%
                  </p>
                </div>
                <Bot className="h-8 w-8 text-indigo-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Functional Tests
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {currentValidation.functionalTestResults?.passedTests || 0}/
                    {currentValidation.functionalTestResults?.totalTests || 0}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-amber-500" />
              </div>
            </div>
          </div>
        )}

        {/* Task Overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Task Overview
              </h2>
              <p className="text-slate-600 mb-4">{task.description}</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Task Type
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTaskTypeColor(
                      task.taskType
                    )}`}
                  >
                    {task.taskType}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Priority</p>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                      task.priority
                    )}`}
                  >
                    {task.priority}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Status</p>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      task.status
                    )}`}
                  >
                    {task.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Assignee</p>
                  <p className="text-sm text-slate-600">{task.assignee}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700">Target URL</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <a
                    href={task.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 truncate flex items-center"
                  >
                    {task.targetUrl}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700">Due Date</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <p className="text-sm text-slate-600">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : "No due date"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700">Created</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <p className="text-sm text-slate-600">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 mt-6">
            <h3 className="text-sm font-medium text-slate-900 mb-3">
              Acceptance Criteria
            </h3>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-700 whitespace-pre-line">
                {task.acceptanceCriteria}
              </p>
            </div>
          </div>
        </div>

        {/* Validation Controls */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Validation
              </h3>
              <p className="text-sm text-slate-600">
                Run automated validation tests against the target URL
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {currentValidation && (
                <span className="text-xs text-slate-500">
                  Last run:{" "}
                  {new Date(currentValidation.timestamp).toLocaleString()}
                </span>
              )}
              {!validating && (
                <button
                  onClick={startValidation}
                  disabled={validating}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Play className="h-5 w-5 mr-2" />
                  {currentValidation ? "Re-validate" : "Start Validation"}
                </button>
              )}
              {validating && (
                <button
                  disabled
                  className="inline-flex items-center px-6 py-3 bg-slate-400 text-white rounded-lg cursor-not-allowed"
                >
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Validating...
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Validation Progress */}
        {validating && (
          <div className="mb-8">
            <ValidationProgress
              steps={validationSteps}
              currentStep={currentStep}
              isRunning={isValidationRunning}
              isComplete={false}
              error={null}
            />
          </div>
        )}

        {/* Validation History */}
        {validations.length > 0 && renderValidationHistory()}

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: "overview", name: "Overview", icon: BarChart3 },
                {
                  id: "validation",
                  name: "Validation Results",
                  icon: CheckCircle,
                },
                { id: "automation", name: "Automation", icon: Bot },
                {
                  id: "functional",
                  name: "Functional Tests",
                  icon: PlayCircle,
                },
                // { id: "ai", name: "AI Analysis", icon: Brain },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {currentValidation && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-50 rounded-lg p-6">
                        <h4 className="font-medium text-slate-900 mb-4">
                          Page Data
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-slate-600">
                              Title:
                            </span>
                            <p className="text-sm text-slate-900">
                              {currentValidation.pageData?.title || "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-600">
                              Meta Description:
                            </span>
                            <p className="text-sm text-slate-900">
                              {currentValidation.pageData?.metaDescription ||
                                "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-600">
                              HTML Size:
                            </span>
                            <p className="text-sm text-slate-900">
                              {currentValidation.pageData?.htmlSize
                                ? `${(
                                    currentValidation.pageData.htmlSize / 1024
                                  ).toFixed(1)} KB`
                                : "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-600">
                              Scripts:
                            </span>
                            <p className="text-sm text-slate-900">
                              {currentValidation.pageData?.scriptCount || 0}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-600">
                              Stylesheets:
                            </span>
                            <p className="text-sm text-slate-900">
                              {currentValidation.pageData?.styleCount || 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-6">
                        <h4 className="font-medium text-slate-900 mb-4">
                          Summary
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">
                              Validation Score:
                            </span>
                            <span className="text-sm font-medium text-slate-900">
                              {currentValidation.validationResults?.score || 0}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">
                              Automation Success:
                            </span>
                            <span className="text-sm font-medium text-slate-900">
                              {currentValidation.automationResults
                                ?.successRate || 0}
                              %
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">
                              Functional Tests:
                            </span>
                            <span className="text-sm font-medium text-slate-900">
                              {currentValidation.functionalTestResults
                                ?.passedTests || 0}
                              /
                              {currentValidation.functionalTestResults
                                ?.totalTests || 0}{" "}
                              passed
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">
                              Processing Time:
                            </span>
                            <span className="text-sm font-medium text-slate-900">
                              {formatDuration(currentValidation.processingTime)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Page Images and Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {currentValidation.pageData?.images &&
                        currentValidation.pageData.images.length > 0 && (
                          <div>
                            <h4 className="font-medium text-slate-900 mb-3">
                              Page Images (
                              {currentValidation.pageData.images.length})
                            </h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {currentValidation.pageData.images.map(
                                (image, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center space-x-2 p-2 bg-slate-50 rounded text-xs"
                                  >
                                    <FileImage className="h-4 w-4 text-slate-400" />
                                    <span className="text-slate-600 truncate">
                                      {image.alt || "No alt text"}
                                    </span>
                                    <span className="text-slate-500">
                                      {image.width}×{image.height}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {currentValidation.pageData?.links &&
                        currentValidation.pageData.links.length > 0 && (
                          <div>
                            <h4 className="font-medium text-slate-900 mb-3">
                              Page Links (
                              {currentValidation.pageData.links.length})
                            </h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {currentValidation.pageData.links.map(
                                (link, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2 bg-slate-50 rounded"
                                  >
                                    <a
                                      href={link.href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                    >
                                      {link.text || "Untitled link"}
                                      <ExternalLink className="h-3 w-3 ml-1" />
                                    </a>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Page Forms */}
                    {currentValidation.pageData?.forms &&
                      currentValidation.pageData.forms.length > 0 && (
                        <div>
                          <h4 className="font-medium text-slate-900 mb-3">
                            Page Forms (
                            {currentValidation.pageData.forms.length})
                          </h4>
                          <div className="space-y-4">
                            {currentValidation.pageData.forms.map(
                              (form, idx) => (
                                <div
                                  key={idx}
                                  className="p-4 bg-slate-50 rounded-lg"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-700">
                                      Form {idx + 1}
                                    </span>
                                    <span className="text-xs text-slate-500 px-2 py-1 bg-slate-200 rounded">
                                      {form.method?.toUpperCase() || "GET"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 mb-2">
                                    Action: {form.action}
                                  </p>
                                  <div className="space-y-1">
                                    {form.inputs?.map((input, inputIdx) => (
                                      <div
                                        key={inputIdx}
                                        className="flex items-center justify-between text-xs"
                                      >
                                        <span className="text-slate-600">
                                          {input.label ||
                                            input.placeholder ||
                                            "Unlabeled input"}
                                        </span>
                                        <span className="text-slate-500">
                                          {input.type}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Page Headings */}
                    {currentValidation.pageData?.headings && (
                      <div>
                        <h4 className="font-medium text-slate-900 mb-3">
                          Page Structure
                        </h4>
                        <div className="bg-slate-50 rounded-lg p-4">
                          {Object.entries(
                            currentValidation.pageData.headings
                          ).map(
                            ([level, headings]) =>
                              headings.length > 0 && (
                                <div key={level} className="mb-2">
                                  <span className="text-sm font-medium text-slate-700">
                                    {level.toUpperCase()} ({headings.length}):
                                  </span>
                                  <ul className="ml-4 text-sm text-slate-600">
                                    {headings.map((heading, idx) => (
                                      <li key={idx}>• {heading}</li>
                                    ))}
                                  </ul>
                                </div>
                              )
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Validation Results Tab */}
            {activeTab === "validation" && (
              <div>
                {currentValidation?.validationResults ? (
                  <div className="space-y-8">
                    {/* Validation Summary */}
                    <div className="bg-slate-50 rounded-lg p-6">
                      <h4 className="font-medium text-slate-900 mb-4">
                        Validation Summary
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-slate-600">Verdict</p>
                          {renderValidationScore(
                            currentValidation.validationResults.score || 0,
                            currentValidation.validationResults.verdict ||
                              "pending"
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">
                            Processing Time
                          </p>
                          <p className="text-lg font-semibold text-slate-900">
                            {formatDuration(currentValidation.processingTime)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Completed</p>
                          <p className="text-sm text-slate-900">
                            {new Date(
                              currentValidation.timestamp
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Content Checks */}
                    {currentValidation.validationResults.validationResults
                      ?.contentChecks && (
                      <div>
                        <h5 className="font-medium text-slate-900 mb-4 flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-slate-400" />
                          Content Validation
                        </h5>
                        <div className="space-y-3">
                          {currentValidation.validationResults.validationResults.contentChecks.map(
                            renderCheckItem
                          )}
                        </div>
                      </div>
                    )}

                    {/* SEO Checks */}
                    {currentValidation.validationResults.validationResults
                      ?.seoChecks && (
                      <div>
                        <h5 className="font-medium text-slate-900 mb-4 flex items-center">
                          <TrendingUp className="h-5 w-5 mr-2 text-slate-400" />
                          SEO Validation
                        </h5>
                        <div className="space-y-3">
                          {currentValidation.validationResults.validationResults.seoChecks.map(
                            renderCheckItem
                          )}
                        </div>
                      </div>
                    )}

                    {/* Accessibility Checks */}
                    {currentValidation.validationResults.validationResults
                      ?.accessibilityChecks && (
                      <div>
                        <h5 className="font-medium text-slate-900 mb-4 flex items-center">
                          <Eye className="h-5 w-5 mr-2 text-slate-400" />
                          Accessibility Validation
                        </h5>
                        <div className="space-y-3">
                          {currentValidation.validationResults.validationResults.accessibilityChecks.map(
                            renderCheckItem
                          )}
                        </div>
                      </div>
                    )}

                    {/* Performance Checks */}
                    {currentValidation.validationResults.validationResults
                      ?.performanceChecks && (
                      <div>
                        <h5 className="font-medium text-slate-900 mb-4 flex items-center">
                          <Zap className="h-5 w-5 mr-2 text-slate-400" />
                          Performance Validation
                        </h5>
                        <div className="space-y-3">
                          {currentValidation.validationResults.validationResults.performanceChecks.map(
                            renderCheckItem
                          )}
                        </div>
                      </div>
                    )}

                    {/* Link Checks */}
                    {currentValidation.validationResults.validationResults
                      ?.linkChecks && (
                      <div>
                        <h5 className="font-medium text-slate-900 mb-4 flex items-center">
                          <ExternalLink className="h-5 w-5 mr-2 text-slate-400" />
                          Link Validation
                        </h5>
                        <div className="space-y-3">
                          {currentValidation.validationResults.validationResults.linkChecks.map(
                            renderCheckItem
                          )}
                        </div>
                      </div>
                    )}

                    {/* Form Checks */}
                    {currentValidation.validationResults.validationResults
                      ?.formChecks && (
                      <div>
                        <h5 className="font-medium text-slate-900 mb-4 flex items-center">
                          <Code className="h-5 w-5 mr-2 text-slate-400" />
                          Form Validation
                        </h5>
                        <div className="space-y-3">
                          {currentValidation.validationResults.validationResults.formChecks.map(
                            renderCheckItem
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 text-lg">
                      No validation results yet
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Start a validation to see detailed results here
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Automation Tab */}
            {activeTab === "automation" && (
              <div>
                {currentValidation?.automationResults ? (
                  <div className="space-y-6">
                    {/* Automation Summary */}
                    <div className="bg-slate-50 rounded-lg p-6">
                      <h4 className="font-medium text-slate-900 mb-4">
                        Automation Summary
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-slate-900">
                            {currentValidation.automationResults.totalSteps}
                          </p>
                          <p className="text-sm text-slate-600">Total Steps</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-emerald-600">
                            {currentValidation.automationResults.completedSteps}
                          </p>
                          <p className="text-sm text-slate-600">Completed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">
                            {currentValidation.automationResults.failedSteps}
                          </p>
                          <p className="text-sm text-slate-600">Failed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {currentValidation.automationResults.successRate}%
                          </p>
                          <p className="text-sm text-slate-600">Success Rate</p>
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-sm text-slate-600">
                          Total Duration:{" "}
                          <span className="font-medium">
                            {formatDuration(
                              currentValidation.automationResults.totalDuration
                            )}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Automation Steps */}
                    <div>
                      <h4 className="font-medium text-slate-900 mb-4">
                        Automation Steps
                      </h4>
                      <div className="space-y-4">
                        {currentValidation.automationResults.stepResults?.map(
                          renderAutomationStep
                        )}
                      </div>
                    </div>

                    {/* Generated Files */}
                    {currentValidation.automationResults.generatedFiles &&
                      currentValidation.automationResults.generatedFiles
                        .length > 0 && (
                        <div>
                          <h4 className="font-medium text-slate-900 mb-4">
                            Generated Files
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentValidation.automationResults.generatedFiles.map(
                              (file, idx) => (
                                <div
                                  key={idx}
                                  className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                                >
                                  <div className="flex items-center space-x-3">
                                    <DownloadIcon className="h-8 w-8 text-blue-500" />
                                    <div>
                                      <p className="font-medium text-slate-900">
                                        {file.filename}
                                      </p>
                                      <p className="text-sm text-slate-600">
                                        {file.type.toUpperCase()} •{" "}
                                        {(file.size / 1024).toFixed(1)} KB
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bot className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 text-lg">
                      No automation results yet
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Run validation to see automation results
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Functional Tests Tab */}
            {activeTab === "functional" && (
              <div>
                {currentValidation?.functionalTestResults ? (
                  <div className="space-y-6">
                    {/* Functional Test Summary */}
                    <div className="bg-slate-50 rounded-lg p-6">
                      <h4 className="font-medium text-slate-900 mb-4">
                        Functional Test Summary
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-slate-900">
                            {currentValidation.functionalTestResults.totalTests}
                          </p>
                          <p className="text-sm text-slate-600">Total Tests</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-emerald-600">
                            {
                              currentValidation.functionalTestResults
                                .passedTests
                            }
                          </p>
                          <p className="text-sm text-slate-600">Passed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">
                            {
                              currentValidation.functionalTestResults
                                .failedTests
                            }
                          </p>
                          <p className="text-sm text-slate-600">Failed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {
                              currentValidation.functionalTestResults
                                .successRate
                            }
                            %
                          </p>
                          <p className="text-sm text-slate-600">Success Rate</p>
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-sm text-slate-600">
                          Total Duration:{" "}
                          <span className="font-medium">
                            {formatDuration(
                              currentValidation.functionalTestResults
                                .totalDuration
                            )}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Test Results */}
                    <div>
                      <h4 className="font-medium text-slate-900 mb-4">
                        Test Results
                      </h4>
                      <div className="space-y-4">
                        {currentValidation.functionalTestResults.testResults?.map(
                          renderFunctionalTestResult
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <PlayCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 text-lg">
                      No functional test results yet
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Run validation to see functional test results
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* AI Analysis Tab */}
            {activeTab === "ai" && (
              <div>
                {currentValidation?.aiSummary ? (
                  <div className="prose max-w-none">
                    <div className="bg-slate-50 rounded-lg p-6">
                      <h4 className="font-medium text-slate-900 mb-4 flex items-center">
                        <Brain className="h-5 w-5 mr-2" />
                        AI Analysis & Recommendations
                      </h4>
                      <div className="text-sm text-slate-700 whitespace-pre-line">
                        {currentValidation.aiSummary}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Brain className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 text-lg">No AI analysis yet</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Run validation to see AI-generated insights
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
