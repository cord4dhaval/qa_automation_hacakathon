import React, { useState } from "react";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronRight,
  FileText,
  Eye,
  Shield,
  Zap,
  Code,
  Activity,
} from "lucide-react";

const AISummary = ({ summary, validationResults, automationResults }) => {
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    recommendations: true,
    issues: true,
    automation: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-50 text-red-700 border-red-200";
      case "high":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "low":
        return "bg-slate-50 text-slate-700 border-slate-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case "content":
        return <FileText className="h-4 w-4" />;
      case "seo":
        return <TrendingUp className="h-4 w-4" />;
      case "accessibility":
        return <Eye className="h-4 w-4" />;
      case "performance":
        return <Zap className="h-4 w-4" />;
      case "security":
        return <Shield className="h-4 w-4" />;
      case "functionality":
        return <Code className="h-4 w-4" />;
      case "automation":
        return <Activity className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  if (!summary && !validationResults && !automationResults) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="text-center py-8">
          <Brain className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">No AI analysis available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            AI Analysis Summary
          </h3>
          <p className="text-sm text-slate-600">
            Intelligent insights and recommendations
          </p>
        </div>
      </div>

      {/* Executive Summary */}
      {summary?.executiveSummary && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Executive Summary</h4>
          <p className="text-sm text-blue-800">{summary.executiveSummary}</p>
        </div>
      )}

      {/* Overall Score */}
      {summary?.overallScore && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Overall Quality Score
            </span>
            <span className="text-lg font-bold text-slate-900">
              {summary.overallScore}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                summary.overallScore >= 80
                  ? "bg-emerald-500"
                  : summary.overallScore >= 60
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${summary.overallScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Key Findings */}
      {summary?.keyFindings && (
        <div className="mb-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection("overview")}
          >
            <h4 className="font-medium text-slate-900">Key Findings</h4>
            {expandedSections.overview ? (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-slate-400" />
            )}
          </div>
          {expandedSections.overview && (
            <div className="mt-3 space-y-2">
              {summary.keyFindings.map((finding, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {finding.type === "positive" ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : finding.type === "negative" ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Info className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">
                      {finding.description}
                    </p>
                    {finding.impact && (
                      <p className="text-xs text-slate-500 mt-1">
                        Impact: {finding.impact}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Critical Issues */}
      {summary?.criticalIssues && summary.criticalIssues.length > 0 && (
        <div className="mb-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection("issues")}
          >
            <h4 className="font-medium text-slate-900">Critical Issues</h4>
            {expandedSections.issues ? (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-slate-400" />
            )}
          </div>
          {expandedSections.issues && (
            <div className="mt-3 space-y-3">
              {summary.criticalIssues.map((issue, index) => (
                <div
                  key={index}
                  className="p-4 bg-red-50 rounded-lg border border-red-200"
                >
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h5 className="font-medium text-red-900">
                          {issue.title}
                        </h5>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                            issue.severity
                          )}`}
                        >
                          {issue.severity}
                        </span>
                      </div>
                      <p className="text-sm text-red-800 mb-2">
                        {issue.description}
                      </p>
                      {issue.recommendation && (
                        <div className="bg-white p-3 rounded border border-red-200">
                          <p className="text-xs text-red-700">
                            <span className="font-medium">Recommendation:</span>{" "}
                            {issue.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {summary?.recommendations && (
        <div className="mb-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection("recommendations")}
          >
            <h4 className="font-medium text-slate-900">Recommendations</h4>
            {expandedSections.recommendations ? (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-slate-400" />
            )}
          </div>
          {expandedSections.recommendations && (
            <div className="mt-3 space-y-3">
              {summary.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="p-4 bg-emerald-50 rounded-lg border border-emerald-200"
                >
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h5 className="font-medium text-emerald-900 mb-2">
                        {rec.title}
                      </h5>
                      <p className="text-sm text-emerald-800 mb-2">
                        {rec.description}
                      </p>
                      {rec.priority && (
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                            rec.priority
                          )}`}
                        >
                          Priority: {rec.priority}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Automation Results */}
      {automationResults && (
        <div className="mb-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection("automation")}
          >
            <h4 className="font-medium text-slate-900">Automation Results</h4>
            {expandedSections.automation ? (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-slate-400" />
            )}
          </div>
          {expandedSections.automation && (
            <div className="mt-3 space-y-3">
              {automationResults.tests?.map((test, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-slate-900">{test.name}</h5>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
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
                    <p className="text-sm text-slate-600 mb-2">
                      {test.description}
                    </p>
                  )}
                  {test.details && (
                    <div className="text-xs text-slate-500 bg-white p-2 rounded border">
                      {test.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Technical Details */}
      {summary?.technicalDetails && (
        <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h4 className="font-medium text-slate-900 mb-3">Technical Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {Object.entries(summary.technicalDetails).map(([key, value]) => (
              <div key={key}>
                <span className="font-medium text-slate-700">{key}:</span>
                <span className="ml-2 text-slate-600">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AISummary;
