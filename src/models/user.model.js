import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  profileImage: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["WORKER", "BUYER", "ADMIN"],
    required: true,
  },
  coins: {
    type: Number,
  },
});

const User = mongoose.model("User", userSchema);

export default User;
