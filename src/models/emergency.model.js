import db from "../db/index.js";

const BASE_SELECT = `
  SELECT e.*, p.name AS patient_name, p.email AS patient_email
  FROM emergency_requests e
  JOIN users p ON p.id = e.patient_id
`;

function toRequest(row) {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_id,
    name: row.name,
    phone: row.phone,
    location: row.location,
    description: row.description,
    priority: row.priority,
    status: row.status,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    patient: { id: row.patient_id, name: row.patient_name, email: row.patient_email },
  };
}

export const EmergencyModel = {
  findById(id) {
    return toRequest(db.prepare(`${BASE_SELECT} WHERE e.id = ?`).get(id));
  },

  list({ patientId, status, priority } = {}) {
    let sql = BASE_SELECT + " WHERE 1 = 1";
    const params = [];
    if (patientId) {
      sql += ` AND e.patient_id = ?`;
      params.push(patientId);
    }
    if (status) {
      sql += ` AND e.status = ?`;
      params.push(status);
    }
    if (priority) {
      sql += ` AND e.priority = ?`;
      params.push(priority);
    }
    sql += ` ORDER BY e.created_at DESC`;
    return db.prepare(sql).all(...params).map(toRequest);
  },

  create({ patientId, name, phone, location, description, priority, imageUrl }) {
    const info = db
      .prepare(
        `INSERT INTO emergency_requests (patient_id, name, phone, location, description, priority, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(patientId, name, phone, location, description, priority || "high", imageUrl ?? null);
    return this.findById(Number(info.lastInsertRowid));
  },

  updateStatus(id, status) {
    db.prepare(`UPDATE emergency_requests SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, id);
    return this.findById(id);
  },
};
