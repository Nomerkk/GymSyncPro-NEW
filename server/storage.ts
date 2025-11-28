
import {
  users,
  memberships,
  membershipPlans,
  gymClasses,
  classBookings,
  checkIns,
  payments,
  feedbacks,
  feedbackReplies,
  personalTrainers,
  ptBookings,
  ptSessionPackages,
  ptSessionAttendance,

  passwordResetTokens,
  notifications,
  pushSubscriptions,
  promotions,
  auditLogs,
  type User,
  type UpsertUser,
  type Membership,
  type InsertMembership,
  type MembershipPlan,
  type InsertMembershipPlan,
  type GymClass,
  type InsertGymClass,
  type ClassBooking,
  type InsertClassBooking,
  type CheckIn,
  type InsertCheckIn,
  type Payment,
  type InsertPayment,
  type Feedback,
  type InsertFeedback,
  type FeedbackReply,
  type InsertFeedbackReply,
  type PersonalTrainer,
  type InsertPersonalTrainer,
  type PtBooking,
  type InsertPtBooking,
  type PtSessionPackage,
  type InsertPtSessionPackage,
  type PtSessionAttendance,
  type InsertPtSessionAttendance,

  type PasswordResetToken,
  type InsertPasswordResetToken,
  type Notification,
  type InsertNotification,
  type PushSubscription,
  type InsertPushSubscription,
  type Promotion,
  type InsertPromotion,
  type AuditLog,
  type InsertAuditLog,
} from "../shared/schema";
import { db } from "./database/index";
import { eq, desc, gte, gt, lte, and, or, count, sum, sql, inArray, ilike } from "drizzle-orm";
import { sendInactivityReminderEmail } from "./email/resend";
import { randomUUID } from 'crypto';

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string | null | undefined): Promise<User | undefined>;
  getUserByEmailOrPhoneOrUsername(identifier: string): Promise<User | undefined>;
  getUserByPermanentQrCode(qrCode: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId?: string): Promise<User>;
  ensureUserPermanentQrCode(userId: string): Promise<string>;

  // Membership operations
  getMembershipPlans(): Promise<MembershipPlan[]>;
  getAllMembershipPlans(): Promise<MembershipPlan[]>;
  createMembershipPlan(plan: InsertMembershipPlan): Promise<MembershipPlan>;
  updateMembershipPlan(id: string, plan: Partial<InsertMembershipPlan>): Promise<MembershipPlan>;
  deleteMembershipPlan(id: string): Promise<void>;
  getUserMembership(userId: string): Promise<(Membership & { plan: MembershipPlan }) | undefined>;
  getLatestMembership(userId: string): Promise<(Membership & { plan: MembershipPlan }) | undefined>;
  createMembership(membership: InsertMembership): Promise<Membership>;
  updateMembership(id: string, membership: Partial<InsertMembership>): Promise<void>;
  updateMembershipStatus(id: string, status: string): Promise<void>;
  cancelUserMemberships(userId: string): Promise<void>;
  getExpiringMemberships(days: number, branch?: string): Promise<(Membership & { user: User; plan: MembershipPlan })[]>;

  // Class operations
  getGymClasses(branch?: string): Promise<GymClass[]>;
  createGymClass(gymClass: InsertGymClass): Promise<GymClass>;
  updateGymClass(id: string, gymClass: Partial<InsertGymClass>): Promise<void>;
  deleteGymClass(id: string): Promise<void>;
  getUserClassBookings(userId: string, limit?: number): Promise<(ClassBooking & { gymClass: GymClass })[]>;
  getAllClassBookings(limit?: number, offset?: number, branch?: string): Promise<(ClassBooking & { user: User; gymClass: GymClass })[]>;
  bookClass(booking: InsertClassBooking): Promise<ClassBooking>;
  updateClassBookingStatus(id: string, status: string): Promise<void>;
  cancelClassBooking(id: string): Promise<void>;

  // Check-in operations
  getUserCheckIns(userId: string, limit?: number): Promise<CheckIn[]>;
  createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn>;
  updateCheckOut(id: string): Promise<void>;
  getCurrentCrowdCount(): Promise<number>;
  validateCheckInQR(qrCode: string): Promise<(CheckIn & { user: User; membership?: Membership & { plan: MembershipPlan } }) | undefined>;
  validateMemberQrAndCheckIn(qrCode: string): Promise<(CheckIn & { user: User; membership?: Membership & { plan: MembershipPlan } }) | undefined>;
  getRecentCheckIns(limit?: number, offset?: number, branch?: string): Promise<(CheckIn & { user: User; membership?: Membership & { plan: MembershipPlan } })[]>;
  autoCheckoutExpiredSessions(): Promise<number>;
  getLatestCheckInTimestamp(userId: string): Promise<Date | null>;



  // Payment operations
  getUserPayments(userId: string, limit?: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: string, status: string): Promise<void>;
  updatePaymentStatusByTransactionId(transactionId: string, status: string): Promise<void>;
  getPaymentByOrderId(orderId: string): Promise<Payment | undefined>;

  // Admin operations
  getAllUsers(): Promise<User[]>;
  getTotalUsersCount(): Promise<number>;
  getUsersWithMemberships(limit?: number, offset?: number, search?: string, branch?: string): Promise<{ data: (User & { membership?: Membership & { plan: MembershipPlan } })[], total: number }>;
  getMembersWithActivity(limit?: number, offset?: number, search?: string, branch?: string): Promise<{ data: (User & { membership?: Membership & { plan: MembershipPlan }, lastCheckIn: Date | null, daysInactive: number | null })[], total: number }>;
  getRevenueStats(branch?: string): Promise<{ total: number; thisMonth: number; lastMonth: number }>;
  getMembershipStats(branch?: string): Promise<{ total: number; active: number; expiringSoon: number }>;

  // Feedback operations
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getUserFeedbacks(userId: string): Promise<Feedback[]>;
  getAllFeedbacks(limit?: number, offset?: number, branch?: string): Promise<(Feedback & { user: User })[]>;
  getFeedbackById(id: string): Promise<(Feedback & { user: User }) | undefined>;
  updateFeedbackStatus(id: string, status: string, isResolved?: boolean): Promise<void>;

  // Feedback Reply operations
  createFeedbackReply(reply: InsertFeedbackReply): Promise<FeedbackReply>;
  getFeedbackReplies(feedbackId: string): Promise<(FeedbackReply & { sender: User })[]>;

  // Personal Trainer operations
  getAllTrainers(branch?: string): Promise<PersonalTrainer[]>;
  getActiveTrainers(branch?: string): Promise<PersonalTrainer[]>;
  getTrainerById(id: string): Promise<PersonalTrainer | undefined>;
  createTrainer(trainer: InsertPersonalTrainer): Promise<PersonalTrainer>;
  updateTrainer(id: string, trainer: Partial<InsertPersonalTrainer>): Promise<void>;
  deleteTrainer(id: string): Promise<void>;

  // PT Booking operations
  getUserPtBookings(userId: string): Promise<(PtBooking & { trainer: PersonalTrainer })[]>;
  getAllPtBookings(limit?: number, offset?: number, branch?: string): Promise<(PtBooking & { user: User; trainer: PersonalTrainer })[]>;
  getPtBookingById(id: string): Promise<(PtBooking & { user: User; trainer: PersonalTrainer }) | undefined>;
  createPtBooking(booking: InsertPtBooking): Promise<PtBooking>;
  updatePtBookingStatus(id: string, status: string): Promise<void>;
  cancelPtBooking(id: string): Promise<void>;

  // PT Session Package operations
  createPtSessionPackage(packageData: InsertPtSessionPackage): Promise<PtSessionPackage>;
  getUserPtSessionPackages(userId: string): Promise<(PtSessionPackage & { trainer: PersonalTrainer })[]>;
  getPtSessionPackageById(id: string): Promise<(PtSessionPackage & { trainer: PersonalTrainer; user: User }) | undefined>;
  updatePtSessionPackage(id: string, packageData: Partial<InsertPtSessionPackage>): Promise<void>;
  getAllPtSessionPackagesWithUsers(limit?: number, offset?: number, branch?: string): Promise<(PtSessionPackage & { user: User })[]>;

  // PT Session Attendance operations
  createPtSessionAttendance(attendanceData: InsertPtSessionAttendance): Promise<PtSessionAttendance>;
  getPackageAttendanceSessions(packageId: string): Promise<(PtSessionAttendance & { trainer: PersonalTrainer })[]>;
  getUserPtAttendanceSessions(userId: string): Promise<(PtSessionAttendance & { trainer: PersonalTrainer; package: PtSessionPackage })[]>;
  getPtSessionAttendanceById(id: string): Promise<(PtSessionAttendance & { trainer: PersonalTrainer; user: User; package: PtSessionPackage }) | undefined>;
  updatePtSessionAttendance(id: string, attendanceData: Partial<InsertPtSessionAttendance>): Promise<void>;
  confirmPtSessionAttendance(id: string, adminId: string): Promise<void>;
  getAllPtSessionAttendanceWithUsers(limit?: number, offset?: number, branch?: string): Promise<(PtSessionAttendance & { user: User; trainer: PersonalTrainer })[]>;

  // Password Reset operations
  createPasswordResetToken(email: string, token: string): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(token: string): Promise<void>;
  cleanupExpiredResetTokens(): Promise<number>;
  updateUserPassword(email: string, newPassword: string): Promise<void>;

  // Email verification operations
  storeVerificationCode(email: string, code: string): Promise<void>;
  verifyEmailCode(email: string, code: string): Promise<boolean>;

  // Notification operations
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string, userId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(id: string, userId: string): Promise<void>;

  // Push Subscription operations
  getUserPushSubscriptions(userId: string): Promise<PushSubscription[]>;
  createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription>;
  deletePushSubscription(endpoint: string, userId: string): Promise<void>;
  getAllPushSubscriptions(userId: string): Promise<PushSubscription[]>;

  // Inactive member operations
  getInactiveMembers(daysInactive: number): Promise<(User & { membership: Membership & { plan: MembershipPlan } })[]>;
  sendInactivityReminders(daysInactive: number): Promise<number>;

  // QR Code operations
  validateOneTimeQrCode(qrCode: string): Promise<{ userId: string; status: string; expiresAt: Date; user: User; membership?: Membership } | undefined>;
  markQrCodeAsUsed(qrCode: string): Promise<void>;

  // Promotions operations
  getAllPromotions(): Promise<Promotion[]>;
  getActivePromotions(): Promise<Promotion[]>;
  createPromotion(promo: InsertPromotion): Promise<Promotion>;
  updatePromotion(id: string, promo: Partial<InsertPromotion>): Promise<void>;
  deletePromotion(id: string): Promise<void>;

  // Audit Log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number, offset?: number, branch?: string, search?: string): Promise<(AuditLog & { user: User })[]>;
  getAdmins(): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string | null | undefined): Promise<User | undefined> {
    if (!email) return undefined;
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByEmailOrPhoneOrUsername(identifier: string): Promise<User | undefined> {
    // Normalize identifier (trim)
    const normalizedIdentifier = identifier.trim();

    // Try to find user by username first
    let user = await this.getUserByUsername(normalizedIdentifier);
    if (user) return user;

    // Try to find user by email
    user = await this.getUserByEmail(normalizedIdentifier);
    if (user) return user;

    // Try to find user by phone (only if identifier is not empty and phone exists)
    const [userByPhone] = await db
      .select()
      .from(users)
      .where(eq(users.phone, normalizedIdentifier))
      .limit(1);

    return userByPhone;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    // 1. Unlink audit logs (keep history but remove user reference)
    await db.update(auditLogs).set({ userId: null }).where(eq(auditLogs.userId, id));

    // 2. Delete related records
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, id));
    await db.delete(notifications).where(eq(notifications.userId, id));
    await db.delete(ptSessionAttendance).where(eq(ptSessionAttendance.userId, id));
    await db.delete(ptSessionPackages).where(eq(ptSessionPackages.userId, id));
    await db.delete(ptBookings).where(eq(ptBookings.userId, id));
    await db.delete(feedbacks).where(eq(feedbacks.userId, id));
    await db.delete(payments).where(eq(payments.userId, id));
    await db.delete(checkIns).where(eq(checkIns.userId, id));
    await db.delete(classBookings).where(eq(classBookings.userId, id));
    await db.delete(memberships).where(eq(memberships.userId, id));

    // 3. Finally delete user
    await db.delete(users).where(eq(users.id, id));
  }

  async updateUserStripeInfo(userId: string, customerId: string, subscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserByPermanentQrCode(qrCode: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.permanentQrCode, qrCode));
    return user;
  }

  async ensureUserPermanentQrCode(userId: string): Promise<string> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // If user already has a permanent QR code, return it
    if (user.permanentQrCode) {
      return user.permanentQrCode;
    }

    // Generate a new permanent QR code
    const qrCode = randomUUID();

    // Update user with new permanent QR code
    await db
      .update(users)
      .set({
        permanentQrCode: qrCode,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return qrCode;
  }

  // Membership operations
  async getMembershipPlans(): Promise<MembershipPlan[]> {
    return await db.select().from(membershipPlans).where(eq(membershipPlans.active, true));
  }

  async getAllMembershipPlans(): Promise<MembershipPlan[]> {
    return await db.select().from(membershipPlans);
  }

  async createMembershipPlan(plan: InsertMembershipPlan): Promise<MembershipPlan> {
    const [newPlan] = await db.insert(membershipPlans).values(plan).returning();
    return newPlan;
  }

  async updateMembershipPlan(id: string, plan: Partial<InsertMembershipPlan>): Promise<MembershipPlan> {
    const [updatedPlan] = await db
      .update(membershipPlans)
      .set(plan)
      .where(eq(membershipPlans.id, id))
      .returning();
    return updatedPlan;
  }

  async deleteMembershipPlan(id: string): Promise<void> {
    await db.update(membershipPlans).set({ active: false }).where(eq(membershipPlans.id, id));
  }

  async getUserMembership(userId: string): Promise<(Membership & { plan: MembershipPlan }) | undefined> {
    const result = await db
      .select({
        id: memberships.id,
        userId: memberships.userId,
        planId: memberships.planId,
        startDate: memberships.startDate,
        endDate: memberships.endDate,
        status: memberships.status,
        autoRenewal: memberships.autoRenewal,
        createdAt: memberships.createdAt,
        plan: membershipPlans,
      })
      .from(memberships)
      .innerJoin(membershipPlans, eq(memberships.planId, membershipPlans.id))
      .where(and(eq(memberships.userId, userId), eq(memberships.status, "active")))
      .limit(1);

    const membership = result[0];

    // Lazy expiration check
    if (membership && new Date(membership.endDate) < new Date()) {
      console.log(`[Membership] Auto - expiring membership ${membership.id} for user ${userId}`);
      await this.updateMembershipStatus(membership.id, 'expired');
      return undefined;
    }

    return membership;
  }

  async getLatestMembership(userId: string): Promise<(Membership & { plan: MembershipPlan }) | undefined> {
    const result = await db
      .select({
        id: memberships.id,
        userId: memberships.userId,
        planId: memberships.planId,
        startDate: memberships.startDate,
        endDate: memberships.endDate,
        status: memberships.status,
        autoRenewal: memberships.autoRenewal,
        createdAt: memberships.createdAt,
        plan: membershipPlans,
      })
      .from(memberships)
      .innerJoin(membershipPlans, eq(memberships.planId, membershipPlans.id))
      .where(eq(memberships.userId, userId))
      .orderBy(desc(memberships.endDate))
      .limit(1);

    const membership = result[0];

    if (membership) {
      const now = new Date();
      const endDate = new Date(membership.endDate);
      console.log(`[Membership Check] ID: ${membership.id}, Status: ${membership.status}, EndDate: ${endDate.toISOString()}, Now: ${now.toISOString()}, IsExpired: ${endDate < now}`);
    }

    // Lazy expiration check for active memberships
    if (membership && membership.status === 'active' && new Date(membership.endDate) < new Date()) {
      console.log(`[Membership] Auto - expiring membership ${membership.id} for user ${userId}`);
      await this.updateMembershipStatus(membership.id, 'expired');
      membership.status = 'expired'; // Return updated status
    }

    return membership;
  }

  async createMembership(membership: InsertMembership): Promise<Membership> {
    const [newMembership] = await db.insert(memberships).values(membership).returning();
    return newMembership;
  }

  async updateMembership(id: string, membershipData: Partial<InsertMembership>): Promise<void> {
    await db.update(memberships).set(membershipData).where(eq(memberships.id, id));
  }

  async updateMembershipStatus(id: string, status: string): Promise<void> {
    await db.update(memberships).set({ status }).where(eq(memberships.id, id));
  }

  async cancelUserMemberships(userId: string): Promise<void> {
    await db.update(memberships)
      .set({ status: 'cancelled' })
      .where(eq(memberships.userId, userId));
  }

  async getExpiringMemberships(days: number, branch?: string): Promise<(Membership & { user: User; plan: MembershipPlan })[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    let query = db
      .select({
        id: memberships.id,
        userId: memberships.userId,
        planId: memberships.planId,
        startDate: memberships.startDate,
        endDate: memberships.endDate,
        status: memberships.status,
        autoRenewal: memberships.autoRenewal,
        createdAt: memberships.createdAt,
        user: users,
        plan: membershipPlans,
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .innerJoin(membershipPlans, eq(memberships.planId, membershipPlans.id))
      .where(
        and(
          eq(memberships.status, "active"),
          lte(memberships.endDate, cutoffDate)
        )
      );

    if (branch) {
      query = query.where(eq(users.homeBranch, branch));
    }

    return await query;
  }

  // Class operations
  async getGymClasses(branch?: string): Promise<GymClass[]> {
    try {
      let query = db.select().from(gymClasses).where(eq(gymClasses.active, true));

      if (branch) {
        query = query.where(eq(gymClasses.branch, branch));
      }

      return await query;
    } catch (e: any) {
      const msg = String(e?.message || e);
      const missingImageUrl = msg.includes('gym_classes.image_url') || msg.includes('column') && msg.includes('image_url');
      if (!missingImageUrl) throw e;

      let query = db
        .select({
          id: gymClasses.id,
          name: gymClasses.name,
          description: gymClasses.description,
          instructorName: gymClasses.instructorName,
          schedule: gymClasses.schedule,
          maxCapacity: gymClasses.maxCapacity,
          currentEnrollment: gymClasses.currentEnrollment,
          active: gymClasses.active,
          createdAt: gymClasses.createdAt,
          imageUrl: sql<string | null>`NULL`.as('image_url'),
        })
        .from(gymClasses)
        .where(eq(gymClasses.active, true));

      if (branch) {
        query = query.where(eq(gymClasses.branch, branch));
      }

      const rows = await query;
      return rows as unknown as GymClass[];
    }
  }

  async createGymClass(gymClass: InsertGymClass): Promise<GymClass> {
    try {
      const [newClass] = await db.insert(gymClasses).values(gymClass).returning();
      return newClass;
    } catch (e: any) {
      const msg = String(e?.message || e);
      const missingImageUrl = msg.includes('gym_classes.image_url') || msg.includes('column') && msg.includes('image_url');
      if (!missingImageUrl) throw e;
      const { imageUrl, ...rest } = gymClass as any;
      const [newClass] = await db.insert(gymClasses).values(rest).returning();
      return newClass as GymClass;
    }
  }

  async updateGymClass(id: string, gymClass: Partial<InsertGymClass>): Promise<void> {
    try {
      await db.update(gymClasses).set(gymClass).where(eq(gymClasses.id, id));
    } catch (e: any) {
      const msg = String(e?.message || e);
      const missingImageUrl = msg.includes('gym_classes.image_url') || msg.includes('column') && msg.includes('image_url');
      if (!missingImageUrl) throw e;
      const { imageUrl, ...rest } = gymClass as any;
      await db.update(gymClasses).set(rest).where(eq(gymClasses.id, id));
    }
  }

  async deleteGymClass(id: string): Promise<void> {
    await db.update(gymClasses).set({ active: false }).where(eq(gymClasses.id, id));
  }

  async getUserClassBookings(userId: string, limit?: number): Promise<(ClassBooking & { gymClass: GymClass })[]> {
    try {
      return await db
        .select({
          id: classBookings.id,
          userId: classBookings.userId,
          classId: classBookings.classId,
          bookingDate: classBookings.bookingDate,
          status: classBookings.status,
          createdAt: classBookings.createdAt,
          gymClass: gymClasses,
        })
        .from(classBookings)
        .innerJoin(gymClasses, eq(classBookings.classId, gymClasses.id))
        .where(eq(classBookings.userId, userId))
        .orderBy(desc(classBookings.bookingDate))
        .limit(limit || 50);
    } catch (e: any) {
      // Fallback for legacy DBs missing gym_classes.image_url column
      const msg = String(e?.message || e);
      const missingImageUrl = msg.includes('gym_classes.image_url') || msg.includes('column') && msg.includes('image_url');
      if (!missingImageUrl) throw e;
      const rows = await db
        .select({
          id: classBookings.id,
          userId: classBookings.userId,
          classId: classBookings.classId,
          bookingDate: classBookings.bookingDate,
          status: classBookings.status,
          createdAt: classBookings.createdAt,
          gymClass: {
            id: gymClasses.id,
            name: gymClasses.name,
            description: gymClasses.description,
            instructorName: gymClasses.instructorName,
            schedule: gymClasses.schedule,
            maxCapacity: gymClasses.maxCapacity,
            currentEnrollment: gymClasses.currentEnrollment,
            active: gymClasses.active,
            createdAt: gymClasses.createdAt,
            // Provide NULL literal to avoid referencing a non-existent column
            imageUrl: sql<string | null>`NULL`.as('image_url'),
          },
        })
        .from(classBookings)
        .innerJoin(gymClasses, eq(classBookings.classId, gymClasses.id))
        .where(eq(classBookings.userId, userId))
        .orderBy(desc(classBookings.bookingDate))
        .limit(limit || 50);
      return rows as unknown as (ClassBooking & { gymClass: GymClass })[];
    }
  }

  async getAllClassBookings(limit?: number, offset?: number, branch?: string): Promise<(ClassBooking & { user: User; gymClass: GymClass })[]> {
    try {
      let query = db
        .select({
          id: classBookings.id,
          userId: classBookings.userId,
          classId: classBookings.classId,
          bookingDate: classBookings.bookingDate,
          status: classBookings.status,
          createdAt: classBookings.createdAt,
          user: users,
          gymClass: gymClasses,
        })
        .from(classBookings)
        .innerJoin(users, eq(classBookings.userId, users.id))
        .innerJoin(gymClasses, eq(classBookings.classId, gymClasses.id))
        .orderBy(desc(classBookings.bookingDate));

      if (branch) {
        query = query.where(eq(gymClasses.branch, branch));
      }

      if (limit) query = query.limit(limit);
      if (offset) query = query.offset(offset);

      return await query;
    } catch (e: any) {
      const msg = String(e?.message || e);
      const missingImageUrl = msg.includes('gym_classes.image_url') || msg.includes('column') && msg.includes('image_url');
      if (!missingImageUrl) throw e;
      const rows = await db
        .select({
          id: classBookings.id,
          userId: classBookings.userId,
          classId: classBookings.classId,
          bookingDate: classBookings.bookingDate,
          status: classBookings.status,
          createdAt: classBookings.createdAt,
          user: users,
          gymClass: {
            id: gymClasses.id,
            name: gymClasses.name,
            description: gymClasses.description,
            instructorName: gymClasses.instructorName,
            schedule: gymClasses.schedule,
            maxCapacity: gymClasses.maxCapacity,
            currentEnrollment: gymClasses.currentEnrollment,
            active: gymClasses.active,
            createdAt: gymClasses.createdAt,
            imageUrl: sql<string | null>`NULL`.as('image_url'),
          },
        })
        .from(classBookings)
        .innerJoin(users, eq(classBookings.userId, users.id))
        .innerJoin(gymClasses, eq(classBookings.classId, gymClasses.id))
        .orderBy(desc(classBookings.bookingDate));
      return rows as unknown as (ClassBooking & { user: User; gymClass: GymClass })[];
    }
  }

  async bookClass(booking: InsertClassBooking): Promise<ClassBooking> {
    const [newBooking] = await db.insert(classBookings).values(booking).returning();

    // Update class enrollment count - get current count first
    const currentBookings = await db
      .select({ count: count() })
      .from(classBookings)
      .where(and(eq(classBookings.classId, booking.classId), eq(classBookings.status, "booked")));

    await db
      .update(gymClasses)
      .set({ currentEnrollment: currentBookings[0]?.count || 0 })
      .where(eq(gymClasses.id, booking.classId));

    return newBooking;
  }

  async updateClassBookingStatus(id: string, status: string): Promise<void> {
    const [booking] = await db.select().from(classBookings).where(eq(classBookings.id, id));

    if (!booking) {
      return;
    }

    await db.update(classBookings).set({ status }).where(eq(classBookings.id, id));

    // Update class enrollment count
    const currentBookings = await db
      .select({ count: count() })
      .from(classBookings)
      .where(and(eq(classBookings.classId, booking.classId), eq(classBookings.status, "booked")));

    await db
      .update(gymClasses)
      .set({ currentEnrollment: currentBookings[0]?.count || 0 })
      .where(eq(gymClasses.id, booking.classId));
  }

  async cancelClassBooking(id: string): Promise<void> {
    const [booking] = await db.select().from(classBookings).where(eq(classBookings.id, id));

    if (!booking || booking.status === 'cancelled') {
      return;
    }

    await db.update(classBookings).set({ status: "cancelled" }).where(eq(classBookings.id, id));

    const currentBookings = await db
      .select({ count: count() })
      .from(classBookings)
      .where(and(eq(classBookings.classId, booking.classId), eq(classBookings.status, "booked")));

    await db
      .update(gymClasses)
      .set({ currentEnrollment: currentBookings[0]?.count || 0 })
      .where(eq(gymClasses.id, booking.classId));
  }

  // Check-in operations
  async getLatestCheckInTimestamp(userId: string): Promise<Date | null> {
    const result = await db
      .select({ checkInTime: checkIns.checkInTime })
      .from(checkIns)
      .where(eq(checkIns.userId, userId))
      .orderBy(desc(checkIns.checkInTime))
      .limit(1);

    return result.length > 0 ? result[0].checkInTime : null;
  }

  async getUserCheckIns(userId: string, limit = 10): Promise<CheckIn[]> {
    return await db
      .select()
      .from(checkIns)
      .where(eq(checkIns.userId, userId))
      .orderBy(desc(checkIns.checkInTime))
      .limit(limit);
  }

  async createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn> {
    const [newCheckIn] = await db.insert(checkIns).values(checkIn).returning();
    return newCheckIn;
  }

  async updateCheckOut(id: string): Promise<void> {
    await db
      .update(checkIns)
      .set({ checkOutTime: new Date(), status: "completed" })
      .where(eq(checkIns.id, id));
  }

  // Simple in-memory cache for crowd count
  private crowdCountCache: { count: number; timestamp: number } | null = null;
  private readonly CROWD_COUNT_TTL = 60 * 1000; // 60 seconds

  async getCurrentCrowdCount(): Promise<number> {
    const now = Date.now();

    // Return cached value if valid
    if (this.crowdCountCache && (now - this.crowdCountCache.timestamp) < this.CROWD_COUNT_TTL) {
      return this.crowdCountCache.count;
    }

    // Fetch new value
    const [result] = await db
      .select({ count: count() })
      .from(checkIns)
      .where(eq(checkIns.status, "active"));

    const countVal = result?.count || 0;

    // Update cache
    this.crowdCountCache = {
      count: countVal,
      timestamp: now
    };

    return countVal;
  }

  async validateCheckInQR(qrCode: string): Promise<(CheckIn & { user: User; membership?: Membership & { plan: MembershipPlan } }) | undefined> {
    const result = await db
      .select({
        id: checkIns.id,
        userId: checkIns.userId,
        checkInTime: checkIns.checkInTime,
        checkOutTime: checkIns.checkOutTime,
        qrCode: checkIns.qrCode,
        lockerNumber: checkIns.lockerNumber,
        branch: checkIns.branch,
        status: checkIns.status,
        createdAt: checkIns.createdAt,
        user: users,
        membershipId: memberships.id,
        membershipUserId: memberships.userId,
        membershipPlanId: memberships.planId,
        membershipStartDate: memberships.startDate,
        membershipEndDate: memberships.endDate,
        membershipStatus: memberships.status,
        membershipAutoRenewal: memberships.autoRenewal,
        membershipCreatedAt: memberships.createdAt,
        planId: membershipPlans.id,
        planName: membershipPlans.name,
        planDescription: membershipPlans.description,
        planPrice: membershipPlans.price,
        planDurationMonths: membershipPlans.durationMonths,
        planFeatures: membershipPlans.features,
        planStripePriceId: membershipPlans.stripePriceId,
        planActive: membershipPlans.active,
        planCreatedAt: membershipPlans.createdAt,
      })
      .from(checkIns)
      .innerJoin(users, eq(checkIns.userId, users.id))
      .leftJoin(memberships, and(eq(users.id, memberships.userId), eq(memberships.status, "active")))
      .leftJoin(membershipPlans, eq(memberships.planId, membershipPlans.id))
      .where(and(eq(checkIns.qrCode, qrCode), eq(checkIns.status, "active")))
      .limit(1);

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      id: row.id,
      userId: row.userId,
      checkInTime: row.checkInTime,
      checkOutTime: row.checkOutTime,
      qrCode: row.qrCode,
      lockerNumber: row.lockerNumber,
      branch: row.branch,
      status: row.status,
      createdAt: row.createdAt,
      user: row.user,
      membership: row.membershipId ? {
        id: row.membershipId,
        userId: row.membershipUserId!,
        planId: row.membershipPlanId!,
        startDate: row.membershipStartDate!,
        endDate: row.membershipEndDate!,
        status: row.membershipStatus!,
        autoRenewal: row.membershipAutoRenewal!,
        createdAt: row.membershipCreatedAt!,
        plan: {
          id: row.planId!,
          name: row.planName!,
          description: row.planDescription,
          price: row.planPrice!,
          durationMonths: row.planDurationMonths!,
          features: row.planFeatures,
          stripePriceId: row.planStripePriceId,
          active: row.planActive!,
          createdAt: row.planCreatedAt!,
        }
      } : undefined
    };
  }

  async validateMemberQrAndCheckIn(qrCode: string): Promise<(CheckIn & { user: User; membership?: Membership & { plan: MembershipPlan } }) | undefined> {
    // Find user by permanent QR code
    const user = await this.getUserByPermanentQrCode(qrCode);
    if (!user) {
      return undefined;
    }

    // Check if user has an active check-in today
    const existingCheckIn = await db
      .select({
        id: checkIns.id,
        userId: checkIns.userId,
        checkInTime: checkIns.checkInTime,
        checkOutTime: checkIns.checkOutTime,
        qrCode: checkIns.qrCode,
        status: checkIns.status,
        createdAt: checkIns.createdAt,
      })
      .from(checkIns)
      .where(and(eq(checkIns.userId, user.id), eq(checkIns.status, "active")))
      .limit(1);

    let checkIn: CheckIn;

    if (existingCheckIn.length > 0) {
      // User already has an active check-in
      checkIn = existingCheckIn[0];
    } else {
      // Create new check-in
      const newCheckInQr = randomUUID();
      const [newCheckIn] = await db
        .insert(checkIns)
        .values({
          userId: user.id,
          qrCode: newCheckInQr,
          status: 'active',
        })
        .returning();
      checkIn = newCheckIn;
    }

    // Get membership info
    const membership = await this.getUserMembership(user.id);

    return {
      ...checkIn,
      user,
      membership,
    };
  }

  async getRecentCheckIns(limit = 20, offset = 0, branch?: string): Promise<(CheckIn & { user: User; membership?: Membership & { plan: MembershipPlan } })[]> {
    let query = db
      .select({
        id: checkIns.id,
        userId: checkIns.userId,
        checkInTime: checkIns.checkInTime,
        checkOutTime: checkIns.checkOutTime,
        qrCode: checkIns.qrCode,
        lockerNumber: checkIns.lockerNumber,
        branch: checkIns.branch,
        status: checkIns.status,
        createdAt: checkIns.createdAt,
        user: users,
        membershipId: memberships.id,
        membershipUserId: memberships.userId,
        membershipPlanId: memberships.planId,
        membershipStartDate: memberships.startDate,
        membershipEndDate: memberships.endDate,
        membershipStatus: memberships.status,
        membershipAutoRenewal: memberships.autoRenewal,
        membershipCreatedAt: memberships.createdAt,
        planId: membershipPlans.id,
        planName: membershipPlans.name,
        planDescription: membershipPlans.description,
        planPrice: membershipPlans.price,
        planDurationMonths: membershipPlans.durationMonths,
        planFeatures: membershipPlans.features,
        planStripePriceId: membershipPlans.stripePriceId,
        planActive: membershipPlans.active,
        planCreatedAt: membershipPlans.createdAt,
      })
      .from(checkIns)
      .innerJoin(users, eq(checkIns.userId, users.id))
      .leftJoin(memberships, and(eq(users.id, memberships.userId), eq(memberships.status, "active")))
      .leftJoin(membershipPlans, eq(memberships.planId, membershipPlans.id))
      .orderBy(desc(checkIns.checkInTime));

    if (branch) {
      query = query.where(eq(checkIns.branch, branch));
    }

    const result = await query.limit(limit).offset(offset);

    return result.map((row: any) => ({
      id: row.id,
      userId: row.userId,
      checkInTime: row.checkInTime,
      checkOutTime: row.checkOutTime,
      qrCode: row.qrCode,
      lockerNumber: row.lockerNumber,
      branch: row.branch,
      status: row.status,
      createdAt: row.createdAt,
      user: row.user,
      membership: row.membershipId ? {
        id: row.membershipId,
        userId: row.membershipUserId!,
        planId: row.membershipPlanId!,
        startDate: row.membershipStartDate!,
        endDate: row.membershipEndDate!,
        status: row.membershipStatus!,
        autoRenewal: row.membershipAutoRenewal!,
        createdAt: row.membershipCreatedAt!,
        plan: {
          id: row.planId!,
          name: row.planName!,
          description: row.planDescription,
          price: row.planPrice!,
          durationMonths: row.planDurationMonths!,
          features: row.planFeatures,
          stripePriceId: row.planStripePriceId,
          active: row.planActive!,
          createdAt: row.planCreatedAt!,
        }
      } : undefined
    }));
  }

  async autoCheckoutExpiredSessions(): Promise<number> {
    const threeHoursAgo = new Date();
    threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);

    const expiredCheckIns = await db
      .select()
      .from(checkIns)
      .where(
        and(
          eq(checkIns.status, "active"),
          lte(checkIns.checkInTime, threeHoursAgo)
        )
      );

    if (expiredCheckIns.length === 0) {
      return 0;
    }

    for (const checkIn of expiredCheckIns) {
      await db
        .update(checkIns)
        .set({
          checkOutTime: new Date(),
          status: "completed"
        })
        .where(eq(checkIns.id, checkIn.id));
    }

    console.log(`Auto - checkout: ${expiredCheckIns.length} member(s) checked out automatically after 3 hours`);
    return expiredCheckIns.length;
  }

  // Payment operations
  async getUserPayments(userId: string, limit?: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt))
      .limit(limit || 50);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePaymentStatus(id: string, status: string): Promise<void> {
    await db.update(payments).set({ status }).where(eq(payments.id, id));
  }

  async updatePaymentStatusByTransactionId(transactionId: string, status: string): Promise<void> {
    await db.update(payments).set({ status }).where(eq(payments.stripePaymentIntentId, transactionId));
  }

  async getPaymentByOrderId(orderId: string): Promise<Payment | undefined> {
    // For now, we'll use the description field to store order ID
    // In production, you might want to add a separate orderId column
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.description, orderId));
    return payment;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getTotalUsersCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(users);
    return result?.count || 0;
  }

  async getUsersWithMemberships(limit?: number, offset?: number, search?: string, branch?: string): Promise<{ data: (User & { membership?: Membership & { plan: MembershipPlan } })[], total: number }> {
    console.log('[getUsersWithMemberships] Called with:', { limit, offset, search, branch });

    const conditions = [];

    // NOTE: Members don't have homeBranch - that's only for admins
    // We're NOT filtering by branch here because members can use any branch
    // Branch filtering should only apply to admin access control, not member data

    if (search) {
      const searchLower = search.toLowerCase();
      conditions.push(
        or(
          sql`lower(${users.firstName}) LIKE ${`%${searchLower}%`} `,
          sql`lower(${users.lastName}) LIKE ${`%${searchLower}%`} `,
          sql`lower(${users.email}) LIKE ${`%${searchLower}%`} `,
          sql`lower(${users.username}) LIKE ${`%${searchLower}%`} `
        )
      );
    }

    // Get total count
    let total = 0;
    if (conditions.length > 0) {
      const [countResult] = await db
        .select({ count: count() })
        .from(users)
        .where(and(...conditions));
      total = countResult?.count || 0;
    } else {
      total = await this.getTotalUsersCount();
    }

    console.log('[getUsersWithMemberships] Total members found:', total);

    // Get users
    let userQuery = db.select().from(users);
    if (conditions.length > 0) {
      userQuery = userQuery.where(and(...conditions)) as any;
    }
    if (limit) {
      userQuery = userQuery.limit(limit) as any;
    }
    if (offset) {
      userQuery = userQuery.offset(offset) as any;
    }

    const usersList = await userQuery;
    console.log('[getUsersWithMemberships] Users fetched:', usersList.length);

    if (usersList.length === 0) {
      return { data: [], total };
    }

    const userIds = usersList.map((u: any) => u.id);

    // Get active memberships for these users with plans
    const activeMemberships = await db
      .select({
        id: memberships.id,
        userId: memberships.userId,
        planId: memberships.planId,
        startDate: memberships.startDate,
        endDate: memberships.endDate,
        status: memberships.status,
        autoRenewal: memberships.autoRenewal,
        createdAt: memberships.createdAt,
        planName: membershipPlans.name,
        planDescription: membershipPlans.description,
        planPrice: membershipPlans.price,
        planDurationMonths: membershipPlans.durationMonths,
        planFeatures: membershipPlans.features,
        planStripePriceId: membershipPlans.stripePriceId,
        planActive: membershipPlans.active,
        planCreatedAt: membershipPlans.createdAt,
      })
      .from(memberships)
      .innerJoin(membershipPlans, eq(memberships.planId, membershipPlans.id))
      .where(
        and(
          inArray(memberships.userId, userIds),
          eq(memberships.status, 'active'),
          sql`${memberships.endDate} > NOW()`
        )
      )
      .orderBy(desc(memberships.createdAt));

    console.log('[getUsersWithMemberships] Active memberships found:', activeMemberships.length);

    // Create a map of userId -> latest membership
    const membershipMap = new Map<string, any>();
    for (const m of activeMemberships) {
      if (!membershipMap.has(m.userId)) {
        membershipMap.set(m.userId, m);
      }
    }

    // Merge users with their memberships
    const data = usersList.map((user: any) => {
      const membershipData = membershipMap.get(user.id);

      return {
        id: user.id,
        username: user.username,
        password: '', // Never expose password
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
        permanentQrCode: user.permanentQrCode,
        role: user.role,
        homeBranch: user.homeBranch,
        active: user.active,
        emailVerified: user.emailVerified,
        verificationCode: user.verificationCode,
        verificationCodeExpiry: user.verificationCodeExpiry,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        membership: membershipData ? {
          id: membershipData.id,
          userId: membershipData.userId,
          planId: membershipData.planId,
          startDate: membershipData.startDate,
          endDate: membershipData.endDate,
          status: membershipData.status,
          autoRenewal: membershipData.autoRenewal,
          createdAt: membershipData.createdAt,
          plan: {
            id: membershipData.planId,
            name: membershipData.planName,
            description: membershipData.planDescription,
            price: membershipData.planPrice,
            durationMonths: membershipData.planDurationMonths,
            features: membershipData.planFeatures,
            stripePriceId: membershipData.planStripePriceId,
            active: membershipData.planActive,
            createdAt: membershipData.planCreatedAt,
          }
        } : undefined
      };
    });

    console.log('[getUsersWithMemberships] Returning data count:', data.length);
    return { data, total };
  }

  async getMembersWithActivity(limit?: number, offset?: number, search?: string, branch?: string): Promise<{ data: (User & { membership?: Membership & { plan: MembershipPlan }, lastCheckIn: Date | null, daysInactive: number | null })[], total: number }> {
    // 1. Get users with memberships (paginated & filtered)
    const { data: members, total } = await this.getUsersWithMemberships(limit, offset, search, branch);

    if (members.length === 0) {
      return { data: [], total: 0 };
    }

    const memberIds = members.map(m => m.id);

    // 2. Get latest check-ins for these users in a single query
    // Using distinctOn to get the latest check-in per user
    const latestCheckIns = await db
      .selectDistinctOn([checkIns.userId])
      .from(checkIns)
      .where(inArray(checkIns.userId, memberIds))
      .orderBy(checkIns.userId, desc(checkIns.checkInTime));

    // 3. Create a map for quick lookup
    // 3. Create a map for quick lookup
    const checkInMap = new Map<string, CheckIn>(latestCheckIns.map((c: any) => [c.userId, c]));

    // 4. Merge data
    const membersWithActivity = members.map(member => {
      const lastCheckIn = checkInMap.get(member.id);
      let daysInactive = null;

      if (lastCheckIn?.checkInTime) {
        const now = new Date();
        const lastCheckInDate = new Date(lastCheckIn.checkInTime);
        const diffTime = now.getTime() - lastCheckInDate.getTime();
        daysInactive = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        ...member,
        lastCheckIn: lastCheckIn?.checkInTime || null,
        daysInactive
      };
    });

    return { data: membersWithActivity, total };
  }

  async getRevenueStats(branch?: string): Promise<{ total: number; thisMonth: number; lastMonth: number }> {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Build base query with branch filter if provided
    const buildQuery = (additionalConditions: any[] = []) => {
      let query = db
        .select({ total: sum(payments.amount) })
        .from(payments);

      if (branch) {
        query = query
          .innerJoin(users, eq(payments.userId, users.id))
          .where(and(eq(users.homeBranch, branch), ...additionalConditions));
      } else if (additionalConditions.length > 0) {
        query = query.where(and(...additionalConditions));
      }

      return query;
    };

    const [totalResult] = await buildQuery([eq(payments.status, "completed")]);

    const [thisMonthResult] = await buildQuery([
      eq(payments.status, "completed"),
      gte(payments.createdAt, firstDayThisMonth)
    ]);

    const [lastMonthResult] = await buildQuery([
      eq(payments.status, "completed"),
      gte(payments.createdAt, firstDayLastMonth),
      lte(payments.createdAt, lastDayLastMonth)
    ]);

    return {
      total: Number(totalResult?.total || 0),
      thisMonth: Number(thisMonthResult?.total || 0),
      lastMonth: Number(lastMonthResult?.total || 0),
    };
  }

  async getMembershipStats(branch?: string): Promise<{ total: number; active: number; expiringSoon: number }> {
    const branchCondition = branch ? eq(users.homeBranch, branch) : undefined;

    const [totalResult] = branch
      ? await db
        .select({ count: count() })
        .from(memberships)
        .innerJoin(users, eq(memberships.userId, users.id))
        .where(branchCondition!)
      : await db.select({ count: count() }).from(memberships);

    const [activeResult] = branch
      ? await db
        .select({ count: count() })
        .from(memberships)
        .innerJoin(users, eq(memberships.userId, users.id))
        .where(and(eq(memberships.status, "active"), branchCondition!))
      : await db
        .select({ count: count() })
        .from(memberships)
        .where(eq(memberships.status, "active"));

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + 15);

    const conditions = [
      eq(memberships.status, "active"),
      lte(memberships.endDate, cutoffDate)
    ];
    if (branch) {
      conditions.push(branchCondition!);
    }

    const [expiringSoonResult] = await db
      .select({ count: count() })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .where(and(...conditions));

    return {
      total: totalResult?.count || 0,
      active: activeResult?.count || 0,
      expiringSoon: expiringSoonResult?.count || 0,
    };
  }

  // Feedback operations
  async createFeedback(feedback: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db.insert(feedbacks).values(feedback).returning();
    return newFeedback;
  }

  async getUserFeedbacks(userId: string): Promise<Feedback[]> {
    return await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.userId, userId))
      .orderBy(desc(feedbacks.lastReplyAt));
  }

  async getAllFeedbacks(limit?: number, offset?: number, branch?: string): Promise<(Feedback & { user: User })[]> {
    const conditions = [];
    if (branch) {
      conditions.push(eq(feedbacks.branch, branch));
    }

    const query = db
      .select({
        id: feedbacks.id,
        userId: feedbacks.userId,
        subject: feedbacks.subject,
        message: feedbacks.message,
        rating: feedbacks.rating,
        status: feedbacks.status,
        isResolved: feedbacks.isResolved,
        lastReplyAt: feedbacks.lastReplyAt,
        adminResponse: feedbacks.adminResponse,
        branch: feedbacks.branch,
        isAnonymous: feedbacks.isAnonymous,
        createdAt: feedbacks.createdAt,
        updatedAt: feedbacks.updatedAt,
        user: users,
      })
      .from(feedbacks)
      .innerJoin(users, eq(feedbacks.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(feedbacks.lastReplyAt));

    if (limit) query.limit(limit);
    if (offset) query.offset(offset);

    return await query;
  }

  async getFeedbackById(id: string): Promise<(Feedback & { user: User }) | undefined> {
    const [result] = await db
      .select({
        id: feedbacks.id,
        userId: feedbacks.userId,
        subject: feedbacks.subject,
        message: feedbacks.message,
        rating: feedbacks.rating,
        status: feedbacks.status,
        isResolved: feedbacks.isResolved,
        lastReplyAt: feedbacks.lastReplyAt,
        adminResponse: feedbacks.adminResponse,
        branch: feedbacks.branch,
        isAnonymous: feedbacks.isAnonymous,
        createdAt: feedbacks.createdAt,
        updatedAt: feedbacks.updatedAt,
        user: users,
      })
      .from(feedbacks)
      .innerJoin(users, eq(feedbacks.userId, users.id))
      .where(eq(feedbacks.id, id));

    return result;
  }

  async updateFeedbackStatus(id: string, status: string, isResolved?: boolean): Promise<void> {
    const updateData: any = { status, updatedAt: new Date() };
    if (isResolved !== undefined) {
      updateData.isResolved = isResolved;
    }
    await db.update(feedbacks).set(updateData).where(eq(feedbacks.id, id));
  }

  // Feedback Reply operations
  async createFeedbackReply(reply: InsertFeedbackReply): Promise<FeedbackReply> {
    const [newReply] = await db.insert(feedbackReplies).values(reply).returning();

    // Update feedback lastReplyAt
    await db.update(feedbacks)
      .set({ lastReplyAt: new Date(), updatedAt: new Date() })
      .where(eq(feedbacks.id, reply.feedbackId));

    return newReply;
  }

  async getFeedbackReplies(feedbackId: string): Promise<(FeedbackReply & { sender: User })[]> {
    return await db
      .select({
        id: feedbackReplies.id,
        feedbackId: feedbackReplies.feedbackId,
        senderId: feedbackReplies.senderId,
        message: feedbackReplies.message,
        readAt: feedbackReplies.readAt,
        createdAt: feedbackReplies.createdAt,
        sender: users,
      })
      .from(feedbackReplies)
      .innerJoin(users, eq(feedbackReplies.senderId, users.id))
      .where(eq(feedbackReplies.feedbackId, feedbackId))
      .orderBy(feedbackReplies.createdAt);
  }

  // Personal Trainer operations
  async getAllTrainers(branch?: string): Promise<PersonalTrainer[]> {
    let query = db.select().from(personalTrainers).orderBy(desc(personalTrainers.createdAt));

    if (branch) {
      // @ts-ignore - branch column exists in schema but might not be in types yet if not regenerated
      query = query.where(eq(personalTrainers.branch, branch));
    }

    return await query;
  }

  async getActiveTrainers(branch?: string): Promise<PersonalTrainer[]> {
    let query = db.select().from(personalTrainers).where(eq(personalTrainers.active, true)).orderBy(desc(personalTrainers.createdAt));

    if (branch) {
      // @ts-ignore
      query = query.where(and(eq(personalTrainers.active, true), eq(personalTrainers.branch, branch)));
    }

    return await query;
  }

  async getTrainerById(id: string): Promise<PersonalTrainer | undefined> {
    const [trainer] = await db.select().from(personalTrainers).where(eq(personalTrainers.id, id));
    return trainer;
  }

  async createTrainer(trainerData: InsertPersonalTrainer): Promise<PersonalTrainer> {
    const [trainer] = await db.insert(personalTrainers).values(trainerData).returning();
    return trainer;
  }

  async updateTrainer(id: string, trainerData: Partial<InsertPersonalTrainer>): Promise<void> {
    await db
      .update(personalTrainers)
      .set({
        ...trainerData,
        updatedAt: new Date(),
      })
      .where(eq(personalTrainers.id, id));
  }

  async deleteTrainer(id: string): Promise<void> {
    await db.update(personalTrainers).set({ active: false, updatedAt: new Date() }).where(eq(personalTrainers.id, id));
  }

  // PT Booking operations
  async getUserPtBookings(userId: string): Promise<(PtBooking & { trainer: PersonalTrainer })[]> {
    const rows = await db
      .select({
        booking: ptBookings,
        trainer: personalTrainers,
      })
      .from(ptBookings)
      .innerJoin(personalTrainers, eq(ptBookings.trainerId, personalTrainers.id))
      .where(eq(ptBookings.userId, userId))
      .orderBy(desc(ptBookings.bookingDate));

    return rows.map(({ booking, trainer }: { booking: PtBooking; trainer: PersonalTrainer }) => ({
      ...booking,
      trainer,
    }));
  }

  async getAllPtBookings(limit?: number, offset?: number, branch?: string): Promise<(PtBooking & { user: User; trainer: PersonalTrainer })[]> {
    let query = db
      .select({
        booking: ptBookings,
        user: users,
        trainer: personalTrainers,
      })
      .from(ptBookings)
      .innerJoin(users, eq(ptBookings.userId, users.id))
      .innerJoin(personalTrainers, eq(ptBookings.trainerId, personalTrainers.id))
      .orderBy(desc(ptBookings.bookingDate));

    if (branch) {
      query = query.where(eq(users.homeBranch, branch));
    }

    if (limit) query = query.limit(limit);
    if (offset) query = query.offset(offset);

    const rows = await query;

    return rows.map(({ booking, user, trainer }: { booking: PtBooking; user: User; trainer: PersonalTrainer }) => ({
      ...booking,
      user,
      trainer,
    }));
  }

  async getAllPtSessionPackagesWithUsers(limit?: number, offset?: number, branch?: string): Promise<(PtSessionPackage & { user: User })[]> {
    let query = db
      .select({
        pkg: ptSessionPackages,
        user: users,
      })
      .from(ptSessionPackages)
      .innerJoin(users, eq(ptSessionPackages.userId, users.id))
      .orderBy(desc(ptSessionPackages.createdAt));

    if (branch) {
      query = query.where(eq(users.homeBranch, branch));
    }

    if (limit) query = query.limit(limit);
    if (offset) query = query.offset(offset);

    const rows = await query;

    return rows.map(({ pkg, user }: { pkg: PtSessionPackage; user: User }) => ({
      ...pkg,
      user,
    }));
  }

  async getAllPtSessionAttendanceWithUsers(limit?: number, offset?: number, branch?: string): Promise<(PtSessionAttendance & { user: User; trainer: PersonalTrainer })[]> {
    let query = db
      .select({
        attendance: ptSessionAttendance,
        user: users,
        trainer: personalTrainers,
      })
      .from(ptSessionAttendance)
      .innerJoin(users, eq(ptSessionAttendance.userId, users.id))
      .innerJoin(personalTrainers, eq(ptSessionAttendance.trainerId, personalTrainers.id))
      .orderBy(desc(ptSessionAttendance.sessionDate));

    if (branch) {
      query = query.where(eq(users.homeBranch, branch));
    }

    if (limit) query = query.limit(limit);
    if (offset) query = query.offset(offset);

    const rows = await query;

    return rows.map(({ attendance, user, trainer }: { attendance: PtSessionAttendance; user: User; trainer: PersonalTrainer }) => ({
      ...attendance,
      user,
      trainer,
    }));
  }

  async getPtBookingById(id: string): Promise<(PtBooking & { user: User; trainer: PersonalTrainer }) | undefined> {
    const result = await db
      .select({
        booking: ptBookings,
        user: users,
        trainer: personalTrainers,
      })
      .from(ptBookings)
      .innerJoin(users, eq(ptBookings.userId, users.id))
      .innerJoin(personalTrainers, eq(ptBookings.trainerId, personalTrainers.id))
      .where(eq(ptBookings.id, id))
      .limit(1);

    if (result.length === 0) return undefined;

    const { booking, user, trainer } = result[0];
    return {
      ...booking,
      user,
      trainer,
    };
  }

  async createPtBooking(bookingData: InsertPtBooking): Promise<PtBooking> {
    const [booking] = await db.insert(ptBookings).values(bookingData).returning();
    return booking;
  }

  async updatePtBookingStatus(id: string, status: string): Promise<void> {
    await db
      .update(ptBookings)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(ptBookings.id, id));
  }

  async cancelPtBooking(id: string): Promise<void> {
    await db
      .update(ptBookings)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(ptBookings.id, id));
  }

  // PT Session Package operations
  async createPtSessionPackage(packageData: InsertPtSessionPackage): Promise<PtSessionPackage> {
    const [pkg] = await db.insert(ptSessionPackages).values(packageData).returning();
    return pkg;
  }

  async getUserPtSessionPackages(userId: string): Promise<(PtSessionPackage & { trainer: PersonalTrainer })[]> {
    const rows = await db
      .select({
        pkg: ptSessionPackages,
        trainer: personalTrainers,
      })
      .from(ptSessionPackages)
      .innerJoin(personalTrainers, eq(ptSessionPackages.trainerId, personalTrainers.id))
      .where(eq(ptSessionPackages.userId, userId))
      .orderBy(desc(ptSessionPackages.createdAt));

    return rows.map(({ pkg, trainer }: { pkg: PtSessionPackage; trainer: PersonalTrainer }) => ({
      ...pkg,
      trainer,
    }));
  }

  async getPtSessionPackageById(id: string): Promise<(PtSessionPackage & { trainer: PersonalTrainer; user: User }) | undefined> {
    const result = await db
      .select({
        pkg: ptSessionPackages,
        trainer: personalTrainers,
        user: users,
      })
      .from(ptSessionPackages)
      .innerJoin(personalTrainers, eq(ptSessionPackages.trainerId, personalTrainers.id))
      .innerJoin(users, eq(ptSessionPackages.userId, users.id))
      .where(eq(ptSessionPackages.id, id))
      .limit(1);

    if (result.length === 0) return undefined;

    const { pkg, trainer, user } = result[0];
    return {
      ...pkg,
      trainer,
      user,
    };
  }

  async updatePtSessionPackage(id: string, packageData: Partial<InsertPtSessionPackage>): Promise<void> {
    await db
      .update(ptSessionPackages)
      .set({
        ...packageData,
        updatedAt: new Date(),
      })
      .where(eq(ptSessionPackages.id, id));
  }

  // PT Session Attendance operations
  async createPtSessionAttendance(attendanceData: InsertPtSessionAttendance): Promise<PtSessionAttendance> {
    const [attendance] = await db.insert(ptSessionAttendance).values(attendanceData).returning();
    return attendance;
  }

  async getPackageAttendanceSessions(packageId: string): Promise<(PtSessionAttendance & { trainer: PersonalTrainer })[]> {
    const rows = await db
      .select({
        attendance: ptSessionAttendance,
        trainer: personalTrainers,
      })
      .from(ptSessionAttendance)
      .innerJoin(personalTrainers, eq(ptSessionAttendance.trainerId, personalTrainers.id))
      .where(eq(ptSessionAttendance.packageId, packageId))
      .orderBy(desc(ptSessionAttendance.sessionNumber));

    return rows.map(({ attendance, trainer }: { attendance: PtSessionAttendance; trainer: PersonalTrainer }) => ({
      ...attendance,
      trainer,
    }));
  }

  async getUserPtAttendanceSessions(userId: string): Promise<(PtSessionAttendance & { trainer: PersonalTrainer; package: PtSessionPackage })[]> {
    const rows = await db
      .select({
        attendance: ptSessionAttendance,
        trainer: personalTrainers,
        pkg: ptSessionPackages,
      })
      .from(ptSessionAttendance)
      .innerJoin(personalTrainers, eq(ptSessionAttendance.trainerId, personalTrainers.id))
      .innerJoin(ptSessionPackages, eq(ptSessionAttendance.packageId, ptSessionPackages.id))
      .where(eq(ptSessionAttendance.userId, userId))
      .orderBy(desc(ptSessionAttendance.sessionDate));

    return rows.map(({ attendance, trainer, pkg }: { attendance: PtSessionAttendance; trainer: PersonalTrainer; pkg: PtSessionPackage }) => ({
      ...attendance,
      trainer,
      package: pkg,
    }));
  }

  async getPtSessionAttendanceById(id: string): Promise<(PtSessionAttendance & { trainer: PersonalTrainer; user: User; package: PtSessionPackage }) | undefined> {
    const result = await db
      .select({
        attendance: ptSessionAttendance,
        trainer: personalTrainers,
        user: users,
        pkg: ptSessionPackages,
      })
      .from(ptSessionAttendance)
      .innerJoin(personalTrainers, eq(ptSessionAttendance.trainerId, personalTrainers.id))
      .innerJoin(users, eq(ptSessionAttendance.userId, users.id))
      .innerJoin(ptSessionPackages, eq(ptSessionAttendance.packageId, ptSessionPackages.id))
      .where(eq(ptSessionAttendance.id, id))
      .limit(1);

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      id: row.id,
      packageId: row.packageId,
      userId: row.userId,
      trainerId: row.trainerId,
      sessionDate: row.sessionDate,
      sessionNumber: row.sessionNumber,
      status: row.status,
      checkInTime: row.checkInTime,
      checkOutTime: row.checkOutTime,
      notes: row.notes,
      adminConfirmed: row.adminConfirmed,
      confirmedBy: row.confirmedBy,
      confirmedAt: row.confirmedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      trainer: row.trainer,
      user: row.user,
      package: row.package,
    };
  }

  async updatePtSessionAttendance(id: string, attendanceData: Partial<InsertPtSessionAttendance>): Promise<void> {
    await db
      .update(ptSessionAttendance)
      .set({
        ...attendanceData,
        updatedAt: new Date(),
      })
      .where(eq(ptSessionAttendance.id, id));
  }

  async confirmPtSessionAttendance(id: string, adminId: string): Promise<void> {
    await db
      .update(ptSessionAttendance)
      .set({
        adminConfirmed: true,
        confirmedBy: adminId,
        confirmedAt: new Date(),
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(ptSessionAttendance.id, id));
  }



  // Password Reset operations
  async createPasswordResetToken(email: string, token: string): Promise<PasswordResetToken> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now

    const [resetToken] = await db
      .insert(passwordResetTokens)
      .values({
        email,
        token,
        expiresAt,
        status: 'valid',
      })
      .returning();

    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);

    return resetToken;
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({
        status: 'used',
        usedAt: new Date(),
      })
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.status, 'valid')
      ));
  }

  async cleanupExpiredResetTokens(): Promise<number> {
    const now = new Date();

    const result = await db
      .update(passwordResetTokens)
      .set({ status: 'expired' })
      .where(and(
        eq(passwordResetTokens.status, 'valid'),
        lte(passwordResetTokens.expiresAt, now)
      ))
      .returning();

    return result.length;
  }

  async updateUserPassword(email: string, newPassword: string): Promise<void> {
    await db
      .update(users)
      .set({
        password: newPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.email, email));
  }

  async storeVerificationCode(email: string, code: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    await db
      .update(users)
      .set({
        verificationCode: code,
        verificationCodeExpiry: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(users.email, email));
  }

  async verifyEmailCode(email: string, code: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) return false;
    if (!user.verificationCode) return false;
    if (user.verificationCode !== code) return false;
    if (!user.verificationCodeExpiry) return false;
    if (new Date() > user.verificationCodeExpiry) return false;

    // Mark email as verified and clear verification code
    await db
      .update(users)
      .set({
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.email, email));

    return true;
  }

  // Notification operations
  async getUserNotifications(userId: string): Promise<Notification[]> {
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    return userNotifications;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();

    return newNotification;
  }

  async markNotificationAsRead(id: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.id, id),
        eq(notifications.userId, userId)
      ));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    await db
      .delete(notifications)
      .where(and(
        eq(notifications.id, id),
        eq(notifications.userId, userId)
      ));
  }

  // Push Subscription operations
  async getUserPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    return subscriptions;
  }

  async createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription> {
    const [existing] = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(pushSubscriptions)
        .set({
          p256dh: subscription.p256dh,
          auth: subscription.auth,
          userAgent: subscription.userAgent,
        })
        .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
        .returning();
      return updated;
    }

    const [newSubscription] = await db
      .insert(pushSubscriptions)
      .values(subscription)
      .returning();

    return newSubscription;
  }

  async deletePushSubscription(endpoint: string, userId: string): Promise<void> {
    await db
      .delete(pushSubscriptions)
      .where(and(
        eq(pushSubscriptions.endpoint, endpoint),
        eq(pushSubscriptions.userId, userId)
      ));
  }

  async getAllPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    return this.getUserPushSubscriptions(userId);
  }

  // Promotions operations
  async getAllPromotions(): Promise<Promotion[]> {
    return await db
      .select()
      .from(promotions)
      .orderBy(desc(promotions.sortOrder), desc(promotions.createdAt));
  }

  async getActivePromotions(): Promise<Promotion[]> {
    return await db
      .select()
      .from(promotions)
      .where(eq(promotions.isActive, true))
      .orderBy(desc(promotions.sortOrder), desc(promotions.createdAt));
  }

  async createPromotion(promo: InsertPromotion): Promise<Promotion> {
    const [row] = await db.insert(promotions).values(promo as any).returning();
    return row;
  }

  async updatePromotion(id: string, promo: Partial<InsertPromotion>): Promise<void> {
    await db.update(promotions).set({ ...promo, updatedAt: new Date() } as any).where(eq(promotions.id, id));
  }

  async deletePromotion(id: string): Promise<void> {
    await db.delete(promotions).where(eq(promotions.id, id));
  }

  // Inactive member operations
  async getInactiveMembers(daysInactive: number): Promise<(User & { membership: Membership & { plan: MembershipPlan } })[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    const usersWithMemberships = await db
      .select({
        user: users,
        membership: memberships,
        plan: membershipPlans,
      })
      .from(users)
      .innerJoin(memberships, eq(users.id, memberships.userId))
      .innerJoin(membershipPlans, eq(memberships.planId, membershipPlans.id))
      .where(and(
        eq(memberships.status, 'active'),
        eq(users.active, true)
      ));

    const inactiveMembers: (User & { membership: Membership & { plan: MembershipPlan } })[] = [];

    for (const item of usersWithMemberships) {
      const [recentCheckIn] = await db
        .select()
        .from(checkIns)
        .where(and(
          eq(checkIns.userId, item.user.id),
          gte(checkIns.checkInTime, cutoffDate)
        ))
        .limit(1);

      if (!recentCheckIn) {
        inactiveMembers.push({
          ...item.user,
          membership: {
            ...item.membership,
            plan: item.plan
          }
        });
      }
    }

    return inactiveMembers;
  }

  async sendInactivityReminders(daysInactive: number): Promise<number> {
    const inactiveMembers = await this.getInactiveMembers(daysInactive);
    let reminderCount = 0;

    for (const member of inactiveMembers) {
      // Create in-app notification
      await this.createNotification({
        userId: member.id,
        title: 'Reminder Gym 💪',
        message: 'Ayo nge-gym lagi! Jangan tunggu nanti — mulai hari ini! 💪',
        type: 'inactivity_reminder',
        relatedId: member.membership.id,
      });

      // Send email reminder
      try {
        const memberName = member.firstName || member.username;
        if (member.email) {
          await sendInactivityReminderEmail(member.email, memberName, daysInactive);
          console.log(`Inactivity reminder email sent to ${member.email} `);
        }
      } catch (error) {
        console.error(`Failed to send email reminder to ${member.email}: `, error);
        // Continue with other members even if one email fails
      }

      reminderCount++;
    }

    return reminderCount;
  }

  async validateOneTimeQrCode(qrCode: string): Promise<{ userId: string; status: string; expiresAt: Date; user: User; membership?: Membership } | undefined> {
    return undefined;
  }

  async markQrCodeAsUsed(qrCode: string): Promise<void> {
    return;
  }

  // Audit Log operations
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  async getAuditLogs(limit: number = 100, offset: number = 0, branch?: string, search?: string): Promise<(AuditLog & { user: User })[]> {
    const conditions = [];
    if (branch) {
      conditions.push(eq(auditLogs.branch, branch));
    }
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      conditions.push(or(
        ilike(auditLogs.action, searchLower),
        ilike(auditLogs.details, searchLower),
        ilike(users.firstName, searchLower),
        ilike(users.lastName, searchLower),
        ilike(users.email, searchLower)
      ));
    }

    const logs = await db
      .select()
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return logs.map((row: any) => ({
      ...row.audit_logs,
      user: row.users || { firstName: 'Unknown', lastName: 'User', email: 'unknown' },
    }));
  }

  async getAdmins(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(or(eq(users.role, 'admin'), eq(users.role, 'super_admin')))
      .orderBy(desc(users.createdAt));
  }
}

export const storage = new DatabaseStorage();
