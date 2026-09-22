import { EmergencyModel } from "../models/emergency.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { createNotification } from "./notification.controller.js";

export const listEmergencyRequests = asyncHandler(async (req, res) => {
  const { status, priority } = req.query;
  const requests = EmergencyModel.list({
    patientId: req.user.role === "patient" ? req.user.id : undefined,
    status: status && status !== "all" ? status : undefined,
    priority: priority && priority !== "all" ? priority : undefined,
  });
  res.json({ success: true, requests });
});

export const createEmergencyRequest = asyncHandler(async (req, res) => {
  const { name, phone, location, description, priority } = req.body;

  const request = EmergencyModel.create({
    patientId: req.user.id,
    name,
    phone,
    location,
    description,
    priority: priority || "high",
    imageUrl: req.file ? `/uploads/emergency/${req.file.filename}` : null,
  });

  res.status(201).json({ success: true, request });
});

const VALID_STATUSES = ["pending", "accepted", "in_progress", "resolved", "cancelled"];

export const updateEmergencyStatus = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    throw new ApiError(400, "Invalid status.");
  }

  const existing = EmergencyModel.findById(id);
  if (!existing) throw new ApiError(404, "Emergency request not found.");

  if (req.user.role === "patient") {
    if (existing.patientId !== req.user.id) {
      throw new ApiError(403, "You cannot modify another patient's request.");
    }
    if (status !== "cancelled") {
      throw new ApiError(403, "Patients can only cancel their own request.");
    }
  }

  const request = EmergencyModel.updateStatus(id, status);
  createNotification(request.patientId, `Your emergency request status was updated to "${status.replace("_", " ")}".`);

  res.json({ success: true, request });
});
