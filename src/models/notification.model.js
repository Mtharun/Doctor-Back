import db from "../db/index.js";

function toNotification(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    message: row.message,
    read: !!row.read,
    createdAt: row.created_at,
  };
}

export const NotificationModel = {
  create(userId, message) {
    const info = db
      .prepare(`INSERT INTO notifications (user_id, message) VALUES (?, ?)`)
      .run(userId, message);
    return toNotification(db.prepare(`SELECT * FROM notifications WHERE id = ?`).get(Number(info.lastInsertRowid)));
  },

  listForUser(userId) {
    return db
      .prepare(`SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`)
      .all(userId)
      .map(toNotification);
  },

  unreadCount(userId) {
    return db.prepare(`SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read = 0`).get(userId).c;
  },

  markRead(id, userId) {
    const info = db
      .prepare(`UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?`)
      .run(id, userId);
    return info.changes;
  },

  markAllRead(userId) {
    db.prepare(`UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0`).run(userId);
  },
};
