import { AppointmentModel } from "../models/appointment.model.js";
import { DentistModel } from "../models/dentist.model.js";
import { ServiceModel } from "../models/service.model.js";
import { UserModel } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { createNotification } from "./notification.controller.js";

// Patients see only their own appointments; admins see everyone's,
// optionally filtered by status/date/search text from the querystring.
export const listAppointments = asyncHandler(async (req, res) => {
  const { status, date, search } = req.query;
  const appointments = AppointmentModel.list({
    patientId: req.user.role === "patient" ? req.user.id : undefined,
    status: status && status !== "all" ? status : undefined,
    date: date || undefined,
    search: req.user.role === "admin" ? search : undefined,
  });
  res.json({ success: true, appointments });
});

export const getAppointment = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const appointment = AppointmentModel.findById(id);
  if (!appointment) throw new ApiError(404, "Appointment not found.");
  if (req.user.role === "patient" && appointment.patientId !== req.user.id) {
    throw new ApiError(403, "You cannot view another patient's appointment.");
  }
  res.json({ success: true, appointment });
});

function assertNotPast(date, time) {
  const when = new Date(`${date}T${time}:00`);
  if (Number.isNaN(when.getTime()) || when.getTime() < Date.now()) {
    throw new ApiError(400, "You cannot book an appointment in the past.");
  }
}

export const createAppointment = asyncHandler(async (req, res) => {
  const { dentistId, serviceId, date, time, reason } = req.body;

  assertNotPast(date, time);

  const dentist = DentistModel.findById(Number(dentistId));
  if (!dentist || !dentist.active) throw new ApiError(400, "Selected dentist is not available.");

  const service = ServiceModel.findById(Number(serviceId));
  if (!service || !service.active) throw new ApiError(400, "Selected service is not available.");

  // Double-booking guard: check first for a friendly error message, and the
  // database's own UNIQUE(dentist_id, date, time) constraint is the hard
  // backstop in case two requests race each other at the exact same time.
  const clash = AppointmentModel.findConflict({ dentistId: Number(dentistId), date, time });
  if (clash) {
    throw new ApiError(409, "That time slot was just booked. Please choose another.");
  }

  let appointment;
  try {
    appointment = AppointmentModel.create({
      patientId: req.user.id,
      dentistId: Number(dentistId),
      serviceId: Number(serviceId),
      date,
      time,
      reason: reason || null,
    });
  } catch (err) {
    if (err.message?.includes("UNIQUE constraint failed")) {
      throw new ApiError(409, "That time slot was just booked. Please choose another.");
    }
    throw err;
  }

  createNotification(
    req.user.id,
    `Your ${service.name} appointment request for ${date} at ${time} was submitted and is pending confirmation.`
  );

  res.status(201).json({ success: true, appointment });
});

const PATIENT_ALLOWED_TRANSITIONS = {
  pending: ["cancelled"],
  confirmed: ["cancelled"],
};

const ADMIN_ALLOWED_TRANSITIONS = {
  pending: ["confirmed", "rejected", "cancelled"],
  confirmed: ["completed", "cancelled"],
};

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  const appointment = AppointmentModel.findById(id);
  if (!appointment) throw new ApiError(404, "Appointment not found.");

  if (req.user.role === "patient") {
    if (appointment.patientId !== req.user.id) {
      throw new ApiError(403, "You cannot modify another patient's appointment.");
    }
    const allowed = PATIENT_ALLOWED_TRANSITIONS[appointment.status] || [];
    if (!allowed.includes(status)) {
      throw new ApiError(400, `You cannot change a ${appointment.status} appointment to ${status}.`);
    }
  } else {
    const allowed = ADMIN_ALLOWED_TRANSITIONS[appointment.status] || [];
    if (!allowed.includes(status)) {
      throw new ApiError(400, `Cannot change a ${appointment.status} appointment to ${status}.`);
    }
  }

  const updated = AppointmentModel.updateStatus(id, status);
  createNotification(updated.patientId, `Your appointment on ${updated.date} at ${updated.time} was ${status}.`);

  res.json({ success: true, appointment: updated });
});

// Reschedule = change date/time on a pending/confirmed appointment,
// re-running the same past-date and double-booking checks.
export const rescheduleAppointment = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { date, time } = req.body;

  const appointment = AppointmentModel.findById(id);
  if (!appointment) throw new ApiError(404, "Appointment not found.");
  if (req.user.role === "patient" && appointment.patientId !== req.user.id) {
    throw new ApiError(403, "You cannot modify another patient's appointment.");
  }
  if (!["pending", "confirmed"].includes(appointment.status)) {
    throw new ApiError(400, `A ${appointment.status} appointment cannot be rescheduled.`);
  }

  assertNotPast(date, time);

  const clash = AppointmentModel.findConflict({ dentistId: appointment.dentistId, date, time, excludeId: id });
  if (clash) {
    throw new ApiError(409, "That time slot is already booked. Please choose another.");
  }

  let updated;
  try {
    updated = AppointmentModel.reschedule(id, { date, time });
  } catch (err) {
    if (err.message?.includes("UNIQUE constraint failed")) {
      throw new ApiError(409, "That time slot is already booked. Please choose another.");
    }
    throw err;
  }

  createNotification(updated.patientId, `Your appointment was rescheduled to ${date} at ${time} and is pending confirmation again.`);

  res.json({ success: true, appointment: updated });
});

export const getAppointmentStats = asyncHandler(async (req, res) => {
  const stats = AppointmentModel.stats();
  const totalPatients = UserModel.countByRole("patient");
  res.json({ success: true, stats: { ...stats, totalPatients } });
});
