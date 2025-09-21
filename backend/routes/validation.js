const express = require("express");
const router = express.Router();
const Joi = require("joi");
const ValidationService = require("../services/validationService");
const { collections, firebaseHelpers, admin } = require("../config/firebase");
const websocketService = require("../services/websocketService");

const validationService = new ValidationService();

// Validation schema
const validationSchema = Joi.object({
  taskId: Joi.string().required(),
  targetUrl: Joi.string().uri().required(),
  acceptanceCriteria: Joi.object({
    title: Joi.string().allow("").optional(),
    h1: Joi.string().allow("").optional(),
    content: Joi.string().allow("").optional(),
    customChecks: Joi.array().items(Joi.string()).optional(),
    automationTasks: Joi.array().items(Joi.string()).optional(),
    extractData: Joi.boolean().optional(),
    generateScreenshots: Joi.boolean().optional(),
    generatePDF: Joi.boolean().optional(),
    testForms: Joi.boolean().optional(),
    crawlSPA: Joi.boolean().optional(),
    customScripts: Joi.array().items(Joi.string()).optional(),
  }).required(),
  taskType: Joi.string()
    .valid(
      "functional",
      "ui",
      "accessibility",
      "seo",
      "performance",
      "automation",
      "scraping",
      "comprehensive"
    )
    .required(),
  priority: Joi.string().valid("low", "medium", "high", "critical").required(),
  status: Joi.string().valid("in_progress", "completed", "failed").optional(),
});

// Automation schema
const automationSchema = Joi.object({
  taskId: Joi.string().required(),
  targetUrl: Joi.string().uri().required(),
  acceptanceCriteria: Joi.object({
    automationTasks: Joi.array().items(Joi.string()).required(),
    extractData: Joi.boolean().optional(),
    generateScreenshots: Joi.boolean().optional(),
    generatePDF: Joi.boolean().optional(),
    testForms: Joi.boolean().optional(),
    crawlSPA: Joi.boolean().optional(),
    customScripts: Joi.array().items(Joi.string()).optional(),
  }).required(),
  priority: Joi.string().valid("low", "medium", "high", "critical").required(),
});

// Validate a web page against acceptance criteria
router.post("/", async (req, res) => {
  try {
    // Validate input
    const { error, value } = validationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((detail) => detail.message),
      });
    }

    const { taskId, targetUrl, acceptanceCriteria, taskType, priority } = value;

    console.log(`🔍 Starting validation for task ${taskId} at ${targetUrl}`);

    // Check if task exists
    const taskDoc = await collections.tasks.doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check if a validation is already in progress for this task
    const existingValidationDoc = await collections.validations
      .where("taskId", "==", taskId)
      .where("status", "==", "in_progress")
      .limit(1)
      .get();

    if (!existingValidationDoc.empty) {
      return res.status(409).json({
        error: "Validation already in progress for this task",
        message: "Please wait for the current validation to complete.",
      });
    }

    // Start validation process
    const startTime = Date.now();

    // Create initial validation record with in_progress status
    const initialValidation = {
      id: firebaseHelpers.generateId(),
      taskId,
      targetUrl,
      taskType,
      priority,
      acceptanceCriteria,
      status: "in_progress",
      timestamp: new Date().toISOString(),
    };

    // Store initial validation record
    await collections.validations
      .doc(initialValidation.id)
      .set(firebaseHelpers.addTimestamps(initialValidation));

    // Scrape the page
    console.log(`📄 Scraping page: ${targetUrl}`);
    const pageData = await validationService.scrapePage(targetUrl);

    // Validate against acceptance criteria
    console.log(`✅ Running validation checks`);
    const validationResults = await validationService.validatePage(
      pageData,
      acceptanceCriteria
    );

    // Run simplified Playwright automation for all task types
    let functionalTestResults = null;
    let automationResults = null;

    // Always run Playwright automation with visible browser for all task types
    console.log(
      `🎭 Running simplified Playwright automation for task type: ${taskType}`
    );
    automationResults = await validationService.runPlaywrightAutomation(
      targetUrl,
      acceptanceCriteria,
      (progressData) => {
        // Broadcast progress to WebSocket clients
        websocketService.broadcastAutomationProgress(taskId, progressData);
      },
      false, // headless = false for visible browser
      true // connectToExisting = true to use existing browser window
    );

    console.log(
      `✅ Automation completed with ${automationResults.successRate}% success rate`
    );

    // Generate AI summary
    console.log(`🤖 Generating AI analysis`);
    let aiSummary;
    if (automationResults) {
      aiSummary = await validationService.generateAISummary(
        validationResults,
        pageData,
        acceptanceCriteria,
        functionalTestResults,
        automationResults
      );
    } else {
      aiSummary = await validationService.generateAISummary(
        validationResults,
        pageData,
        acceptanceCriteria,
        functionalTestResults
      );
    }

    // Prepare final result
    const result = {
      id: initialValidation.id,
      taskId,
      targetUrl,
      taskType,
      priority,
      acceptanceCriteria,
      validationResults,
      pageData,
      functionalTestResults,
      automationResults,
      aiSummary,
      processingTime: Date.now() - startTime,
      status: "completed",
      timestamp: new Date().toISOString(),
    };

    // Update validation record with results
    await collections.validations
      .doc(result.id)
      .update(firebaseHelpers.addTimestamps(result, true));

    // Update task with latest validation
    await collections.tasks.doc(taskId).update({
      lastValidation: result.id,
      lastValidationDate: firebaseHelpers.isoToTimestamp(
        new Date().toISOString()
      ),
      validationCount: admin.firestore.FieldValue.increment(1),
    });

    console.log(
      `✅ Validation completed for task ${taskId} in ${result.processingTime}ms`
    );

    res.status(200).json({
      success: true,
      message: "Validation completed successfully",
      result,
    });
  } catch (error) {
    console.error("❌ Validation error:", error);

    // If we have an initial validation ID, update it to failed status
    if (req.body.taskId) {
      try {
        const failedValidation = {
          status: "failed",
          error: error.message,
          timestamp: new Date().toISOString(),
        };

        // Find the in_progress validation for this task and update it
        const inProgressValidation = await collections.validations
          .where("taskId", "==", req.body.taskId)
          .where("status", "==", "in_progress")
          .limit(1)
          .get();

        if (!inProgressValidation.empty) {
          const validationDoc = inProgressValidation.docs[0];
          await collections.validations
            .doc(validationDoc.id)
            .update(firebaseHelpers.addTimestamps(failedValidation, true));
        }
      } catch (updateError) {
        console.error(
          "Failed to update validation status to failed:",
          updateError
        );
      }
    }

    // Handle specific error types
    if (error.message.includes("Failed to scrape page")) {
      return res.status(400).json({
        error: "Page scraping failed",
        message:
          "Unable to access the target URL. Please check if the URL is accessible and try again.",
        details: error.message,
      });
    }

    if (error.message.includes("timeout")) {
      return res.status(408).json({
        error: "Request timeout",
        message:
          "The page took too long to load. Please try again or check if the URL is accessible.",
        details: error.message,
      });
    }

    res.status(500).json({
      error: "Validation failed",
      message:
        "An unexpected error occurred during validation. Please try again.",
      details:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Run comprehensive automation for a task
router.post("/automation", async (req, res) => {
  try {
    // Validate input
    const { error, value } = automationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((detail) => detail.message),
      });
    }

    const { taskId, targetUrl, acceptanceCriteria, priority } = value;

    console.log(
      `🤖 Starting comprehensive automation for task ${taskId} at ${targetUrl}`
    );

    // Check if task exists
    const taskDoc = await collections.tasks.doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Start automation process
    const startTime = Date.now();

    // Create initial automation record
    const initialAutomation = {
      id: firebaseHelpers.generateId(),
      taskId,
      targetUrl,
      taskType: "automation",
      priority,
      acceptanceCriteria,
      status: "in_progress",
      timestamp: new Date().toISOString(),
    };

    // Store initial record
    await collections.validations
      .doc(initialAutomation.id)
      .set(firebaseHelpers.addTimestamps(initialAutomation));

    // Run comprehensive automation with WebSocket callback
    console.log(`🚀 Running comprehensive automation for: ${targetUrl}`);
    const automationResults =
      await validationService.runComprehensiveAutomation(
        targetUrl,
        acceptanceCriteria,
        (progressData) => {
          // Broadcast progress to WebSocket clients
          websocketService.broadcastAutomationProgress(taskId, progressData);
        }
      );

    // Generate AI summary
    console.log(`🤖 Generating automation analysis`);
    const aiSummary =
      await validationService.automationService.generateAutomationSummary(
        automationResults,
        acceptanceCriteria
      );

    // Prepare result
    const result = {
      id: initialAutomation.id,
      taskId,
      targetUrl,
      taskType: "automation",
      priority,
      acceptanceCriteria,
      automationResults,
      aiSummary,
      processingTime: Date.now() - startTime,
      status: "completed",
      timestamp: new Date().toISOString(),
    };

    // Update automation record with results
    await collections.validations
      .doc(result.id)
      .update(firebaseHelpers.addTimestamps(result, true));

    // Update task with latest automation
    await collections.tasks.doc(taskId).update({
      lastValidation: result.id,
      lastValidationDate: firebaseHelpers.isoToTimestamp(
        new Date().toISOString()
      ),
      validationCount: admin.firestore.FieldValue.increment(1),
    });

    console.log(
      `✅ Automation completed for task ${taskId} in ${result.processingTime}ms`
    );

    res.status(200).json({
      success: true,
      message: "Automation completed successfully",
      result,
    });
  } catch (error) {
    console.error("❌ Automation error:", error);

    // Update status to failed if we have an initial automation ID
    if (req.body.taskId) {
      try {
        const failedAutomation = {
          status: "failed",
          error: error.message,
          timestamp: new Date().toISOString(),
        };

        const inProgressAutomation = await collections.validations
          .where("taskId", "==", req.body.taskId)
          .where("status", "==", "in_progress")
          .limit(1)
          .get();

        if (!inProgressAutomation.empty) {
          const automationDoc = inProgressAutomation.docs[0];
          await collections.validations
            .doc(automationDoc.id)
            .update(firebaseHelpers.addTimestamps(failedAutomation, true));
        }
      } catch (updateError) {
        console.error(
          "Failed to update automation status to failed:",
          updateError
        );
      }
    }

    res.status(500).json({
      error: "Automation failed",
      message:
        "An unexpected error occurred during automation. Please try again.",
      details:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Run functional tests for an existing task
router.post("/functional/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    console.log(`🔧 Starting functional tests for task: ${taskId}`);

    // Check if task exists
    const taskDoc = await collections.tasks.doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = taskDoc.data();
    const { targetUrl, acceptanceCriteria } = task;

    // Start functional test process
    const startTime = Date.now();

    // Run functional tests
    console.log(`🚀 Running functional tests for: ${targetUrl}`);
    const functionalTestResults = await validationService.runFunctionalTests(
      targetUrl,
      acceptanceCriteria
    );

    // Generate AI summary for functional tests
    console.log(`🤖 Generating functional test analysis`);
    const aiSummary = await validationService.generateAISummary(
      null, // No static validation results
      null, // No page data
      acceptanceCriteria,
      functionalTestResults
    );

    // Prepare result
    const result = {
      id: firebaseHelpers.generateId(),
      taskId,
      targetUrl,
      taskType: "functional",
      priority: task.priority || "medium",
      acceptanceCriteria,
      functionalTestResults,
      aiSummary,
      processingTime: Date.now() - startTime,
      status: "completed",
      timestamp: new Date().toISOString(),
    };

    // Store result in Firestore
    await collections.validations
      .doc(result.id)
      .set(firebaseHelpers.addTimestamps(result));

    console.log(`✅ Functional tests completed for task: ${taskId}`);

    res.status(200).json({
      success: true,
      message: "Functional tests completed successfully",
      result,
    });
  } catch (error) {
    console.error("❌ Functional test execution failed:", error);
    res.status(500).json({
      error: "Failed to execute functional tests",
      message: "An error occurred while running functional tests.",
    });
  }
});

// Get validation results for a task
router.get("/task/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    console.log(`🔍 Fetching validations for task: ${taskId}`);

    // First try with ordering (requires index)
    try {
      const validationsSnapshot = await collections.validations
        .where("taskId", "==", taskId)
        .orderBy("timestamp", "desc")
        .get();

      if (validationsSnapshot.empty) {
        console.log(`📭 No validations found for task: ${taskId}`);
        return res
          .status(404)
          .json({ error: "No validations found for this task" });
      }

      const validations = validationsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: firebaseHelpers.timestampToISO(data.createdAt),
          updatedAt: firebaseHelpers.timestampToISO(data.updatedAt),
        };
      });

      // Sort manually in case index is not ready
      validations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      console.log(
        `✅ Found ${validations.length} validations for task: ${taskId}`
      );
      res.status(200).json({
        success: true,
        validations,
      });
    } catch (indexError) {
      if (indexError.code === 9 && indexError.message.includes("index")) {
        console.log(
          `⚠️ Index not ready, using fallback query for task: ${taskId}`
        );

        // Fallback: get all validations and sort in memory
        const validationsSnapshot = await collections.validations
          .where("taskId", "==", taskId)
          .get();

        if (validationsSnapshot.empty) {
          console.log(`📭 No validations found for task: ${taskId}`);
          return res
            .status(404)
            .json({ error: "No validations found for this task" });
        }

        const validations = validationsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: firebaseHelpers.timestampToISO(data.createdAt),
            updatedAt: firebaseHelpers.timestampToISO(data.updatedAt),
          };
        });

        // Sort manually
        validations.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );

        console.log(
          `✅ Found ${validations.length} validations for task: ${taskId} (fallback)`
        );
        res.status(200).json({
          success: true,
          validations,
        });
      } else {
        throw indexError;
      }
    }
  } catch (error) {
    console.error("❌ Error fetching validations:", error);
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
    });
    res.status(500).json({
      error: "Failed to fetch validations",
      message: "An error occurred while retrieving validation results.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get the latest validation for a task
router.get("/task/:taskId/latest", async (req, res) => {
  try {
    const { taskId } = req.params;
    console.log(`🔍 Fetching latest validation for task: ${taskId}`);

    // First try with ordering (requires index)
    try {
      const validationsSnapshot = await collections.validations
        .where("taskId", "==", taskId)
        .orderBy("timestamp", "desc")
        .limit(1)
        .get();

      if (validationsSnapshot.empty) {
        console.log(`📭 No validations found for task: ${taskId}`);
        return res.status(200).json({
          success: true,
          hasValidation: false,
          validation: null,
        });
      }

      const validationDoc = validationsSnapshot.docs[0];
      const validation = validationDoc.data();

      console.log(
        `✅ Found latest validation for task: ${taskId}, ID: ${validationDoc.id}`
      );
      res.status(200).json({
        success: true,
        hasValidation: true,
        validation: {
          id: validationDoc.id,
          ...validation,
          createdAt: firebaseHelpers.timestampToISO(validation.createdAt),
          updatedAt: firebaseHelpers.timestampToISO(validation.updatedAt),
        },
      });
    } catch (indexError) {
      if (indexError.code === 9 && indexError.message.includes("index")) {
        console.log(
          `⚠️ Index not ready, using fallback query for task: ${taskId}`
        );

        // Fallback: get all validations and find the latest
        const validationsSnapshot = await collections.validations
          .where("taskId", "==", taskId)
          .get();

        if (validationsSnapshot.empty) {
          console.log(`📭 No validations found for task: ${taskId}`);
          return res.status(200).json({
            success: true,
            hasValidation: false,
            validation: null,
          });
        }

        // Find the latest validation manually
        let latestValidation = null;
        let latestTimestamp = null;

        validationsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const timestamp = data.timestamp || data.createdAt;

          if (
            !latestTimestamp ||
            new Date(timestamp) > new Date(latestTimestamp)
          ) {
            latestTimestamp = timestamp;
            latestValidation = { id: doc.id, ...data };
          }
        });

        if (latestValidation) {
          console.log(
            `✅ Found latest validation for task: ${taskId}, ID: ${latestValidation.id} (fallback)`
          );
          res.status(200).json({
            success: true,
            hasValidation: true,
            validation: {
              id: latestValidation.id,
              ...latestValidation,
              createdAt: firebaseHelpers.timestampToISO(
                latestValidation.createdAt
              ),
              updatedAt: firebaseHelpers.timestampToISO(
                latestValidation.updatedAt
              ),
            },
          });
        } else {
          return res.status(200).json({
            success: true,
            hasValidation: false,
            validation: null,
          });
        }
      } else {
        throw indexError;
      }
    }
  } catch (error) {
    console.error("❌ Error fetching latest validation:", error);
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
    });
    res.status(500).json({
      error: "Failed to fetch latest validation",
      message:
        "An error occurred while retrieving the latest validation result.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get a specific validation result
router.get("/:validationId", async (req, res) => {
  try {
    const { validationId } = req.params;

    const validationDoc = await collections.validations.doc(validationId).get();

    if (!validationDoc.exists) {
      return res.status(404).json({ error: "Validation result not found" });
    }

    const validation = validationDoc.data();

    res.status(200).json({
      success: true,
      validation: {
        id: validationDoc.id,
        ...validation,
        createdAt: firebaseHelpers.timestampToISO(validation.createdAt),
        updatedAt: firebaseHelpers.timestampToISO(validation.updatedAt),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching validation:", error);
    res.status(500).json({
      error: "Failed to fetch validation",
      message: "An error occurred while retrieving the validation result.",
    });
  }
});

// Delete a validation result
router.delete("/:validationId", async (req, res) => {
  try {
    const { validationId } = req.params;

    const validationDoc = await collections.validations.doc(validationId).get();

    if (!validationDoc.exists) {
      return res.status(404).json({ error: "Validation result not found" });
    }

    await collections.validations.doc(validationId).delete();

    res.status(200).json({
      success: true,
      message: "Validation result deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting validation:", error);
    res.status(500).json({
      error: "Failed to delete validation",
      message: "An error occurred while deleting the validation result.",
    });
  }
});

// Health check for validation service
router.get("/health", async (req, res) => {
  try {
    // Test Puppeteer
    const testUrl = "https://example.com";
    const pageData = await validationService.scrapePage(testUrl);

    res.status(200).json({
      status: "healthy",
      puppeteer: "working",
      openai: "configured",
      timestamp: new Date().toISOString(),
      testUrl,
      testResult: {
        title: pageData.title,
        h1: pageData.h1,
      },
    });
  } catch (error) {
    console.error("❌ Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
