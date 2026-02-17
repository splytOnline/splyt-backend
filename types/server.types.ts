// types/server.types.ts
import { Express } from 'express';
import { Server } from 'socket.io';

export interface ServerMetrics {
  uptime: number;
  memoryUsage: number;
  cpuUsage: number[];
}

export interface HealthCheckResponse {
  success: boolean;
  message: string;
  environment: string;
  timestamp: string;
  version: string;
  server: ServerMetrics;
  database: {
    database: string;
    dbVersion: string;
    status: string;
    latency: number | null;
  }
  node:{
    version: string;
    npm_package_version: string;
  }
}

export interface RouteInfo {
  method: string;
  path: string;
}

export interface ServerInstance {
  app: Express;
  httpServer: any;
  io: Server;
}