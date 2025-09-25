import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertMembershipPlanSchema, insertGymClassSchema, insertClassBookingSchema, insertCheckInSchema, insertPaymentSchema } from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";

// Make Stripe optional - can be added later
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Member routes
  app.get('/api/member/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const [membership, checkIns, classBookings, payments] = await Promise.all([
        storage.getUserMembership(userId),
        storage.getUserCheckIns(userId, 10),
        storage.getUserClassBookings(userId),
        storage.getUserPayments(userId),
      ]);

      // Calculate stats
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyCheckIns = checkIns.filter(checkIn => checkIn.checkInTime >= thisMonth).length;
      
      const upcomingClasses = classBookings.filter(booking => 
        booking.status === 'booked' && booking.bookingDate > now
      );

      res.json({
        membership,
        checkIns,
        classBookings: upcomingClasses,
        payments: payments.slice(0, 5), // Recent payments
        stats: {
          monthlyCheckIns,
          upcomingClasses: upcomingClasses.length,
        }
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Check-in routes
  app.post('/api/checkin/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const qrCode = randomUUID();
      
      const checkIn = await storage.createCheckIn({
        userId,
        qrCode,
        status: 'active',
      });

      res.json({ checkIn, qrCode });
    } catch (error) {
      console.error("Error generating check-in:", error);
      res.status(500).json({ message: "Failed to generate check-in" });
    }
  });

  app.post('/api/checkin/:id/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.updateCheckOut(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error checking out:", error);
      res.status(500).json({ message: "Failed to check out" });
    }
  });

  // Class routes
  app.get('/api/classes', isAuthenticated, async (req, res) => {
    try {
      const classes = await storage.getGymClasses();
      res.json(classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.post('/api/classes/:classId/book', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { classId } = req.params;
      const { bookingDate } = req.body;

      const booking = await storage.bookClass({
        userId,
        classId,
        bookingDate: new Date(bookingDate),
        status: 'booked',
      });

      res.json(booking);
    } catch (error) {
      console.error("Error booking class:", error);
      res.status(500).json({ message: "Failed to book class" });
    }
  });

  // Payment routes
  app.get('/api/membership-plans', async (req, res) => {
    try {
      const plans = await storage.getMembershipPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching membership plans:", error);
      res.status(500).json({ message: "Failed to fetch membership plans" });
    }
  });

  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(501).json({ 
          message: 'Payment gateway not configured. Please contact administrator.' 
        });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { planId } = req.body;

      if (!user?.email) {
        return res.status(400).json({ message: 'User email required' });
      }

      let customerId = user.stripeCustomerId;

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        });
        customerId = customer.id;
      }

      // Get membership plan
      const plans = await storage.getMembershipPlans();
      const plan = plans.find(p => p.id === planId);
      if (!plan || !plan.stripePriceId) {
        return res.status(400).json({ message: 'Invalid membership plan' });
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: plan.stripePriceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with Stripe info
      await storage.updateUserStripeInfo(userId, customerId, subscription.id);

      // Create membership record
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.durationMonths);

      await storage.createMembership({
        userId,
        planId,
        startDate,
        endDate,
        status: 'active',
        autoRenewal: true,
      });

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Admin routes
  app.get('/api/admin/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const [users, revenue, membershipStats] = await Promise.all([
        storage.getUsersWithMemberships(),
        storage.getRevenueStats(),
        storage.getMembershipStats(),
      ]);

      // Calculate active members today (simplified - users with recent check-ins)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeToday = 0; // This would need a more complex query

      res.json({
        users,
        stats: {
          totalMembers: users.length,
          activeToday,
          expiringSoon: membershipStats.expiringSoon,
          revenue,
        }
      });
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ message: "Failed to fetch admin dashboard" });
    }
  });

  app.get('/api/admin/members', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const members = await storage.getUsersWithMemberships();
      res.json(members);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.post('/api/admin/membership-plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const validatedData = insertMembershipPlanSchema.parse(req.body);
      const plan = await storage.createMembershipPlan(validatedData);
      res.json(plan);
    } catch (error) {
      console.error("Error creating membership plan:", error);
      res.status(500).json({ message: "Failed to create membership plan" });
    }
  });

  app.post('/api/admin/classes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const validatedData = insertGymClassSchema.parse(req.body);
      const gymClass = await storage.createGymClass(validatedData);
      res.json(gymClass);
    } catch (error) {
      console.error("Error creating class:", error);
      res.status(500).json({ message: "Failed to create class" });
    }
  });

  // Notification check for expiring memberships
  app.get('/api/notifications/expiring', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const expiring = await storage.getExpiringMemberships(20);
      
      // For members, only return their own expiring membership
      if (user?.role !== 'admin') {
        const userExpiring = expiring.filter(membership => membership.userId === userId);
        return res.json(userExpiring);
      }
      
      // For admins, return all expiring memberships
      res.json(expiring);
    } catch (error) {
      console.error("Error fetching expiring memberships:", error);
      res.status(500).json({ message: "Failed to fetch expiring memberships" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
