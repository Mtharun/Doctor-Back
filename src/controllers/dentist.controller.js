import { DentistModel } from "../models/dentist.model.js";
import { AppointmentModel } from "../models/appointment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const listDentists = asyncHandler(async (req, res) => {
  const onlyActive = req.user?.role !== "admin";
  const dentists = DentistModel.list({ onlyActive });
  res.json({ success: true, dentists });
});

export const createDentist = asyncHandler(async (req, res) => {
  const { name, specialty, bio, photoUrl, workingDays, startTime, endTime, slotMinutes } = req.body;
  const dentist = DentistModel.create({ name, specialty, bio, photoUrl, workingDays, startTime, endTime, slotMinutes });
  res.status(201).json({ success: true, dentist });
});

export const updateDentist = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { name, specialty, bio, photoUrl, workingDays, startTime, endTime, slotMinutes, active } = req.body;
  const dentist = DentistModel.update(id, { name, specialty, bio, photoUrl, workingDays, startTime, endTime, slotMinutes, active });
  res.json({ success: true, dentist });
});

export const deleteDentist = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const dentist = DentistModel.update(id, { active: false });
  res.json({ success: true, dentist });
});

// Builds the list of bookable time slots for one dentist on one date,
// marking which ones are already taken. This is what BookAppointment
// calls so patients can only ever pick a genuinely free slot.
export const getAvailability = asyncHandler(async (req, res) => {
  const dentistId = Number(req.params.id);
  const { date } = req.query; // YYYY-MM-DD

  const dentist = DentistModel.findById(dentistId);
  if (!dentist) {
    throw new ApiError(404, "Dentist not found.");
  }

  const dayName = new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" });

  if (!dentist.workingDays.includes(dayName)) {
    return res.json({ success: true, slots: [] });
  }

  const [startH, startM] = dentist.startTime.split(":").map(Number);
  const [endH, endM] = dentist.endTime.split(":").map(Number);
  const slotMinutes = dentist.slotMinutes;

  const slots = [];
  let cursor = startH * 60 + startM;
  const end = endH * 60 + endM;
  while (cursor + slotMinutes <= end) {
    const h = String(Math.floor(cursor / 60)).padStart(2, "0");
    const m = String(cursor % 60).padStart(2, "0");
    slots.push(`${h}:${m}`);
    cursor += slotMinutes;
  }

  const bookedTimes = new Set(AppointmentModel.bookedTimesFor(dentistId, date));

  const now = new Date();
  const isToday = date === now.toISOString().slice(0, 10);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const result = slots.map((time) => {
    const [h, m] = time.split(":").map(Number);
    const inPast = isToday && h * 60 + m <= nowMinutes;
    return { time, available: !bookedTimes.has(time) && !inPast };
  });

  res.json({ success: true, slots: result });
});
