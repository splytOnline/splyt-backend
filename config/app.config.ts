// config/app.config.ts
import dotenv from "dotenv";
import { AppConfig } from "../types/app.config.types";

dotenv.config();

const config: AppConfig = {
  // Server Configuration
  server: {
    port: Number(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || "development",
    apiVersion: process.env.API_VERSION || "v1.0.0",
    corsOrigins: process.env.CORS_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
  },

  pdf: {
    pdfDir: process.env.PDF_DIR || "uploads/cfr/pdfs",
    certificate_sign_password: process.env.CERTIFICATE_SIGN_PASSWORD,
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    validity: process.env.JWT_VALIDITY || "24h",
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/your_db",
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },



  // Security Configuration
  security: {
    bcryptSaltRounds: 10,
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || "info",
    filename: "app.log",
  },


  // AES Configuration
  encryption: {
    secretKey: process.env.AES_SECRET,
    ivLength: 16,
  },

  // Blockchain Configuration
  blockchain: {
    splitFactoryContractAddress: process.env.SPLIT_FACTORY_CONTRACT_ADDRESS,
    gasPayerAddress: process.env.GAS_PAYER_ADDRESS,
    gasPayerKey: process.env.GAS_PAYER_KEY,
    rpc: process.env.RPC,
  },
};

// Validation function to ensure required environment variables are set
export const validateConfig = (): void => {
  const requiredEnvVars = [
    "JWT_SECRET",
    "MONGODB_URI",
    "AES_SECRET",
    "PORT",
    "NODE_ENV",
    "CORS_ORIGINS",
    "LOG_LEVEL",
    "API_VERSION",
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar],
  );

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(", ")}`,
    );
  }
  
  console.log('✅ Configuration validated successfully');
};

// Freeze the configuration object to prevent modifications
export default Object.freeze(config);