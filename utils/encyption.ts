import config from "../config/app.config";
import CryptoJS from "crypto-js";

// ==================================================
// Types and Interfaces
// ==================================================

/**
 * Encryption service interface
 */
export interface IEncryptionService {
  encrypt(text: string): string;
  decrypt(encryptedText: string): string;
  hash(text: string): string;
  verify(text: string, hash: string): boolean;
}

// ==================================================
// Constants
// ==================================================

const SECRET_KEY = config.encryption.secretKey;

// Validate secret key
if (!SECRET_KEY || SECRET_KEY.length < 32) {
  throw new Error(
    "SECRET_KEY must be at least 32 bytes long and set in the environment variables."
  );
}

// ==================================================
// Encryption Service Implementation
// ==================================================

/**
 * AES encryption service
 */
const AES: IEncryptionService = {
  /**
   * Encrypt text using AES
   * @param text - Text to encrypt
   * @returns Encrypted text
   */
  encrypt: (text: string): string => {
    try {
      if (!text) {
        throw new Error("Text to encrypt cannot be empty");
      }
      return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
    } catch (error) {
      console.error("Encryption error:", error);
      throw new Error("Failed to encrypt text");
    }
  },

  /**
   * Decrypt text using AES
   * @param encryptedText - Text to decrypt
   * @returns Decrypted text
   */
  decrypt: (encryptedText: string): string => {
    try {
      if (!encryptedText) {
        throw new Error("Encrypted text cannot be empty");
      }
      const bytes = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY);
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedText) {
        throw new Error("Decryption failed - invalid key or corrupted data");
      }
      
      return decryptedText;
    } catch (error) {
      console.error("Decryption error:", error);
      throw new Error("Failed to decrypt text");
    }
  },

  /**
   * Hash text using SHA-256
   * @param text - Text to hash
   * @returns Hashed text
   */
  hash: (text: string): string => {
    try {
      if (!text) {
        throw new Error("Text to hash cannot be empty");
      }
      return CryptoJS.SHA256(text).toString();
    } catch (error) {
      console.error("Hashing error:", error);
      throw new Error("Failed to hash text");
    }
  },

  /**
   * Verify text against a hash
   * @param text - Text to verify
   * @param hash - Hash to verify against
   * @returns True if text matches hash, false otherwise
   */
  verify: (text: string, hash: string): boolean => {
    try {
      if (!text || !hash) {
        throw new Error("Text and hash cannot be empty");
      }
      const textHash = CryptoJS.SHA256(text).toString();
      return textHash === hash;
    } catch (error) {
      console.error("Verification error:", error);
      throw new Error("Failed to verify text against hash");
    }
  }
};

export default AES;
