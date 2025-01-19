import User from "../models/user.model.js";
import Task from "../models/task.model.js";

// Controller to get admin stats ( total no: of worker, buyers & total coins)
// Todo: add pagination & filtering options here, also use redis to cache
// frequently used data
export const getAdminStats = async (req, res) => {
  try {
    const { uid } = req.params; // Admin UID from the frontend

    if (!uid) {
      return res.status(400).json({ message: "UID is required" });
    }

    // Step 1: Check if UID is provided
    if (!uid) {
      return res.status(400).json({ message: "UID is required" });
    }

    // Step 2: Find the user by firebaseUid
    const adminUser = await User.findOne({ firebaseUid: uid });
    if (!adminUser) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    // Step 3: Check if the user has an admin role
    if (adminUser.role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "You are not authorized to view admin stats" });
    }

    // Step 4: Retrieve all users
    const allUsers = await User.find();

    // Step 5: Calculate the stats
    let totalWorkers = 0;
    let totalBuyers = 0;
    let totalAvailableCoins = 0;

    allUsers.forEach((user) => {
      if (user.role === "WORKER") {
        totalWorkers++;
      } else if (user.role === "BUYER") {
        totalBuyers++;
      }
      totalAvailableCoins += user.coins;
    });

    // Step 6: Respond with the stats
    return res.status(200).json({
      message: "Admin stats retrieved successfully",
      stats: {
        totalWorkers,
        totalBuyers,
        totalAvailableCoins,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return res.status(500).json({
      message:
        "Server error. Unable to fetch admin stats. Please try again later.",
    });
  }
};

// add withdrawal acceptance controller here

// Controler for fetching all Users list
export const getAllUsers = async (req, res) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({ message: "UID is required" });
    }

    // Step 1: Verify the admin
    const admin = await User.findOne({ firebaseUid: uid });
    if (!admin || admin.role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "You are not authorized to view users" });
    }

    // Step 2: Fetch all users except Admin
    const users = await User.find({ role: { $ne: "ADMIN" } });

    // Step 3: Respond with the user list
    return res.status(200).json({
      message: "Users retrieved successfully",
      users,
    });
  } catch (error) {
    console.error("Error fetching user list:", error);
    return res.status(500).json({
      message:
        "Server error. Unable to fetch user list. Please try again later.",
    });
  }
};

// Controller for removing an User (Worker or Buyer)
export const removeUser = async (req, res) => {
  try {
    const { adminUid, userUid } = req.params;

    if (!adminUid || !userUid) {
      return res
        .status(400)
        .json({ message: "Admin UID and User UID are required" });
    }

    // Step 1: Verify the admin
    const admin = await User.findOne({ firebaseUid: adminUid });
    if (!admin || admin.role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "You are not authorized to remove users" });
    }

    // Step 2: Find the user to be removed
    const user = await User.findOne({ firebaseUid: userUid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Step 3: Ensure the user is not an Admin
    if (user.role === "ADMIN") {
      return res.status(403).json({ message: "You cannot remove an Admin" });
    }

     // Step 4: Remove the user
     await User.deleteOne({ _id: user._id }); // Correctly removing the user

    // Step 5: Respond with success
    return res.status(200).json({
      message: `User '${user.username}' removed successfully`,
    });
  } catch (error) {
    console.error("Error removing user:", error);
    return res.status(500).json({
      message: "Server error. Unable to remove user. Please try again later.",
    });
  }
};

// Controller to update a user's role
export const updateUserRole = async (req, res) => {
  try {
    const { adminUid, userUid, newRole } = req.body;

    if (!adminUid || !userUid || !newRole) {
      return res
        .status(400)
        .json({ message: "Admin UID, User UID, and new role are required" });
    }

    // Step 1: Verify the admin
    const admin = await User.findOne({ firebaseUid: adminUid });
    if (!admin || admin.role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "You are not authorized to update user roles" });
    }

    // Step 2: Find the user to update
    const user = await User.findOne({ firebaseUid: userUid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Step 3: Ensure the user is not an Admin and has a valid role
    if (user.role === "ADMIN") {
      return res
        .status(403)
        .json({ message: "You cannot update the role of an Admin" });
    }

    if (!["WORKER", "BUYER"].includes(newRole)) {
      return res.status(400).json({ message: "Invalid role provided" });
    }

    // Step 4: Update the role
    user.role = newRole;
    await user.save();

    // Step 5: Respond with success
    return res.status(200).json({
      message: `User '${user.username}' role updated to '${newRole}' successfully`,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return res.status(500).json({
      message:
        "Server error. Unable to update user role. Please try again later.",
    });
  }
};

// Controller to fetch all the Tasks List for an Admin
export const getAllTasksForAdmin = async (req, res) => {
  try {
    const { uid } = req.params; // Admin UID from the frontend

    if (!uid) {
      return res.status(400).json({ message: "UID is required" });
    }

    // Step 1: Verify the admin
    const admin = await User.findOne({ firebaseUid: uid });
    if (!admin || admin.role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "You are not authorized to view tasks" });
    }

    // Step 2: Fetch all tasks
    const tasks = await Task.find().select(
      "title detail requiredWorkers payableAmount completionDate createdBy"
    ).populate(
      "createdBy",
      "username profileImage"
    );

    // Step 3: Check if tasks exist
    if (tasks.length === 0) {
      return res.status(404).json({ message: "No tasks found" });
    }

    // Step 4: Respond with the task list
    return res.status(200).json({
      message: "Tasks retrieved successfully",
      tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks for admin:", error);
    return res.status(500).json({
      message: "Server error. Unable to fetch tasks. Please try again later.",
    });
  }
};

// Controller to remove a task
export const removeTaskByAdmin = async (req, res) => {
  try {
    const { uid, taskId } = req.params; // Admin UID and Task ID from the frontend

    if (!uid || !taskId) {
      return res.status(400).json({ message: "UID and Task ID are required" });
    }

    // Step 1: Verify the admin
    const admin = await User.findOne({ firebaseUid: uid });
    if (!admin || admin.role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "You are not authorized to remove tasks" });
    }

    // Step 2: Delete the task document
    const task = await Task.findByIdAndDelete(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    

    // Step 4: Respond with success
    return res.status(200).json({
      message: `Task '${task.title}' removed successfully`,
    });
  } catch (error) {
    console.error("Error removing task by admin:", error);
    return res.status(500).json({
      message: "Server error. Unable to remove task. Please try again later.",
    });
  }
};
