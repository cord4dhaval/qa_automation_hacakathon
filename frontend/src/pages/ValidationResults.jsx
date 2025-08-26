import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Share2,
  FileText,
  BarChart3,
  Globe,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Brain,
  TrendingUp,
  Shield,
  Zap,
  Code,
  Bot,
  Target,
  Calendar,
  User,
  Tag,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import AISummary from "../components/AISummary";

const ValidationResults = () => {
  const { validationId } = useParams();
  const navigate = useNavigate();
  const [validation, setValidation] = useState(null);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showDetails, setShowDetails] = useState(false);

  React.useEffect(() => {
    fetchValidationData();
  }, [validationId]);

  const fetchValidationData = async () => {
    try {
      setLoading(true);

      // Fetch validation details
      const validationResponse = await axios.get(
        `/api/validate/${validationId}`
      );
      setValidation(validationResponse.data.validation);

      // Fetch associated task
      if (validationResponse.data.validation.taskId) {
        const taskResponse = await axios.get(
          `/api/tasks/${validationResponse.data.validation.taskId}`
        );
        setTask(taskResponse.data.task);
      }
    } catch (error) {
      console.error("Error fetching validation data:", error);
      toast.error("Failed to load validation results");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format) => {
    try {
      let url;
      let filename;

      switch (format) {
        case "pdf":
          url = `/api/export/pdf/${validationId}`;
          filename = `validation-report-${validationId}.pdf`;
          break;
        case "csv":
          url = `/api/export/csv/${validationId}`;
          filename = `validation-results-${validationId}.csv`;
          break;
        case "bug-ticket":
          url = `/api/export/bug-ticket/${validationId}`;
          filename = `bug-ticket-${validationId}.json`;
          break;
        default:
          return;
      }

      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${format.toUpperCase()} report downloaded successfully`);
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
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

  const getVerdictColor = (verdict) => {
    const colors = {
      passed: "bg-emerald-100 text-emerald-800 border-emerald-200",
      failed: "bg-red-100 text-red-800 border-red-200",
      partial: "bg-amber-100 text-amber-800 border-amber-200",
      pending: "bg-slate-100 text-slate-800 border-slate-200",
    };
    return colors[verdict] || colors.pending;
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

  const formatDuration = (ms) => {
    if (!ms) return "N/A";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading validation results...</p>
        </div>
      </div>
    );
  }

  if (!validation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Validation not found</p>
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
                  Validation Results
                </h1>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => exportReport("pdf")}
                  className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </button>
                <button
                  onClick={() => exportReport("csv")}
                  className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Validation Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Validation Summary
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-slate-700">Status</p>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      validation.status
                    )}`}
                  >
                    {validation.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Verdict</p>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getVerdictColor(
                      validation.validationResults?.verdict
                    )}`}
                  >
                    {validation.validationResults?.verdict || "Pending"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Score</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {validation.validationResults?.score || 0}%
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Duration</p>
                  <p className="text-sm text-slate-900">
                    {formatDuration(validation.processingTime)}
                  </p>
                </div>
              </div>

              {task && (
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="text-sm font-medium text-slate-900 mb-3">
                    Task Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        Task Title
                      </p>
                      <p className="text-sm text-slate-600">{task.title}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        Task Type
                      </p>
                      <p className="text-sm text-slate-600 capitalize">
                        {task.taskType}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        Priority
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        Assignee
                      </p>
                      <p className="text-sm text-slate-600">{task.assignee}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700">Target URL</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <a
                    href={validation.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 truncate"
                  >
                    {validation.targetUrl}
                  </a>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700">Started</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <p className="text-sm text-slate-600">
                    {new Date(validation.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700">
                  Validation ID
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <Tag className="h-4 w-4 text-slate-400" />
                  <p className="text-sm text-slate-600 font-mono">
                    {validation.id}
                  </p>
                  <button
                    onClick={() => copyToClipboard(validation.id)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                { id: "ai", name: "AI Analysis", icon: Brain },
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-slate-50 rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-slate-900">Status</h4>
                    <p className="text-sm text-slate-600 capitalize">
                      {validation.status}
                    </p>
                  </div>

                  <div className="text-center p-6 bg-slate-50 rounded-lg">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Target className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h4 className="font-medium text-slate-900">Score</h4>
                    <p className="text-lg font-semibold text-slate-900">
                      {validation.validationResults?.score || 0}%
                    </p>
                  </div>

                  <div className="text-center p-6 bg-slate-50 rounded-lg">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Clock className="h-6 w-6 text-amber-600" />
                    </div>
                    <h4 className="font-medium text-slate-900">Duration</h4>
                    <p className="text-sm text-slate-600">
                      {formatDuration(validation.processingTime)}
                    </p>
                  </div>
                </div>

                {/* Score Breakdown */}
                {validation.validationResults?.score && (
                  <div className="bg-slate-50 rounded-lg p-6">
                    <h4 className="font-medium text-slate-900 mb-4">
                      Score Breakdown
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-700">
                            Overall Score
                          </span>
                          <span className="text-sm font-medium text-slate-900">
                            {validation.validationResults.score}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              validation.validationResults.score >= 80
                                ? "bg-emerald-500"
                                : validation.validationResults.score >= 60
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${validation.validationResults.score}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Validation Results Tab */}
            {activeTab === "validation" && (
              <div>
                {validation.validationResults ? (
                  <div className="space-y-6">
                    {/* Content Checks */}
                    {validation.validationResults.validationResults
                      ?.contentChecks && (
                      <div>
                        <h4 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-slate-400" />
                          Content Validation
                        </h4>
                        <div className="space-y-3">
                          {validation.validationResults.validationResults.contentChecks.map(
                            (check, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                              >
                                <span className="text-sm text-slate-700">
                                  {check.description}
                                </span>
                                <div className="flex items-center space-x-3">
                                  {check.passed ? (
                                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                  )}
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                                      check.priority
                                    )}`}
                                  >
                                    {check.priority}
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* SEO Checks */}
                    {validation.validationResults.validationResults
                      ?.seoChecks && (
                      <div>
                        <h4 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
                          <TrendingUp className="h-5 w-5 mr-2 text-slate-400" />
                          SEO Validation
                        </h4>
                        <div className="space-y-3">
                          {validation.validationResults.validationResults.seoChecks.map(
                            (check, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                              >
                                <span className="text-sm text-slate-700">
                                  {check.description}
                                </span>
                                <div className="flex items-center space-x-3">
                                  {check.passed ? (
                                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                  )}
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                                      check.priority
                                    )}`}
                                  >
                                    {check.priority}
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Accessibility Checks */}
                    {validation.validationResults.validationResults
                      ?.accessibilityChecks && (
                      <div>
                        <h4 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
                          <Eye className="h-5 w-5 mr-2 text-slate-400" />
                          Accessibility Validation
                        </h4>
                        <div className="space-y-3">
                          {validation.validationResults.validationResults.accessibilityChecks.map(
                            (check, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                              >
                                <span className="text-sm text-slate-700">
                                  {check.description}
                                </span>
                                <div className="flex items-center space-x-3">
                                  {check.passed ? (
                                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                  )}
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                                      check.priority
                                    )}`}
                                  >
                                    {check.priority}
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">
                      No validation results available
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Automation Tab */}
            {activeTab === "automation" && (
              <div>
                {validation.automationResults ? (
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-slate-900 mb-4">
                      Automation Results
                    </h4>
                    {validation.automationResults.tests?.map((test, index) => (
                      <div
                        key={index}
                        className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-slate-900">
                            {test.name}
                          </h5>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              test.status === "passed"
                                ? "bg-emerald-100 text-emerald-700"
                                : test.status === "failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {test.status}
                          </span>
                        </div>
                        {test.description && (
                          <p className="text-sm text-slate-600 mb-3">
                            {test.description}
                          </p>
                        )}
                        {test.details && (
                          <div className="text-sm text-slate-500 bg-white p-3 rounded border">
                            {test.details}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">
                      No automation results available
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* AI Analysis Tab */}
            {activeTab === "ai" && (
              <div>
                <AISummary
                  summary={validation.aiSummary}
                  validationResults={validation.validationResults}
                  automationResults={validation.automationResults}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationResults;
