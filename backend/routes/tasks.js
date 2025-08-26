const express = require("express");
const router = express.Router();
const Joi = require("joi");
const { collections, firebaseHelpers } = require("../config/firebase");

// Task validation schema
const taskSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).max(1000).required(),
  acceptanceCriteria: Joi.string().min(10).max(2000).required(),
  targetUrl: Joi.string().uri().required(),
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
  assignee: Joi.string().min(2).max(100).required(),
  dueDate: Joi.date().iso().required(),
  compareWithPrevious: Joi.boolean().default(false),
  compareWithDesign: Joi.boolean().default(false),
  tags: Joi.array().items(Joi.string()).max(10).default([]),
  estimatedHours: Joi.number().min(0.5).max(40).optional(),
});

// Create a new task
router.post("/", async (req, res) => {
  try {
    // Validate input
    const { error, value } = taskSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((detail) => detail.message),
      });
    }

    const taskData = {
      ...value,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      validationCount: 0,
      lastValidation: null,
      lastValidationDate: null,
    };

    // Generate unique ID
    const taskId = firebaseHelpers.generateId();

    // Store in Firestore
    await collections.tasks
      .doc(taskId)
      .set(firebaseHelpers.addTimestamps(taskData));

    console.log(`✅ Task created: ${taskId} - ${taskData.title}`);

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: {
        id: taskId,
        ...taskData,
      },
    });
  } catch (error) {
    console.error("❌ Error creating task:", error);
    res.status(500).json({
      error: "Failed to create task",
      message: "An error occurred while creating the task.",
    });
  }
});

// Get all tasks
router.get("/", async (req, res) => {
  try {
    const {
      status,
      priority,
      taskType,
      assignee,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    let query = collections.tasks;

    // Apply filters
    if (status) {
      query = query.where("status", "==", status);
    }
    if (priority) {
      query = query.where("priority", "==", priority);
    }
    if (taskType) {
      query = query.where("taskType", "==", taskType);
    }
    if (assignee) {
      query = query.where("assignee", "==", assignee);
    }

    // Apply sorting
    const sortField = sortBy === "createdAt" ? "createdAt" : "updatedAt";
    const sortDirection = sortOrder === "asc" ? "asc" : "desc";
    query = query.orderBy(sortField, sortDirection);

    // Get total count for pagination
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.limit(parseInt(limit)).offset(offset);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        tasks: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    }

    const tasks = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: firebaseHelpers.timestampToISO(data.createdAt),
        updatedAt: firebaseHelpers.timestampToISO(data.updatedAt),
        dueDate: firebaseHelpers.timestampToISO(data.dueDate),
      };
    });

    res.status(200).json({
      success: true,
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching tasks:", error);
    res.status(500).json({
      error: "Failed to fetch tasks",
      message: "An error occurred while retrieving tasks.",
    });
  }
});

// Get a specific task
router.get("/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    const taskDoc = await collections.tasks.doc(taskId).get();

    if (!taskDoc.exists) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = taskDoc.data();

    res.status(200).json({
      success: true,
      task: {
        id: taskDoc.id,
        ...task,
        createdAt: firebaseHelpers.timestampToISO(task.createdAt),
        updatedAt: firebaseHelpers.timestampToISO(task.updatedAt),
        dueDate: firebaseHelpers.timestampToISO(task.dueDate),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching task:", error);
    res.status(500).json({
      error: "Failed to fetch task",
      message: "An error occurred while retrieving the task.",
    });
  }
});

// Update a task
router.put("/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    // Check if task exists
    const taskDoc = await collections.tasks.doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Filter out forbidden fields from the request body
    const forbiddenFields = [
      "id",
      "status",
      "createdAt",
      "validationCount",
      "lastValidation",
      "lastValidationDate",
      "updatedAt",
    ];

    const filteredBody = { ...req.body };
    forbiddenFields.forEach((field) => {
      delete filteredBody[field];
    });

    console.log(
      `🔍 Updating task ${taskId} with fields:`,
      Object.keys(filteredBody)
    );

    // Create update schema that excludes fields that shouldn't be updated
    const updateSchema = Joi.object({
      title: Joi.string().min(3).max(200).optional(),
      description: Joi.string().min(10).max(1000).optional(),
      acceptanceCriteria: Joi.string().min(10).max(2000).optional(),
      targetUrl: Joi.string().uri().optional(),
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
        .optional(),
      priority: Joi.string()
        .valid("low", "medium", "high", "critical")
        .optional(),
      assignee: Joi.string().min(2).max(100).optional(),
      dueDate: Joi.date().iso().optional(),
      compareWithPrevious: Joi.boolean().optional(),
      compareWithDesign: Joi.boolean().optional(),
      tags: Joi.array().items(Joi.string()).max(10).optional(),
      estimatedHours: Joi.number().min(0.5).max(40).optional(),
    });

    const { error, value } = updateSchema.validate(filteredBody);

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((detail) => detail.message),
      });
    }

    // Prepare update data
    const updateData = {
      ...value,
      updatedAt: new Date().toISOString(),
    };

    // Update in Firestore
    await collections.tasks
      .doc(taskId)
      .update(firebaseHelpers.addTimestamps(updateData, true));

    console.log(`✅ Task updated: ${taskId}`);

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating task:", error);
    res.status(500).json({
      error: "Failed to update task",
      message: "An error occurred while updating the task.",
    });
  }
});

// Delete a task
router.delete("/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    // Check if task exists
    const taskDoc = await collections.tasks.doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Delete task
    await collections.tasks.doc(taskId).delete();

    // Delete related validations
    const validationsSnapshot = await collections.validations
      .where("taskId", "==", taskId)
      .get();

    const deletePromises = validationsSnapshot.docs.map((doc) =>
      doc.ref.delete()
    );
    await Promise.all(deletePromises);

    console.log(`✅ Task deleted: ${taskId}`);

    res.status(200).json({
      success: true,
      message: "Task and related validations deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting task:", error);
    res.status(500).json({
      error: "Failed to delete task",
      message: "An error occurred while deleting the task.",
    });
  }
});

// Update task status
router.patch("/:taskId/status", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["pending", "in_progress", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status",
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Check if task exists
    const taskDoc = await collections.tasks.doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Update status
    await collections.tasks.doc(taskId).update({
      status,
      updatedAt: firebaseHelpers.isoToTimestamp(new Date().toISOString()),
    });

    console.log(`✅ Task status updated: ${taskId} -> ${status}`);

    res.status(200).json({
      success: true,
      message: "Task status updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating task status:", error);
    res.status(500).json({
      error: "Failed to update task status",
      message: "An error occurred while updating the task status.",
    });
  }
});

// Get task statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const tasksSnapshot = await collections.tasks.get();
    const validationsSnapshot = await collections.validations.get();

    const tasks = tasksSnapshot.docs.map((doc) => doc.data());
    const validations = validationsSnapshot.docs.map((doc) => doc.data());

    // Calculate statistics
    const stats = {
      totalTasks: tasks.length,
      totalValidations: validations.length,
      tasksByStatus: {},
      tasksByPriority: {},
      tasksByType: {},
      averageScore: 0,
      validationSuccessRate: 0,
    };

    // Status breakdown
    tasks.forEach((task) => {
      stats.tasksByStatus[task.status] =
        (stats.tasksByStatus[task.status] || 0) + 1;
      stats.tasksByPriority[task.priority] =
        (stats.tasksByPriority[task.priority] || 0) + 1;
      stats.tasksByType[task.taskType] =
        (stats.tasksByType[task.taskType] || 0) + 1;
    });

    // Validation statistics
    if (validations.length > 0) {
      const totalScore = validations.reduce(
        (sum, val) => sum + (val.score || 0),
        0
      );
      stats.averageScore = Math.round(totalScore / validations.length);

      const passedValidations = validations.filter(
        (val) => val.verdict === "Pass"
      ).length;
      stats.validationSuccessRate = Math.round(
        (passedValidations / validations.length) * 100
      );
    }

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("❌ Error fetching statistics:", error);
    res.status(500).json({
      error: "Failed to fetch statistics",
      message: "An error occurred while retrieving task statistics.",
    });
  }
});

module.exports = router;
