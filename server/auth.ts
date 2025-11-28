import type { Express } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import type { Request } from 'express';
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { User } from "../shared/schema";
import connectPgSimple from "connect-pg-simple";
import { env } from "./config/index";

const PgSession = connectPgSimple(session);

const isAuthDebugEnabled = () => Boolean(env.auth.debugFlag) || env.isDevelopment;

export async function setupAuth(app: Express) {
  // Require SESSION_SECRET in production for security
  const sessionSecret = env.auth.sessionSecret;

  if (!sessionSecret) {
    if (env.isProduction) {
      throw new Error("SESSION_SECRET environment variable is required in production for secure session management");
    }
    console.warn("⚠️  WARNING: Using default SESSION_SECRET in development. Set SESSION_SECRET env var for production!");
  }

  // Respect proxy (e.g., when behind Render/Heroku/Nginx) so secure cookies aren't stripped
  if (env.auth.trustProxy || env.isProduction) {
    // Only set if not already set by caller
    if (!app.get('trust proxy')) {
      app.set('trust proxy', 1);
    }
  }

  // Resolve environment and cookie flags
  const resolvedNodeEnv = env.nodeEnv || (app.get('env') as string) || 'development';
  const cookieSecure = (() => {
    if (typeof env.auth.cookieSecure === 'string') {
      return env.auth.cookieSecure === 'true';
    }
    return resolvedNodeEnv === 'production';
  })();
  const cookieSameSite: any = env.auth.cookieSameSite || 'lax';
  const authDebugEnabled = isAuthDebugEnabled();

  // Session setup
  let sessionStore: session.Store | undefined;

  if (env.databaseUrl) {
    sessionStore = new PgSession({
      conString: env.databaseUrl,
      tableName: "sessions",
      createTableIfMissing: !env.isProduction,
    });
  } else {
    console.warn("[auth] DATABASE_URL not set. Falling back to default in-memory session store; sessions will reset on restart.");
  }

  const sessionMiddleware = session({
    name: 'sid',
    store: sessionStore,
    secret: sessionSecret || "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: cookieSecure,
      // Set via env COOKIE_SAME_SITE=none for cross-origin HTTPS setups
      sameSite: cookieSameSite,
    },
  });

  // Middleware to log Set-Cookie diagnostics (dev / AUTH_DEBUG)
  app.use((req, res, next) => {
    const writeHead = res.writeHead;
    (res as any).writeHead = function (...args: any[]) {
      if (authDebugEnabled && req.path === '/api/login') {
        const setCookie = res.getHeader('Set-Cookie');
        console.warn('[AUTH_DEBUG] Response Set-Cookie just before send:', setCookie);
      }
      return (writeHead as any).apply(res, args as any);
    } as any;
    next();
  });

  app.use((req, _res, next) => {
    if (authDebugEnabled && req.method === 'POST' && req.path === '/api/login') {
      console.warn('[AUTH_DEBUG] Incoming login request cookies:', req.headers.cookie);
    }
    next();
  });

  app.use(sessionMiddleware);

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy - supports login with email, phone, or username
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Try to find user by username, email, or phone
        const user = await storage.getUserByEmailOrPhoneOrUsername(username);

        if (!user) {
          return done(null, false, { message: "Email/Nomor Telepon/Username atau password salah" });
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
          return done(null, false, { message: "Email/Nomor Telepon/Username atau password salah" });
        }

        // Check if email is verified (skip for admin and super_admin users)
        if (user.role !== 'admin' && user.role !== 'super_admin' && !user.emailVerified) {
          return done(null, false, { message: "Email belum diverifikasi. Silakan cek email Anda untuk kode verifikasi" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  // Optional verbose diagnostics in development or when AUTH_DEBUG=1
  if (isAuthDebugEnabled()) {
    const cookieHeader = req.headers?.cookie;
    console.warn('[AUTH] Unauthorized request:', {
      path: req.path,
      method: req.method,
      hasSession: Boolean((req as any).session),
      sessionID: (req as any).sessionID,
      cookiePresent: Boolean(cookieHeader),
      cookieHeader,
    });
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to check if user is admin
export function isAdmin(req: any, res: any, next: any) {
  const userRole = req.user?.role;
  if (req.isAuthenticated() && (userRole === 'admin' || userRole === 'super_admin')) {
    return next();
  }
  res.status(403).json({ message: "Admin access required" });
}

// Middleware to check if user is super admin
export function requireSuperAdmin(req: any, res: any, next: any) {
  if (req.isAuthenticated() && req.user?.role === 'super_admin') {
    return next();
  }
  res.status(403).json({ message: "Super Admin access required" });
}

// Helper to log admin activity
export async function logActivity(
  userId: string | undefined,
  action: string,
  details: any,
  req?: any,
  entityId?: string,
  entityType?: string
) {
  try {
    if (!userId) return;

    const user = await storage.getUser(userId);
    const branch = user?.homeBranch || null;

    let ipAddress = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress;
    if (Array.isArray(ipAddress)) ipAddress = ipAddress[0];

    const userAgent = req?.headers?.['user-agent'];

    await storage.createAuditLog({
      userId,
      action,
      entityId,
      entityType,
      details,
      ipAddress,
      userAgent,
      branch,
    });
  } catch (error) {
    console.error('[Audit Log] Failed to create log:', error);
  }
}
