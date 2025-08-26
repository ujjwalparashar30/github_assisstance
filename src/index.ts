import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import questionRoutes from "./routes/profile.route";

dotenv.config();

const app = express();

// Core middleware
app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:3000", "https://yourdomain.com"],
    credentials: true,
  })
);

// 🔹 Notice: we don’t add express.json() here anymore

app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/", (_req, res) => {
  res.send("Hello, World!");
});

app.use("/api", questionRoutes);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
