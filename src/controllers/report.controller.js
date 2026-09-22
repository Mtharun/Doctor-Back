import { ReportModel } from "../models/report.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { createNotification } from "./notification.controller.js";

export const listReports = asyncHandler(async (req, res) => {
  const { patientId } = req.query;
  const reports = ReportModel.list({
    patientId: req.user.role === "patient" ? req.user.id : patientId ? Number(patientId) : undefined,
  });
  res.json({ success: true, reports });
});

export const uploadReport = asyncHandler(async (req, res) => {
  const { patientId, title, type, doctor, notes } = req.body;

  if (!req.file) throw new ApiError(400, "A report file is required.");

  const report = ReportModel.create({
    patientId: Number(patientId),
    title,
    type: type || "Report",
    doctor: doctor || null,
    notes: notes || null,
    fileUrl: `/uploads/reports/${req.file.filename}`,
  });

  createNotification(report.patientId, `A new report "${report.title}" was added to your records.`);

  res.status(201).json({ success: true, report });
});

export const deleteReport = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  ReportModel.delete(id);
  res.json({ success: true });
});
