import db from "../db/index.js";

function toDentist(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    bio: row.bio,
    photoUrl: row.photo_url,
    workingDays: JSON.parse(row.working_days),
    startTime: row.start_time,
    endTime: row.end_time,
    slotMinutes: row.slot_minutes,
    active: !!row.active,
    createdAt: row.created_at,
  };
}

export const DentistModel = {
  list({ onlyActive } = {}) {
    const sql = onlyActive
      ? `SELECT * FROM dentists WHERE active = 1 ORDER BY name ASC`
      : `SELECT * FROM dentists ORDER BY name ASC`;
    return db.prepare(sql).all().map(toDentist);
  },

  findById(id) {
    return toDentist(db.prepare(`SELECT * FROM dentists WHERE id = ?`).get(id));
  },

  create({ name, specialty, bio, photoUrl, workingDays, startTime, endTime, slotMinutes }) {
    const info = db
      .prepare(
        `INSERT INTO dentists (name, specialty, bio, photo_url, working_days, start_time, end_time, slot_minutes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        name,
        specialty,
        bio ?? null,
        photoUrl ?? null,
        JSON.stringify(workingDays || ["Mon", "Tue", "Wed", "Thu", "Fri"]),
        startTime || "09:00",
        endTime || "17:00",
        slotMinutes ? Number(slotMinutes) : 30
      );
    return this.findById(Number(info.lastInsertRowid));
  },

  update(id, fields) {
    const columnMap = {
      name: "name",
      specialty: "specialty",
      bio: "bio",
      photoUrl: "photo_url",
      startTime: "start_time",
      endTime: "end_time",
      slotMinutes: "slot_minutes",
      active: "active",
    };
    const sets = [];
    const values = [];
    for (const [key, value] of Object.entries(fields)) {
      if (key === "workingDays" && value !== undefined) {
        sets.push(`working_days = ?`);
        values.push(JSON.stringify(value));
        continue;
      }
      if (columnMap[key] && value !== undefined) {
        sets.push(`${columnMap[key]} = ?`);
        values.push(key === "active" ? (value ? 1 : 0) : value);
      }
    }
    if (sets.length === 0) return this.findById(id);
    values.push(id);
    db.prepare(`UPDATE dentists SET ${sets.join(", ")} WHERE id = ?`).run(...values);
    return this.findById(id);
  },
};
