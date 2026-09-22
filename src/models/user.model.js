// Data-access layer for the users table. Controllers never write SQL
// directly - they call these functions, which keeps SQL in one place and
// makes controllers easy to read.
import db from "../db/index.js";

function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    phone: row.phone,
    age: row.age,
    medicalHistory: row.medical_history,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const UserModel = {
  create({ name, email, passwordHash, role = "patient", phone = null, age = null, medicalHistory = null }) {
    const info = db
      .prepare(
        `INSERT INTO users (name, email, password_hash, role, phone, age, medical_history)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(name, email, passwordHash, role, phone, age, medicalHistory);
    return this.findById(Number(info.lastInsertRowid));
  },

  findById(id) {
    return toUser(db.prepare(`SELECT * FROM users WHERE id = ?`).get(id));
  },

  findByEmail(email) {
    return toUser(db.prepare(`SELECT * FROM users WHERE email = ?`).get(email));
  },

  update(id, fields) {
    const columnMap = {
      name: "name",
      phone: "phone",
      age: "age",
      medicalHistory: "medical_history",
      passwordHash: "password_hash",
    };
    const sets = [];
    const values = [];
    for (const [key, value] of Object.entries(fields)) {
      if (columnMap[key] && value !== undefined) {
        sets.push(`${columnMap[key]} = ?`);
        values.push(value);
      }
    }
    if (sets.length === 0) return this.findById(id);
    sets.push(`updated_at = datetime('now')`);
    values.push(id);
    db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...values);
    return this.findById(id);
  },

  listPatients({ search } = {}) {
    let sql = `SELECT * FROM users WHERE role = 'patient'`;
    const params = [];
    if (search) {
      sql += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    sql += ` ORDER BY name ASC`;
    return db.prepare(sql).all(...params).map(toUser);
  },

  countByRole(role) {
    return db.prepare(`SELECT COUNT(*) AS c FROM users WHERE role = ?`).get(role).c;
  },

  countAppointmentsFor(userId) {
    return db.prepare(`SELECT COUNT(*) AS c FROM appointments WHERE patient_id = ?`).get(userId).c;
  },
};
