import { ServiceModel } from "../models/service.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listServices = asyncHandler(async (req, res) => {
  const onlyActive = req.user?.role !== "admin";
  const services = ServiceModel.list({ onlyActive });
  res.json({ success: true, services });
});

export const createService = asyncHandler(async (req, res) => {
  const { name, description, durationMinutes, price } = req.body;
  const service = ServiceModel.create({ name, description, durationMinutes, price });
  res.status(201).json({ success: true, service });
});

export const updateService = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { name, description, durationMinutes, price, active } = req.body;
  const service = ServiceModel.update(id, { name, description, durationMinutes, price, active });
  res.json({ success: true, service });
});

export const deleteService = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  // Soft delete: keep history/appointments intact, just hide from booking.
  const service = ServiceModel.update(id, { active: false });
  res.json({ success: true, service });
});
