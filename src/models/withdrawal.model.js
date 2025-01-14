import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coins: {
      type: Number,
      required: true,
    }, // Coins to be withdrawn
    amount: {
      type: Number,
      required: true,
    }, // Amount in dollars (20 coins = $1)
    paymentSystem: {
      type: String,
      enum: ["Stripe", "Bkash", "Nagad", "Other"],
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved"],
      default: "pending",
    },
    withdrawDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema);

export default Withdrawal;
