import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import buyerRouter from "./routes/buyer.routes.js";
import workerRouter from "./routes/worker.routes.js";
const app = express();

// Define allowed origins for development and production
const allowedOrigins = [
  process.env.CORS_ORIGIN_DEVELOPMENT, // Development origin
  process.env.CORS_ORIGIN_PRODUCTION, // Production origin
];

if (!allowedOrigins.every((origin) => origin)) {
  throw new Error(
    "One or more CORS_ORIGIN values are undefined in the environment variables"
  );
}

console.log("Environment:", process.env.NODE_ENV);
console.log("Allowed CORS Origins:", allowedOrigins);

// * Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(
          new Error(`CORS policy does not allow access from origin: ${origin}`)
        );
      }
    },
    credentials: true, // Allow cookies and authorization headers
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

// Routes configuration
app.use("/api/user", userRouter);
app.use("api/buyer", buyerRouter);
app.use("/api/worker", workerRouter);


// Start the server
connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO DB connection failed !!! ", err);
  });