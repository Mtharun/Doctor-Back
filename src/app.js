import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "node:path";

import authRoutes from "./routes/auth.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import dentistRoutes from "./routes/dentist.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import emergencyRoutes from "./routes/emergency.routes.js";
import reportRoutes from "./routes/report.routes.js";
import patientRoutes from "./routes/patient.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

// Only these origins may call the API with credentials/headers from a browser.
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools (curl, Postman) which send no Origin header.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// Serve uploaded report/emergency files statically so the frontend can
// display/download them directly from the URLs stored in the database.
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", (req, res) => res.json({ success: true, status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/dentists", dentistRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
