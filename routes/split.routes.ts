import express, { Router } from "express";
import {
  createSplit,
  getSplitById,
  getSplitsByCreator,
  getSplitsByParticipant,
} from "../controller/split.controller";
import verifyToken from "../middleware/auth.middleware";

/**
 * Split Routes
 *
 * Defines routes for split operations.
 */

// ==================================================
// Route Configuration
// ==================================================

const router: Router = express.Router();

// All routes require authentication
router.use(verifyToken);

// ==================================================
// Route Definitions
// ==================================================

/**
 * @route   POST /api/split/create
 * @desc    Create a new split
 * @access  Private (requires authentication)
 */
router.post("/create", createSplit);

/**
 * @route   GET /api/split/:splitId
 * @desc    Get split by ID
 * @access  Private (requires authentication)
 */
router.get("/:splitId", getSplitById);

/**
 * @route   GET /api/split/creator
 * @desc    Get splits created by the authenticated user
 * @access  Private (requires authentication)
 */
router.get("/creator", getSplitsByCreator);

/**
 * @route   GET /api/split/participant
 * @desc    Get splits where the authenticated user is a participant
 * @access  Private (requires authentication)
 */
router.get("/participant", getSplitsByParticipant);

// ==================================================
// Exports
// ==================================================

export { router as splitRouter };
