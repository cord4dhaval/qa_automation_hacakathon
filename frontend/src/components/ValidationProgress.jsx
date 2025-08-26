import React from "react";
import { CheckCircle, Clock, AlertCircle, Play, Loader2 } from "lucide-react";

const ValidationProgress = ({
  steps,
  currentStep,
  isRunning,
  isComplete,
  error,
}) => {
  const getStepIcon = (step, index) => {
    if (error && index === currentStep) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }

    if (index < currentStep) {
      return <CheckCircle className="h-5 w-5 text-emerald-500" />;
    }

    if (index === currentStep && isRunning) {
      return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    }

    if (index === currentStep && !isRunning) {
      return <Play className="h-5 w-5 text-blue-500" />;
    }

    return <Clock className="h-5 w-5 text-slate-400" />;
  };

  const getStepStatus = (step, index) => {
    if (error && index === currentStep) {
      return "error";
    }

    if (index < currentStep) {
      return "completed";
    }

    if (index === currentStep) {
      return "current";
    }

    return "pending";
  };

  const getStepClasses = (status) => {
    const baseClasses =
      "flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200";

    switch (status) {
      case "completed":
        return `${baseClasses} bg-emerald-50 border-emerald-200`;
      case "current":
        return `${baseClasses} bg-blue-50 border-blue-200`;
      case "error":
        return `${baseClasses} bg-red-50 border-red-200`;
      default:
        return `${baseClasses} bg-slate-50 border-slate-200`;
    }
  };

  const getStepTextColor = (status) => {
    switch (status) {
      case "completed":
        return "text-emerald-700";
      case "current":
        return "text-blue-700";
      case "error":
        return "text-red-700";
      default:
        return "text-slate-600";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Validation Progress
        </h3>
        <div className="flex items-center space-x-2">
          {isRunning && (
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Running...</span>
            </div>
          )}
          {isComplete && (
            <div className="flex items-center space-x-2 text-sm text-emerald-600">
              <CheckCircle className="h-4 w-4" />
              <span>Complete</span>
            </div>
          )}
          {error && (
            <div className="flex items-center space-x-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>Error</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const status = getStepStatus(step, index);
          const stepClasses = getStepClasses(status);
          const textColor = getStepTextColor(status);

          return (
            <div key={index} className={stepClasses}>
              <div className="flex-shrink-0">{getStepIcon(step, index)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-medium ${textColor}`}>
                    {step.title}
                  </h4>
                  {step.duration && status === "completed" && (
                    <span className="text-xs text-slate-500">
                      {step.duration}ms
                    </span>
                  )}
                </div>
                {step.description && (
                  <p className={`text-sm mt-1 ${textColor}`}>
                    {step.description}
                  </p>
                )}
                {step.details && status === "completed" && (
                  <div className="mt-2 p-2 bg-white rounded border border-slate-200">
                    <p className="text-xs text-slate-600">{step.details}</p>
                  </div>
                )}
                {step.error && status === "error" && (
                  <div className="mt-2 p-2 bg-red-100 rounded border border-red-200">
                    <p className="text-xs text-red-700">{step.error}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
          <span>Progress</span>
          <span>{Math.round((currentStep / steps.length) * 100)}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              error ? "bg-red-500" : "bg-blue-500"
            }`}
            style={{
              width: `${Math.min((currentStep / steps.length) * 100, 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ValidationProgress;
