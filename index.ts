/**
 * Real World Asset Tokenization Backend - Main Application Entry Point
 * 
 * This file manages the frontend API server, handling its
 * initialization, startup, and graceful shutdown.
 */

// ==================================================
// Imports
// ==================================================

// Core dependencies
import { ServerSetup } from './server';
import { connectDB, closeDB } from "./config/database.config";
import config, { validateConfig } from "./config/app.config";

// ==================================================
// Server Manager Class
// ==================================================

/**
 * ServerManager class handles the initialization and management
 * of the frontend API server.
 */
class ServerManager {
  private server: ServerSetup;
  private isShuttingDown: boolean = false;

  constructor() {
    this.server = new ServerSetup();
  }

  /**
   * Sets up process handlers for graceful shutdown
   * Handles SIGTERM, SIGINT, and uncaught exceptions
   */
  private setupProcessHandlers(): void {
    const shutdown = async () => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;
      
      console.log('🛑 Initiating graceful shutdown...');
      try {
        console.log('📡 Closing MongoDB connection...');
        await closeDB();
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      shutdown();
    });
    process.on('unhandledRejection', (error) => {
      console.error('❌ Unhandled Rejection:', error);
      shutdown();
    });
  }

  /**
   * Starts the frontend API server
   * This is the main entry point for the application
   */
  public async start(): Promise<void> {
    try {
      // Validate configuration
      validateConfig();
      
      // Setup process handlers
      this.setupProcessHandlers();

      // Connect to database
      console.log('📡 Connecting to MongoDB...');
      await connectDB();

      // Start frontend server
      await this.server.start();

    } catch (error) {
      console.error('❌ Failed to start server:', 
        error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }
}

// ==================================================
// Application Initialization
// ==================================================

// Create and start server manager
const serverManager = new ServerManager();
serverManager.start();

export default serverManager;