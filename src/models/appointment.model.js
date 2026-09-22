import db from "../db/index.js";

// Selects an appointment joined with the bits of dentist/service/patient
// info the frontend needs to display, without exposing the patient's
// password hash or other sensitive columns.
const BASE_SELECT = `
  SELECT
    a.id, a.patient_id, a.dentist_id, a.service_id, a.date, a.time, a.reason,
    a.status, a.created_at, a.updated_at,
    d.name AS dentist_name, d.specialty AS dentist_specialty,
    s.name AS service_name, s.duration_minutes AS service_duration,
    p.name AS patient_name, p.phone AS patient_phone, p.email AS patient_email
  FROM appointments a
  JOIN dentists d ON d.id = a.dentist_id
  JOIN services s ON s.id = a.service_id
  JOIN users p ON p.id = a.patient_id
`;

function toAppointment(row) {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_id,
    dentistId: row.dentist_id,
    serviceId: row.service_id,
    date: row.date,
    time: row.time,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    dentist: { id: row.dentist_id, name: row.dentist_name, specialty: row.dentist_specialty },
    service: { id: row.service_id, name: row.service_name, durationMinutes: row.service_duration },
    patient: { id: row.patient_id, name: row.patient_name, phone: row.patient_phone, email: row.patient_email },
  };
}

export const AppointmentModel = {
  findById(id) {
    return toAppointment(db.prepare(`${BASE_SELECT} WHERE a.id = ?`).get(id));
  },

  list({ patientId, status, date, search } = {}) {
    let sql = BASE_SELECT + " WHERE 1 = 1";
    const params = [];
    if (patientId) {
      sql += ` AND a.patient_id = ?`;
      params.push(patientId);
    }
    if (status) {
      sql += ` AND a.status = ?`;
      params.push(status);
    }
    if (date) {
      sql += ` AND a.date = ?`;
      params.push(date);
    }
    if (search) {
      sql += ` AND (p.name LIKE ? OR p.email LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s);
    }
    sql += ` ORDER BY a.date DESC, a.time DESC`;
    return db.prepare(sql).all(...params).map(toAppointment);
  },

  findConflict({ dentistId, date, time, excludeId }) {
    let sql = `SELECT id FROM appointments WHERE dentist_id = ? AND date = ? AND time = ? AND status IN ('pending','confirmed')`;
    const params = [dentistId, date, time];
    if (excludeId) {
      sql += ` AND id != ?`;
      params.push(excludeId);
    }
    return db.prepare(sql).get(...params);
  },

  create({ patientId, dentistId, serviceId, date, time, reason }) {
    const info = db
      .prepare(
        `INSERT INTO appointments (patient_id, dentist_id, service_id, date, time, reason, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`
      )
      .run(patientId, dentistId, serviceId, date, time, reason ?? null);
    return this.findById(Number(info.lastInsertRowid));
  },

  updateStatus(id, status) {
    db.prepare(`UPDATE appointments SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, id);
    return this.findById(id);
  },

  reschedule(id, { date, time }) {
    db.prepare(
      `UPDATE appointments SET date = ?, time = ?, status = 'pending', updated_at = datetime('now') WHERE id = ?`
    ).run(date, time, id);
    return this.findById(id);
  },

  bookedTimesFor(dentistId, date) {
    return db
      .prepare(
        `SELECT time FROM appointments WHERE dentist_id = ? AND date = ? AND status IN ('pending','confirmed')`
      )
      .all(dentistId, date)
      .map((r) => r.time);
  },

  stats() {
    const today = new Date().toISOString().slice(0, 10);
    const countWhere = (where, params = []) => db.prepare(`SELECT COUNT(*) AS c FROM appointments WHERE ${where}`).get(...params).c;
    return {
      todayCount: countWhere("date = ?", [today]),
      pending: countWhere("status = 'pending'"),
      confirmed: countWhere("status = 'confirmed'"),
      completed: countWhere("status = 'completed'"),
      cancelled: countWhere("status = 'cancelled'"),
    };
  },
};
