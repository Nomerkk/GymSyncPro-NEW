import express from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import path from 'path';

// Use a separate variable for project root to avoid redeclaring Node's built-in __dirname.
const projectRoot = process.cwd();

const app = express();
// Enable gzip compression for all responses (production and dev)
app.use(compression({ level: 6 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Serve uploaded files statically with reasonable caching
app.use('/uploads', express.static(path.join(projectRoot, 'uploads'), {
    maxAge: '7d',
    immutable: false,
}));

// Logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
            if (capturedJsonResponse) {
                logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
            }

            if (logLine.length > 80) {
                logLine = logLine.slice(0, 79) + "…";
            }

            console.log(logLine); // Changed from log(logLine) to console.log to avoid dependency on vite.ts
        }
    });

    next();
});

const registerRoutesPromise = registerRoutes(app);

export { app, registerRoutesPromise };
