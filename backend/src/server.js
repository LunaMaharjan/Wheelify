import express from "express";
import env from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

env.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const getFrontendOrigin = () => {
  const origin = process.env.FRONTEND_URL || "http://localhost:3000";
  return origin;
};

app.use(
  cors({
      origin: getFrontendOrigin(),
      credentials: true,
  })
);

mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log("Connected to MongoDB");
}).catch((error) => {
  console.error("Error connecting to MongoDB:", error);
});

// Routes
app.use("/api", authRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (_, response) =>
  response.json({ info: "Express app" })
);

app.listen(process.env.PORT, () =>
  console.log(
    new Date().toLocaleTimeString() +
      `: Server is running on port ${process.env.PORT}...`
  )
);
