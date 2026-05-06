import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import legalRoutes from "./routes/legalRoutes.js";
import harassmentRoutes from "./routes/harassmentRoutes.js";
import missingPersonRoutes from "./routes/missingPersonRoutes.js";
import missingPersonReportRoutes from "./routes/missingPersonReportRoutes.js";
import emergencyRoutes from "./routes/emergencyRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import aiAssistantRoutes from "./routes/aiAssistantRoutes.js";
import policeStationRoutes from "./routes/policeStationRoutes.js";
import safetyTimerRoutes from "./routes/safetyTimerRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({ message: "AI Legal & Emergency Support API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/legal", legalRoutes);
app.use("/api/harassment", harassmentRoutes);
app.use("/api/submit-crime-against-women", harassmentRoutes);
app.use("/api/missing", missingPersonRoutes);
app.use("/api/missing-person", missingPersonReportRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai-assistant", aiAssistantRoutes);
app.use("/api/police-stations", policeStationRoutes);
app.use("/api/safety-timer", safetyTimerRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;

