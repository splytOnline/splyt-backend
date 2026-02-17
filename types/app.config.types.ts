export interface ServerConfig {
    port: number;
    env: string;
    apiVersion: string;
    corsOrigins: string[];
  }
  
  export interface JWTConfig {
    secret: string | undefined;
    validity: string;
  }
  
  export interface DatabaseConfig {
    uri: string; 
    options: {
      useNewUrlParser: boolean;
      useUnifiedTopology: boolean;
    };
  }
  

  
  export interface SecurityConfig {
    bcryptSaltRounds: number;
    rateLimiting: {
      windowMs: number;
      max: number;
    };
  }
  
  export interface LoggingConfig {
    level: string;
    filename: string;
  }

  
  export interface EncryptionConfig {
    secretKey: string | undefined;
    ivLength: number;
  }


  export interface PDFConfig {
    pdfDir: string;
    certificate_sign_password: string | undefined;
  }
  
  export interface AppConfig {
    server: ServerConfig;
    jwt: JWTConfig;
    database: DatabaseConfig;
    security: SecurityConfig;
    logging: LoggingConfig;
    encryption: EncryptionConfig;
    pdf: PDFConfig;
  }