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
    let coins;
    if (role === "WORKER") coins = 10;
    else if (role === "BUYER") coins = 50;
    else coins = 0;

    // Create a new user in the database
    const newUser = new User({
      firebaseUid,
      username,
      email,
      profileImage,
      role,
    });

    if (coins > 0) {
      newUser.coins = coins;
    }

    // Save the new user to the database
    await newUser.save();

    // Return a success response
    res.status(201).json({
      message: "User registered successfully.",
      user: {
        firebaseUid: newUser.firebaseUid,
        username: newUser.username,
        email: newUser.email,
        profileImage: newUser.profileImage,
        role: newUser.role,
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
    const { firebaseUid, username, email, profileImage } = req.body;

    // Ensure all required fields are present
    if (!firebaseUid || !email) {
      return res
        .status(400)
        .json({ message: "Missing required user information." });
    }

    // accessing the User document from the db
    const existingUser = await User.findOne({ firebaseUid });
    if (!existingUser)
      return res.status(403).json({ message: "User doesn't exits!" });

    // Payload for the JWT
    const payload = {
      firebaseUid: existingUser.firebaseUid,
      username: existingUser.username,
      email: existingUser.email,
      profileImage: existingUser.profileImage,
      role: existingUser.role,
    };

    // Generate a token with a secret key and expiration
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "5h", // Token validity
    });

    return res.status(200).json({
      token,
      user: {
        firebaseUid: existingUser.firebaseUid,
        username: existingUser.username,
        email: existingUser.email,
        profileImage: existingUser.profileImage,
        role: existingUser.role,
        coin: existingUser.coins,
      },
    });
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

    if(!firebaseUid || !username || !email || !profileImage){
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if the user already exists in the database
    const existingUser = await User.findOne({ firebaseUid });

    if (existingUser) {
      // User already exists, return 200 status
      // Payload for the JWT
    const payload = {
      firebaseUid: existingUser.firebaseUid,
      username: existingUser.username,
      email: existingUser.email,
      profileImage: existingUser.profileImage,
      role: existingUser.role,
    };

    // Generate a token with a secret key and expiration
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "5h", // Token validity
    });
      return res.status(200).json({ message: "User already exists.", token, loggedInUserData: existingUser });
    }

    // Create a new user in the database
    const newUser = new User({
      firebaseUid,
      username,
      email,
      profileImage,
      role: "WORKER",
      coins: 10,
    });

    await newUser.save();

    const payload = {
      firebaseUid: newUser.firebaseUid,
      username: newUser.username,
      email: newUser.email,
      profileImage: newUser.profileImage,
      role: newUser.role,
    };

    // Generate a token with a secret key and expiration
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "5h", // Token validity
    });

    // Return 201 status for a successfully created user
    return res.status(201).json({ 
      message: "User registered successfully!",
      loggedInUserData: {
        firebaseUid: newUser.firebaseUid,
        username: newUser.username,
        email: newUser.email,
        profileImage: newUser.profileImage,
        role: newUser.role,
      },
      token
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    // Handle potential errors
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


// Controller to access user profile
export const fetchUserProfile = async (req, res) => {
  try {
    const { uid } = req.params;
    if(!uid){
      return res.status(404).json({ message : "UID isn't provided!"})
    }

    // Find the user by firebaseUid
    const user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User profile accessed successfully.",
      user: {
        _id: user._id,
        firebaseUid: user.firebaseUid,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
        coins: user.coins,
      },
    });
  } catch (error) {
    console.error("Error accessing user profile:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};