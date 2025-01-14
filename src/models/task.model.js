import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    detail: {
      type: String,
      required: true,
    },
    requiredWorkers: {
      type: Number,
      required: true,
    },
    payableAmount: {
      type: Number,
      required: true,
    },
    completionDate: {
      type: Date,
      required: true,
    },
    submissionInfo: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    }, // Use imgBB or similar services for uploads
    totalPayableAmount: {
      type: Number,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Submission",
      },
    ], // List of submissions
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
