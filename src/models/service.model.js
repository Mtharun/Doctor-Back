import db from "../db/index.js";

function toService(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    durationMinutes: row.duration_minutes,
    price: row.price,
    active: !!row.active,
    createdAt: row.created_at,
  };
}

export const ServiceModel = {
  list({ onlyActive } = {}) {
    const sql = onlyActive
      ? `SELECT * FROM services WHERE active = 1 ORDER BY name ASC`
      : `SELECT * FROM services ORDER BY name ASC`;
    return db.prepare(sql).all().map(toService);
  },

  findById(id) {
    return toService(db.prepare(`SELECT * FROM services WHERE id = ?`).get(id));
  },

  create({ name, description, durationMinutes, price }) {
    const info = db
      .prepare(`INSERT INTO services (name, description, duration_minutes, price) VALUES (?, ?, ?, ?)`)
      .run(name, description ?? null, durationMinutes ? Number(durationMinutes) : 30, price === undefined || price === "" ? null : Number(price));
    return this.findById(Number(info.lastInsertRowid));
  },

  update(id, fields) {
    const columnMap = { name: "name", description: "description", durationMinutes: "duration_minutes", price: "price", active: "active" };
    const sets = [];
    const values = [];
    for (const [key, value] of Object.entries(fields)) {
      if (columnMap[key] && value !== undefined) {
        sets.push(`${columnMap[key]} = ?`);
        if (key === "active") values.push(value ? 1 : 0);
        else if (key === "price") values.push(value === "" ? null : Number(value));
        else if (key === "durationMinutes") values.push(Number(value));
        else values.push(value);
      }
    }
    if (sets.length === 0) return this.findById(id);
    values.push(id);
    db.prepare(`UPDATE services SET ${sets.join(", ")} WHERE id = ?`).run(...values);
    return this.findById(id);
  },
};
