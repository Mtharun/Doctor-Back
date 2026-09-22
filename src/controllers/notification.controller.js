import { NotificationModel } from "../models/notification.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Helper used internally by other controllers (appointments, emergency,
// reports) whenever something happens that the patient should be told about.
export function createNotification(userId, message) {
  return NotificationModel.create(userId, message);
}

export const listNotifications = asyncHandler(async (req, res) => {
  const notifications = NotificationModel.listForUser(req.user.id);
  const unreadCount = NotificationModel.unreadCount(req.user.id);
  res.json({ success: true, notifications, unreadCount });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const updated = NotificationModel.markRead(id, req.user.id);
  res.json({ success: true, updated });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  NotificationModel.markAllRead(req.user.id);
  res.json({ success: true });
});
