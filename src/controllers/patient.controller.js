import { UserModel } from "../models/user.model.js";
import { AppointmentModel } from "../models/appointment.model.js";
import { ReportModel } from "../models/report.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

function toPublicUser(user) {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

// Admin-only: browse/search the patient roster.
export const listPatients = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const patients = UserModel.listPatients({ search }).map((p) => ({
    ...toPublicUser(p),
    appointmentCount: UserModel.countAppointmentsFor(p.id),
  }));
  res.json({ success: true, patients });
});

export const getPatientDetail = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const patient = UserModel.findById(id);
  if (!patient || patient.role !== "patient") throw new ApiError(404, "Patient not found.");

  const appointments = AppointmentModel.list({ patientId: id });
  const reports = ReportModel.list({ patientId: id });

  res.json({ success: true, patient: { ...toPublicUser(patient), appointments, reports } });
});
