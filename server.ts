/**
 * Frontend API Server - Main Application Entry Point
 * 
 * This file sets up the Express server for the frontend API with all necessary middleware,
 * routes, WebSocket support, and error handling.
 */

// ==================================================
// Imports
// ==================================================

// Core dependencies
import express, { Express, Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';

// Security and middleware
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// System utilities
import os from 'os';

// Application configuration
import config from "./config/app.config";

// Custom middleware
import errorHandler from './middleware/error.middleware';
import verifyToken from './middleware/auth.middleware';

// Type definitions
import { ServerMetrics, HealthCheckResponse, RouteInfo } from './types/server.types';

// Routes
import { authRouter } from './routes/auth.routes';
import { splitRouter } from './routes/split.routes';

// ==================================================
// Frontend Server Setup Class
// ==================================================

/**
 * FrontendServerSetup class handles the initialization and configuration
 * of the Express server for frontend API, including middleware, routes, and WebSocket.
 */
export class ServerSetup {
  // Public properties
  public app: Express;
  
  // Private properties
  private httpServer: any;
  private io: Server;
  private readonly PORT: number = config.server.port;

  /**
   * Constructor initializes the Express app, HTTP server, and Socket.IO
   */
  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new Server(this.httpServer, {
      cors: {
        origin: config.server.corsOrigins,
        methods: ["GET", "POST", "PUT"],
        allowedHeaders: ["Content-Type", "socket-id", "Authorization"],
      },
    });
  }

  /**
   * Gets the port number for the frontend server
   */
  public getPort(): number {
    return this.PORT;
  }

  // ==================================================
  // Middleware Setup
  // ==================================================

  /**
   * Sets up all middleware for the Express application
   * Order is important: security first, then parsing, then routes
   */
  private setupMiddleware(): void {
    // Trust proxy for secure connections
    this.app.set('trust proxy', 1);
    
    // Security Middleware
    this.app.use(helmet());
    this.app.use(cors({ origin: config.server.corsOrigins, credentials: true }));

    // Rate Limiting
    if (process.env.NODE_ENV === 'production') {
      const limiter = rateLimit({
        windowMs: config.security.rateLimiting.windowMs,
        max: config.security.rateLimiting.max
      });
      this.app.use(limiter);
    }

    // Logging Middleware (development only)
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    }

    // Body Parser Middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  // ==================================================
  // WebSocket Setup
  // ==================================================

  /**
   * Configures Socket.IO for real-time communication
   */
  private setupWebSocket(): void {
    this.io.on('connection', (socket) => {
      console.log(`✅ New Frontend WebSocket Connection: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`❌ Frontend User Disconnected: ${socket.id}`);
      });
    });
  }

  // ==================================================
  // Route Setup
  // ==================================================

  /**
   * Sets up all routes for the frontend API
   * Separates public and protected routes
   */
  private setupRoutes(): void {
    // API version prefix
    const apiPrefix = `api/${config.server.apiVersion}`;

    // Public routes (no auth required)
    this.app.get('/health', this.healthCheck.bind(this));
    this.app.get('/list', this.listRoutes.bind(this));
    this.app.use(`/${apiPrefix}/auth`, authRouter);
    
    // Protected routes (auth required)
    this.app.use(`/${apiPrefix}/split`, splitRouter);
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    });
  }

  // ==================================================
  // Utility Methods
  // ==================================================

  /**
   * Measures database latency by pinging the database
   * @returns Promise with latency in milliseconds or null if not connected
   */
  private async measureDbLatency(): Promise<number | null> {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) return null;
    const start = Date.now();
    await mongoose.connection.db.admin().ping();
    return Date.now() - start;
  }

  /**
   * Health check endpoint handler
   * Provides server status, database connection, and system metrics
   */
  private async healthCheck(req: Request, res: Response): Promise<void> {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const sm: ServerMetrics = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage().rss / (1024 * 1024),
      cpuUsage: os.loadavg(),
    };

    const response: HealthCheckResponse = {
      success: true,
      message: 'Admin API Server is running',
      environment: config.server.env,
      timestamp: new Date().toISOString(),
      version: config.server.apiVersion,
      server: sm,
      database: {
        database: "MongoDB",
        dbVersion: mongoose.version,
        status: dbStatus,
        latency: await this.measureDbLatency(),
      },
      node: {
        version: process.version,
        npm_package_version: process.env.npm_package_version || 'unknown',
      }
    };

    res.json(response);
  }

  /**
   * Lists all available API routes
   * Useful for documentation and debugging
   */
  private listRoutes(req: Request, res: Response): void {
    const routes: RouteInfo[] = [];

    this.app._router.stack.forEach((middleware: any) => {
      if (middleware.route) {
        const { path } = middleware.route;
        const method = Object.keys(middleware.route.methods)[0].toUpperCase();
        routes.push({ method, path });
      } else if (middleware.name === 'router') {
        const basePath = middleware.regexp
          .toString()
          .replace(/^\/\^\\/, '')
          .replace(/\\\/\?\(\?=\\\/\|\$\)\/\$/, '')
          .replace(/\\/g, '')
          .replace(/\?.*/, '');

        middleware.handle.stack.forEach((handler: any) => {
          if (handler.route) {
            const { path } = handler.route;
            const method = Object.keys(handler.route.methods)[0].toUpperCase();
            const fullPath = `${basePath}${path}`.replace('//', '/');
            routes.push({ method, path: fullPath });
          }
        });
      }
    });

    res.status(200).json({
      success: true,
      message: 'Available Frontend API Routes',
      routes,
    });
  }

  // ==================================================
  // Server Startup
  // ==================================================

  /**
   * Starts the frontend API server with all configured middleware and routes
   * This is the main entry point for the frontend API
   */
  public async start(): Promise<void> {
    try {
      // Setup all components
      this.setupMiddleware();
      this.setupWebSocket();
      this.setupRoutes();

      // Error Handler Middleware (should be last)
      this.app.use(errorHandler);

      // Start the server
      this.httpServer.listen(this.PORT, '0.0.0.0', () => {
        console.log(`
==================================================
🚀 API SERVER STARTED SUCCESSFULLY
==================================================
📡 Mode:      ${config.server.env}
🔌 Port:      ${this.PORT}
🌐 API:       ${config.server.apiVersion}
📊 Memory:    ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
==================================================
        `);
      });
    } catch (error) {
      console.error('❌ Failed to start frontend API server:', 
        error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }
}

// ==================================================
// Frontend API Server Initialization
// ==================================================

// Create frontend server instance
const server = new ServerSetup();

export default server;
