import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { ApiError } from "./utils/ApiError.js"

const app = express()
let allowUrls = "*"

app.use(
  cors({
    origin: ["https://issue-tracker-system.vercel.app",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT"],
    credentials: true,
    // allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'device-remember-token', 'Access-Control-Allow-Origin', 'Origin', 'Accept']
  })
);

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import
import userRouter from './routes/user.routes.js'

//routes declaration
app.use("/api/v1", userRouter)

// Global error handler
app.use((err, req, res, next) => {
  // If it's already an ApiError instance, use it directly
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(err.toJSON());
  }
  
  // Convert other errors to ApiError
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong";
  const apiError = new ApiError(statusCode, message, err.errors || []);
  
  // Return a formatted error response
  return res.status(statusCode).json(apiError.toJSON());
});

// 404 handler for undefined routes
app.use("*", (req, res) => {
  return res.status(404).json(
    new ApiError(404, "Route not found").toJSON()
  );
});

export { app }