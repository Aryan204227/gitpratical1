// src/lib/db.js
// Fresh MongoDB connection (clubpulse_v2) and data layer
import mongoose from "mongoose";
import User from "../models/User.js";
import Club from "../models/Club.js";
import Membership from "../models/Membership.js";
import Task from "../models/Task.js";
import Event from "../models/Event.js";
import Evidence from "../models/Evidence.js";
import Application from "../models/Application.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import Contribution from "../models/Contribution.js";
import Feedback from "../models/Feedback.js";
import Availability from "../models/Availability.js";

// Connection caching for Next.js (prevents multiple connections in dev mode)
let cached = global._mongooseConnection;
if (!cached) {
  global._mongooseConnection = { conn: null, promise: null };
  cached = global._mongooseConnection;
}

/**
 * Connect to MongoDB using the MONGODB_URI environment variable.
 * The database name should be `clubpulse_v2`. Ensure the URI includes the DB name.
 */
export async function connectMongoose() {
  if (cached.conn) return cached.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set. Please configure it in .env.local");
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then((m) => {
      console.log("✅ Connected to MongoDB (clubpulse_v2).");
      return m;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

/**
 * Data‑access helpers – all functions return plain JS objects (lean) to keep the
 * existing API contract unchanged for the rest of the codebase.
 */
export const db = {
  // -------------------- Users --------------------
  getUsers: async () => await User.find().lean(),
  getUserById: async (id) => await User.findById(id).lean(),
  getUserByEmail: async (email) => {
    if (!email) return null;
    return await User.findOne({ email: email.trim().toLowerCase() }).lean();
  },
  getUserByFirebaseUid: async (firebaseUid) => {
    if (!firebaseUid) return null;
    return await User.findOne({ firebaseUid: String(firebaseUid) }).lean();
  },
  createUser: async (data) => {
    const user = new User({
      name: data.name || "Student",
      email: data.email.trim().toLowerCase(),
      authProvider: data.authProvider || "firebase",
      firebaseUid: data.firebaseUid,
      role: data.role || "student",
      avatar: data.avatar,
      department: data.department,
      year: data.year,
      bio: data.bio,
      createdAt: new Date(),
    });
    await user.save();
    return user.toObject();
  },
  updateUser: async (id, updates) => {
    const updated = await User.findByIdAndUpdate(id, updates, { new: true }).lean();
    return updated;
  },

  // -------------------- Clubs --------------------
  getClubs: async () => await Club.find().lean(),
  getClubById: async (id) => {
    if (!id) return null;
    if (mongoose.isValidObjectId(id)) return await Club.findById(id).lean();
    return await Club.findOne({ slug: String(id) }).lean();
  },
  createClub: async (data) => {
    const slug = (data.name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const club = new Club({ ...data, slug, memberCount: 0, trustScore: 0, transparencyTier: "Under Review", createdAt: new Date() });
    await club.save();
    return club.toObject();
  },
  updateClub: async (id, updates) => {
    const updated = await Club.findByIdAndUpdate(id, updates, { new: true }).lean();
    return updated;
  },

  // -------------------- Memberships --------------------
  getMemberships: async (clubId) => {
    if (clubId) return await Membership.find({ clubId }).lean();
    return await Membership.find().lean();
  },
  getUserMemberships: async (userId) => await Membership.find({ userId }).lean(),
  createMembership: async (data) => {
    const membership = new Membership({
      ...data,
      status: "active",
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    });
    await membership.save();
    return membership.toObject();
  },
  updateMembership: async (id, updates) => {
    const updated = await Membership.findByIdAndUpdate(id, updates, { new: true }).lean();
    return updated;
  },
  requestLeaveOfAbsence: async (userId, clubId, reason, endDate) => {
    return await Membership.findOneAndUpdate(
      { userId, clubId },
      {
        leaveDetails: {
          onLeave: true,
          reason,
          endDate,
          requestedAt: new Date().toISOString(),
        },
      },
      { new: true }
    ).lean();
  },

  // -------------------- Tasks --------------------
  getTasks: async (clubId) => {
    if (clubId) return await Task.find({ clubId }).lean();
    return await Task.find().lean();
  },
  getUserTasks: async (userId) => await Task.find({ assigneeId: userId }).lean(),
  getTaskById: async (id) => await Task.findById(id).lean(),
  createTask: async (data) => {
    const task = new Task({ ...data, createdAt: new Date() });
    await task.save();
    // Notify assignee
    await Notification.create({
      userId: data.assigneeId,
      title: `New Task Assigned: ${data.title}`,
      message: `${data.assignedByName} assigned you a task in ${data.clubName}.`,
      type: "task_assigned",
      read: false,
      createdAt: new Date(),
    });
    return task.toObject();
  },
  updateTask: async (id, updates) => {
    const task = await Task.findById(id);
    if (!task) return null;
    const prevStatus = task.status;
    Object.assign(task, updates);
    if (prevStatus !== "completed" && updates.status === "completed") {
      task.completedAt = new Date();
      // Update member stats atomically
      await Membership.findOneAndUpdate(
        { userId: task.assigneeId, clubId: task.clubId },
        { $inc: { tasksPending: -1, tasksCompleted: 1, contributionScore: 8 }, $set: { lastActiveAt: new Date() } }
      );
    }
    await task.save();
    return task.toObject();
  },
  delegateTask: async (id, newAssigneeId, newAssigneeName, delegatedByName) => {
    return await db.updateTask(id, {
      assigneeId: newAssigneeId,
      assigneeName: newAssigneeName,
      delegatedByName: delegatedByName || "Club Coordinator",
    });
  },

  // -------------------- Applications --------------------
  getApplications: async (clubId) => {
    if (clubId) return await Application.find({ clubId }).lean();
    return await Application.find().lean();
  },
  getUserApplications: async (userId) => await Application.find({ userId }).lean(),
  createApplication: async (data) => {
    const app = new Application({ ...data, status: "pending", appliedAt: new Date() });
    await app.save();
    // Notify club president
    const club = await Club.findById(data.clubId);
    if (club) {
      await Notification.create({
        userId: club.presidentId,
        title: `New Club Application: ${data.applicantName}`,
        message: `${data.applicantName} applied to join ${club.name}.`,
        type: "application_update",
        read: false,
        createdAt: new Date(),
      });
    }
    return app.toObject();
  },
  updateApplicationStatus: async (id, status, reviewerNotes, reviewerId, reviewerName) => {
    const app = await Application.findById(id);
    if (!app) return null;
    app.status = status;
    app.reviewerNotes = reviewerNotes;
    app.reviewerId = reviewerId;
    app.reviewedAt = new Date();
    await app.save();
    if (status === "accepted") {
      const exists = await Membership.findOne({ userId: app.userId, clubId: app.clubId });
      if (!exists) {
        await Membership.create({
          userId: app.userId,
          clubId: app.clubId,
          userName: app.applicantName,
          userEmail: app.applicantEmail,
          clubRole: "member",
          status: "active",
          joinedAt: new Date(),
          lastActiveAt: new Date(),
          attendanceRate: 0,
          tasksCompleted: 0,
          tasksPending: 0,
          contributionScore: 0,
        });
        await Club.findByIdAndUpdate(app.clubId, { $inc: { memberCount: 1 } });
      }
    }
    // Notify applicant
    await Notification.create({
      userId: app.userId,
      title: `Application Update: ${app.clubName}`,
      message: `Your membership application was ${status.toUpperCase()}! ${reviewerNotes || ""}`,
      type: "application_update",
      read: false,
      createdAt: new Date(),
    });
    return app.toObject();
  },

  // -------------------- Events --------------------
  getEvents: async (clubId) => {
    if (clubId) return await Event.find({ clubId }).lean();
    return await Event.find().lean();
  },
  createEvent: async (data) => {
    const ev = new Event({ ...data, eventDate: data.eventDate || data.date, createdById: data.createdById || data.createdBy, createdAt: new Date() });
    await ev.save();
    return ev.toObject();
  },
  updateEvent: async (id, updates) => await Event.findByIdAndUpdate(id, updates, { new: true }).lean(),

  // -------------------- Evidence --------------------
  getEvidence: async (clubId) => {
    if (clubId) return await Evidence.find({ clubId }).lean();
    return await Evidence.find().lean();
  },
  createEvidence: async (data) => {
    const ev = new Evidence({ ...data, status: "unverified", submittedAt: new Date() });
    await ev.save();
    // Notify all admins
    const admins = await User.find({ role: "admin" }).select("_id");
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        title: "Audit Required: Activity Evidence Submitted",
        message: `${data.submittedByName} submitted proof for '${data.title}'.`,
        type: "evidence_verified",
        read: false,
        createdAt: new Date(),
      });
    }
    return ev.toObject();
  },
  verifyEvidence: async (id, status, verifierId, verifierName, disputeReason) => {
    const ev = await Evidence.findById(id);
    if (!ev) return null;
    ev.status = status;
    ev.verifiedBy = verifierId;
    ev.verifiedByName = verifierName;
    ev.verifiedAt = new Date();
    if (disputeReason) ev.disputeReason = disputeReason;
    await ev.save();
    // Re‑calculate club trustScore
    const club = await Club.findById(ev.clubId);
    if (club) {
      const promises = club.promises || [];
      const promiseRate = promises.length
        ? (promises.filter((promise) => promise.delivered).length / promises.length) * 100
        : 0;
      const totalEvidence = await Evidence.countDocuments({ clubId: String(club._id) });
      const verifiedEvidence = await Evidence.countDocuments({ clubId: String(club._id), status: "verified" });
      const evidenceRate = totalEvidence ? (verifiedEvidence / totalEvidence) * 100 : 0;
      const totalMembers = await Membership.countDocuments({ clubId: String(club._id) });
      const activeMembers = await Membership.countDocuments({ clubId: String(club._id), status: "active" });
      const retentionRate = totalMembers ? (activeMembers / totalMembers) * 100 : 0;
      club.trustScore = Math.round(promiseRate * 0.45 + evidenceRate * 0.35 + retentionRate * 0.20);
      if (club.trustScore >= 85) club.transparencyTier = "Tier 1 - Gold";
      else if (club.trustScore >= 70) club.transparencyTier = "Tier 2 - Silver";
      else if (club.trustScore >= 50) club.transparencyTier = "Tier 3 - Bronze";
      else club.transparencyTier = "Under Review";
      await club.save();
    }
    await AuditLog.create({
      action: status === "verified" ? "EVIDENCE_VERIFIED" : "EVIDENCE_DISPUTED",
      performedBy: verifierId,
      performedByName: verifierName,
      role: "admin",
      targetType: "evidence",
      targetId: id,
      details: `${verifierName} marked evidence '${ev.title}' as ${status}. ${disputeReason || ""}`,
      timestamp: new Date(),
    });
    return ev.toObject();
  },

  // -------------------- Contributions --------------------
  getContributions: async (filter = {}) => {
    return await Contribution.find(filter).sort({ submittedAt: -1 }).lean();
  },
  createContribution: async (data) => {
    const contrib = new Contribution({ ...data, status: "submitted", submittedAt: new Date() });
    await contrib.save();
    return contrib.toObject();
  },
  updateContribution: async (id, updates) => {
    return await Contribution.findByIdAndUpdate(id, updates, { new: true }).lean();
  },

  // -------------------- Feedback --------------------
  getFeedback: async (clubId) => {
    // Only the club leader should call this - enforced at the API layer
    return await Feedback.find({ clubId }).lean();
  },
  createFeedback: async (data) => {
    const fb = new Feedback(data);
    await fb.save();
    return fb.toObject();
  },

  // -------------------- Availability --------------------
  getAvailability: async (userId) => {
    return await Availability.findOne({ userId }).lean();
  },
  updateAvailability: async (userId, data) => {
    return await Availability.findOneAndUpdate(
      { userId },
      { ...data, lastUpdatedAt: new Date() },
      { new: true, upsert: true }
    ).lean();
  },

  // -------------------- Notifications --------------------
  getNotifications: async (userId) => await Notification.find({ userId }).lean(),
  markNotificationRead: async (id) => {
    const notif = await Notification.findById(id);
    if (!notif) return false;
    notif.read = true;
    await notif.save();
    return true;
  },
  markAllNotificationsRead: async (userId) => {
    await Notification.updateMany({ userId }, { $set: { read: true } });
  },

  // -------------------- Audit Logs --------------------
  getAuditLogs: async () => await AuditLog.find().sort({ timestamp: -1 }).lean(),
};
