import User from "../models/user.model.js";
import Task from "../models/task.model.js";
import Submission from "../models/submission.model.js";

// Controller to create a new task
export const createTask = async (req, res) => {
  try {
    const {
      uid, // firebaseUid
      title,
      detail,
      requiredWorkers,
      payableAmount,
      completionDate,
      submissionInfo,
      imageUrl,
    } = req.body;

    if (
      !uid ||
      !title ||
      !detail ||
      !requiredWorkers ||
      !payableAmount ||
      !completionDate ||
      !submissionInfo ||
      !imageUrl
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Step 1: Find the user by firebaseUid
    const user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
   //console.log("user", user, "user role", user.role);

    if(user.role !== "BUYER"){
      return res.status(403).json({ message: "You are not authorized to create tasks" });
    }

    // Step 2: Calculate the total amount of coins needed
    const coinsNeeded = payableAmount * requiredWorkers;

    // Step 3: Check if the user has enough coins
    if (user.coins < coinsNeeded) {
      return res.status(400).json({
        message:
          "Insufficient coins. Please purchase more coins to create this task.",
      });
    }

    // Step 4: Deduct coins from user's account
    user.coins -= coinsNeeded;
    await user.save();

    // Step 5: Create the task in the database
    const newTask = new Task({
      title,
      detail,
      requiredWorkers,
      payableAmount,
      completionDate,
      submissionInfo,
      imageUrl,
      totalPayableAmount: coinsNeeded,
      createdBy: user._id,
    });

    await newTask.save();

    // Step 6: Respond with success message and task details
    return res.status(201).json({
      message: "Task created successfully",
      task: newTask,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error. Please try again later." });
  }
};

// Controller to get all tasks
export const getAllTasksByUserUid = async (req, res) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res
        .status(400)
        .json({ message: "Missing required user information." });
    }

    // Step 1: Find the user by firebaseUid
    const user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Step 2: Fetch all tasks created by the user
    const tasks = await Task.find({ createdBy: user._id });

    // Step 3: Respond with the list of tasks
    return res.status(200).json({
      message: "Tasks retrieved successfully",
      tasks,
    });
  } catch (error) {
    console.error("Error retrieving tasks:", error);
    return res.status(500).json({
      message:
        "Server error. Unable to retrieve tasks. Please try again later.",
    });
  }
};

// Controller to get all tasks with submission details
export const getAllTasksWithSubmissionData = async (req, res) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res
        .status(400)
        .json({ message: "Missing required user information." });
    }

    // Step 1: Find the user by firebaseUid
    const user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    // Step 2: Fetch all tasks for the user and populate submissions
    const tasks = await Task.find({ createdBy: user._id }).populate({
      path: "submissions",
      select: "_id workerName submissionDetails status", // Select only necessary fields
    });

    // Step 3: Initialize states
    let totalTasks = 0;
    let totalPendingWorkers = 0;
    let totalPaid = 0;
    const pendingTasks = [];

    // Step 4: Process tasks to calculate states and collect pending tasks
    tasks.forEach((task) => {
      totalTasks++;
      totalPaid += task.totalPayableAmount;

      const pendingSubmissions = task.submissions.filter(
        (submission) => submission.status === "pending"
      );

      if (pendingSubmissions.length > 0) {
        pendingTasks.push({
          taskId: task._id,
          title: task.title,
          payableAmount: task.payableAmount,
          pendingSubmissions,
        });
      }

      totalPendingWorkers += task.requiredWorkers;
    });

    // Step 5: Respond with the aggregated stats and pending tasks
    return res.status(200).json({
      message: "Buyer task stats retrieved successfully",
      stats: {
        totalTasks,
        totalPendingWorkers,
        totalPaid,
      },
      pendingTasks,
    });
  } catch (error) {
    console.error("Error fetching buyer task stats:", error);
    return res.status(500).json({
      message:
        "Server error. Unable to retrieve buyer task stats. Please try again later.",
    });
  }
};

// Controller to approve a submission for a task
export const approveSubmission = async (req, res) => {
  try {
    const { submissionId } = req.body; // Submission ID from frontend

    if (!submissionId) {
      return res
        .status(400)
        .json({ message: "Missing required submission information." });
    }
    // Step 1: Find the submission document by ID
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Step 2: Find the worker's User document using workerInfo
    const worker = await User.findById(submission.workerInfo);
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    // Step 3: Update worker's coins by adding the payable amount
    const task = await Task.findById(submission.taskInfo);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    worker.coins += task.payableAmount;
    await worker.save();

    // Step 4: Update the Task document to reduce requiredWorkers by 1
    task.requiredWorkers = Math.max(0, task.requiredWorkers - 1);
    await task.save();

    // Step 5: Update the submission document status to "approved"
    submission.status = "approved";
    await submission.save();

    // Step 6: Respond with success
    return res.status(200).json({
      message: "Submission approved successfully",
    });
  } catch (error) {
    console.error("Error approving submission:", error);
    return res.status(500).json({
      message:
        "Server error. Unable to approve submission. Please try again later.",
    });
  }
};

// Controller to reject a submission for a task
export const rejectSubmission = async (req, res) => {
  try {
    const { submissionId } = req.body; // Submission ID from the frontend

    if (!submissionId) {
      return res
        .status(400)
        .json({ message: "Missing required submission information." });
    }

    // Step 1: Find the submission document by ID
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Step 2: Update the status field to "rejected"
    submission.status = "rejected";
    await submission.save();

    // Step 3: Respond with success
    return res.status(200).json({
      message: "Submission rejected successfully",
      submission,
    });
  } catch (error) {
    console.error("Error rejecting submission:", error);
    return res.status(500).json({
      message:
        "Server error. Unable to reject submission. Please try again later.",
    });
  }
};

// Controller to update a task
export const updateTask = async (req, res) => {
  try {
    const { uid, taskId, title, detail, submissionInfo } = req.body;

    if (!uid || !taskId) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Step 1: Find the user by firebaseUid
    const user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Step 2: Find the task document by taskId
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Step 3: Check if the user is the creator of the task
    if (task.createdBy.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You do not have permission to update this task" });
    }

    // Step 4: Update the task fields
    task.title = title || task.title;
    task.detail = detail || task.detail;
    task.submissionInfo = submissionInfo || task.submissionInfo;

    // Save the updated task
    await task.save();

    // Step 5: Respond with success
    return res.status(200).json({
      message: "Task updated successfully",
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({
      message: "Server error. Unable to update task. Please try again later.",
    });
  }
};

// Controller to delete a task
export const deleteTask = async (req, res) => {
  try {
    const { uid, taskId } = req.params;
    console.log("uid: ", uid, "taskId: ", taskId);

    if (!uid || !taskId) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Step 1: Find the user by firebaseUid
    const user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Step 2: Find the task document by taskId
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Step 3: Check if the user is the creator of the task
    if (task.createdBy.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You do not have permission to delete this task" });
    }

    // Step 4: Delete the task
    await Task.findByIdAndDelete(taskId); // Corrected deletion method

    // Step 5: Respond with success
    return res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({
      message: "Server error. Unable to delete task. Please try again later.",
    });
  }
};

