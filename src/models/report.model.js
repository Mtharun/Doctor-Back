import db from "../db/index.js";

const BASE_SELECT = `
  SELECT r.*, p.name AS patient_name, p.email AS patient_email
  FROM reports r
  JOIN users p ON p.id = r.patient_id
`;

function toReport(row) {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_id,
    title: row.title,
    type: row.type,
    doctor: row.doctor,
    notes: row.notes,
    fileUrl: row.file_url,
    date: row.date,
    createdAt: row.created_at,
    patient: { id: row.patient_id, name: row.patient_name, email: row.patient_email },
  };
}

export const ReportModel = {
  findById(id) {
    return toReport(db.prepare(`${BASE_SELECT} WHERE r.id = ?`).get(id));
  },

  list({ patientId } = {}) {
    let sql = BASE_SELECT;
    const params = [];
    if (patientId) {
      sql += ` WHERE r.patient_id = ?`;
      params.push(patientId);
    }
    sql += ` ORDER BY r.date DESC`;
    return db.prepare(sql).all(...params).map(toReport);
  },

  create({ patientId, title, type, doctor, notes, fileUrl }) {
    const info = db
      .prepare(
        `INSERT INTO reports (patient_id, title, type, doctor, notes, file_url) VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(patientId, title, type || "Report", doctor ?? null, notes ?? null, fileUrl ?? null);
    return this.findById(Number(info.lastInsertRowid));
  },

  delete(id) {
    db.prepare(`DELETE FROM reports WHERE id = ?`).run(id);
  },
};
