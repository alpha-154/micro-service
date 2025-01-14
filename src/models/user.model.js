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
    enum: ["Worker", "Buyer", "Admin"],
    required: true,
  },
  coins: {
    type: Number,
    required: true,
  },
});

const User = mongoose.model("User", userSchema);

export default User;
