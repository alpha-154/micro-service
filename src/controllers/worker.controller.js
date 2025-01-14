import User from "../models/user.model.js";
import Submission from "../models/submission.model.js";


// Controller to get worker submission stats with approved submissions documents
export const getWorkerSubmissionStatsWithApprovedSubmissions = async (req, res) => {
    try {
        const { uid } = req.params;

        // Step 1: Find the user by firebaseUid
        const user = await User.findOne({ firebaseUid: uid });
        if (!user || user.role !== "Worker") {
            return res.status(404).json({ message: "Worker not found" });
        }

        // Step 2: Find all submissions for the worker and populate the taskInfo field
        const submissions = await Submission.find({ workerInfo: user._id })
            .populate({
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
        res.status(200).json({
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
        res.status(500).json({
            message: "Server error. Unable to retrieve worker submission stats. Please try again later.",
        });
    }
};


