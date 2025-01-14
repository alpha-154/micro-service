import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
// Controller to register a new user
export const registerUser = async (req, res) => {
  //console.log("registerUser function called");
  try {
    // Destructure required fields from the request body
    const { firebaseUid, username, email, profileImage, role } = req.body;
    //console.log( "registerUser -> req.body", firebaseUid, name, email, profileImage);

    // Validate the request body
    if (!firebaseUid || !username || !email || !profileImage || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if a user with the same Firebase UID or email already exists
    const existingUser = await User.findOne({
      $or: [{ firebaseUid }, { email }],
    });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this UID or email already exists." });
    }

    if (role === "worker") coins = 10;
    else coins = 50;

    // Create a new user in the database
    const newUser = await User.create({
      firebaseUid,
      username,
      email,
      profileImage,
      role,
      coins,
    });

    // Return a success response
    res.status(201).json({
      message: "User registered successfully.",
      user: {
        firebaseUid: newUser.firebaseUid,
        username: newUser.username,
        email: newUser.email,
        profileImage: newUser.profileImage,
        role: newUser.role,
        coins: newUser.coins,
      },
    });
  } catch (error) {
    console.error("Error in registerUser:", error);

    // Handle specific error types
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Invalid data provided.", details: error.message });
    }

    // Handle all other errors
    res.status(500).json({ message: "Internal server error." });
  }
};

// Controller to generate a JWT token for a user
export const generateToken = async (req, res) => {
  try {
    const { uid, email, displayName, photoURL, role } = req.body;

    // Ensure all required fields are present
    if (!uid || !email) {
      return res
        .status(400)
        .json({ message: "Missing required user information." });
    }

    // Payload for the JWT
    const payload = {
      uid,
      email,
      displayName,
      photoURL,
      role,
    };

    // Generate a token with a secret key and expiration
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "5h", // Token validity
    });

    return res.status(200).json({ token });
  } catch (error) {
    console.error("Error generating token:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Controller to register a new user with Google
export const registerUserWithGoogle = async (req, res) => {
  console.log("registerUserWithGoogle function called");
  try {
    const { firebaseUid, username, email, profileImage } = req.body;
    console.log(
      "registerUserWithGoogle function called",
      firebaseUid,
      username,
      email,
      profileImage
    );

    // Check if the user already exists in the database
    const existingUser = await User.findOne({ firebaseUid });

    if (existingUser) {
      // User already exists, return 200 status
      return res.status(200).json({ message: "User already exists." });
    }

    // Create a new user in the database
    const newUser = new User({
      firebaseUid,
      username,
      email,
      profileImage,
      role: "Worker",
      coins: 10,
    });

    await newUser.save();

    // Return 201 status for a successfully created user
    return res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Error in registerUser:", error);
    // Handle potential errors
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
