import express, { Router } from "express";
import { authHook } from "../controller/auth.controller";
import verifyToken from "../middleware/auth.middleware";

/**
 * Auth Routes
 *
 * Defines routes for authentication and user verification.
 */

// ==================================================
// Route Configuration
// ==================================================

const router: Router = express.Router();

// ==================================================
// Route Definitions
// ==================================================

/**
 * @route   POST /api/auth/hook
 * @desc    Authentication hook for user verification
 * @access  Public
 */
router.post("/hook", authHook);

// ==================================================
// Exports
// ==================================================

export { router as authRouter };
