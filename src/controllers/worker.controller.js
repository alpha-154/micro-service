import User from "../models/user.model.js";
import Submission from "../models/submission.model.js";
import Task from "../models/task.model.js";
import Withdrawal from "../models/withdrawal.model.js";

// Controller to fetch worker submission stats with approved submissions documents
export const getWorkerSubmissionStatsWithApprovedSubmissions = async (
  req,
  res
) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res
        .status(400)
        .json({ message: "Missing required user information." });
    }

    // Step 1: Find the user by firebaseUid
    const user = await User.findOne({ firebaseUid: uid });
    if (!user || user.role !== "WORKER") {
      return res.status(404).json({ message: "Worker not found" });
    }

    // Step 2: Find all submissions for the worker and populate the taskInfo field
    const submissions = await Submission.find({
      workerInfo: user._id,
    }).populate({
      path: "taskInfo",
      select: "payableAmount", // Only fetch the payableAmount field from the Task model
    });

    // Step 3: Calculate states
    let totalSubmissions = 0;
    let totalPendingSubmissions = 0;
    let totalEarning = 0;
    const approvedSubmissions = [];

    submissions.forEach((submission) => {
      totalSubmissions++;
      if (submission.status === "pending") {
        totalPendingSubmissions++;
      }
      if (submission.status === "approved") {
        totalEarning += submission.taskInfo?.payableAmount || 0; // Add payableAmount to totalEarning
        approvedSubmissions.push(submission); // Collect approved submissions
      }
    });

    // Step 4: Respond with the calculated states and approved submissions
    return res.status(200).json({
      message: "Worker submission stats retrieved successfully",
      stats: {
        totalSubmissions,
        totalPendingSubmissions,
        totalEarning,
      },
      approvedSubmissions,
    });
  } catch (error) {
    console.error("Error fetching worker submission stats:", error);
    return res.status(500).json({
      message:
        "Server error. Unable to retrieve worker submission stats. Please try again later.",
    });
  }
};

// Controller to fetch all valid task list for the worker
export const getValidTasks = async (req, res) => {
  try {
    // Step 1: Find all tasks where requiredWorkers >= 1, excluding the submissions field
    const validTasks = await Task.find({ requiredWorkers: { $gte: 1 } })
      .select("-submissions")
      .populate("createdBy", "username"); // Populate createdBy with only the username field
    // Step 2: Check if any tasks are found
    if (validTasks.length === 0) {
      return res.status(404).json({ message: "No valid tasks available" });
    }

    // Step 3: Respond with the valid tasks
    return res.status(200).json({
      message: "Valid tasks retrieved successfully",
      tasks: validTasks,
    });
  } catch (error) {
    console.error("Error fetching valid tasks:", error);
    return res.status(500).json({
      message:
        "Server error. Unable to fetch valid tasks. Please try again later.",
    });
  }
};

// Controller to fetch a specific task by TaskID
export const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({ message: "Task ID is required." });
    }

    // Step 1: Find the task by taskId and exclude the submissions field
    const task = await Task.findById(taskId)
      .select("-submissions")
      .populate("createdBy", "username email");

    // Step 2: Check if the task exists
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Step 3: Respond with the task
    return res.status(200).json({
      message: "Task retrieved successfully",
      task,
    });
  } catch (error) {
    console.error("Error fetching task by ID:", error);
    return res.status(500).json({
      message: "Server error. Unable to fetch task. Please try again later.",
    });
  }
};

// Controller to handle worker task submissions
export const submitTask = async (req, res) => {
  try {
    const {
      taskId,
      title,
      workerUid,
      submissionDetails,
      buyerId,
      currentDate,
    } = req.body;

    console.log(taskId, title, workerUid, submissionDetails, buyerId);

    if (
      !taskId ||
      !title ||
      !workerUid ||
      !submissionDetails ||
      !buyerId ||
      !currentDate
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Step 1: Find the worker by their firebaseUid
    const worker = await User.findOne({ firebaseUid: workerUid });
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    // Step 2: Find the buyer by their ObjectId
    const buyer = await User.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    // Step 3: Find the task by taskId
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Step 4: Ensure the worker has not already submitted this task
    const existingSubmission = await Submission.findOne({
      taskInfo: taskId,
      workerInfo: worker._id,
    });
    if (existingSubmission) {
      return res
        .status(400)
        .json({ message: "You have already submitted this task" });
    }

    // Step 5: Create the submission document
    const newSubmission = new Submission({
      taskTitle: title,
      taskInfo: task._id,
      workerName: worker.username,
      workerInfo: worker._id,
      buyerName: buyer.username,
      buyerInfo: buyer._id,
      submissionDetails,
      submittedAt: currentDate,
    });

    // Save the submission to the database
    await newSubmission.save();

    // Store the submission ID in the task submissions array
    task.submissions.push(newSubmission._id);
    await task.save();

    // Step 6: Respond with success
    return res.status(201).json({
      message: "Task submission created successfully",
    });
  } catch (error) {
    console.error("Error submitting task:", error);
    return res.status(500).json({
      message: "Server error. Unable to submit task. Please try again later.",
    });
  }
};

// Controller to fetch all tasks submitted by a worker
// export const getWorkerSubmissions = async (req, res) => {
//   try {
//     const { uid } = req.params; // Worker UID from the frontend

//     // Step 1: Find the worker by their firebaseUid
//     const worker = await User.findOne({ firebaseUid: uid });
//     console.log(worker);
//     if (!worker || worker.role !== "WORKER") {
//       return res.status(404).json({ message: "Worker not found" });
//     }

//     // Step 2: Fetch all submissions for the worker
//     const submissions = await Submission.find({
//       workerInfo: worker._id,
//     })
//       .select("_id taskTitle buyerName status submittedAt taskInfo")
//       .populate({
//         path: "taskInfo",
//         select: "payableAmount", // Only fetch the payableAmount field from the Task model
//       });

    

//     // Step 4: Respond with the submissions
//     return res.status(200).json({
//       message: "Submissions retrieved successfully",
//       submissions,
//     });
//   } catch (error) {
//     console.error("Error fetching worker submissions:", error);
//     return res.status(500).json({
//       message:
//         "Server error. Unable to fetch submissions. Please try again later.",
//     });
//   }
// };
export const getWorkerSubmissions = async (req, res) => {
  try {
    const { uid } = req.params; // Worker UID
    const { page = 1, limit = 6 } = req.query; // Page and limit from query params

    // Step 1: Find the worker by their firebaseUid
    const worker = await User.findOne({ firebaseUid: uid });
    if (!worker || worker.role !== "WORKER") {
      return res.status(404).json({ message: "Worker not found" });
    }

    // Step 2: Fetch paginated submissions for the worker
    const totalSubmissions = await Submission.countDocuments({
      workerInfo: worker._id,
    });
    const submissions = await Submission.find({
      workerInfo: worker._id,
    })
      .select("_id taskTitle buyerName status submittedAt taskInfo")
      .populate({
        path: "taskInfo",
        select: "payableAmount",
      })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Step 3: Respond with the paginated submissions and total pages
    return res.status(200).json({
      message: "Submissions retrieved successfully",
      submissions,
      totalPages: Math.ceil(totalSubmissions / limit),
    });
  } catch (error) {
    console.error("Error fetching worker submissions:", error);
    return res.status(500).json({
      message:
        "Server error. Unable to fetch submissions. Please try again later.",
    });
  }
};



// Controller for handling withdrawal requests

export const handleWithdrawalRequest = async (req, res) => {
  try {
    const { uid, coins, amount, paymentSystem, accountNumber } = req.body;

    // Validate required fields
    if (!uid || !coins || !amount || !paymentSystem || !accountNumber) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Fetch the user using the Firebase UID
    const user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Ensure the user has sufficient coins for withdrawal
    if (user.coins < coins) {
      return res.status(400).json({ message: "Insufficient coins." });
    }

    // Validate payment system
    const validPaymentSystems = ["Stripe", "Bkash", "Nagad"];
    if (!validPaymentSystems.includes(paymentSystem)) {
      return res.status(400).json({ message: "Invalid payment system." });
    }


    // Create a new withdrawal record
    const withdrawal = new Withdrawal({
      worker: user._id,
      coins,
      amount,
      paymentSystem,
      accountNumber,
    });

    await withdrawal.save();

    // Respond with success
    return res.status(201).json({
      message: "Withdrawal request submitted successfully.",
      withdrawal,
    });
  } catch (error) {
    console.error("Error processing withdrawal request:", error);
    return res
      .status(500)
      .json({ message: "Internal server error. Please try again later." });
  }
};
