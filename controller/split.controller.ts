import { Request, Response, NextFunction } from "express";
import splitService from "../services/split/split.service";
import { CustomError, ErrorCode } from "../types/error.types";

/**
 * Split Controller
 * 
 * Handles split-related requests and operations.
 */

// ==================================================
// Types and Interfaces
// ==================================================

interface CreateSplitRequest extends Request {
  user?: {
    walletAddress: string;
    displayName: string;
    userId: string;
  };
  body: {
    description: string;
    totalAmount: number;
    participants: Array<{
      walletAddress: string;
      name?: string;
      amountDue: number;
    }>;
  };
}

// ==================================================
// Split Controllers
// ==================================================

/**
 * Create a new split
 * @route POST /api/split/create
 * @access Private (requires authentication)
 */
const createSplit = async (
  req: CreateSplitRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Verify user is authenticated
    if (!req.user) {
      const error: CustomError = new Error('User not authenticated');
      error.status = 401;
      error.errorCode = ErrorCode.UNAUTHORIZED;
      error.color = 'red';
      return next(error);
    }

    const {
      description,
      totalAmount,
      participants,
    } = req.body;

    // Validate required fields
    if (
      !description ||
      totalAmount === undefined ||
      !participants ||
      participants.length === 0
    ) {
      res.status(400).json({
        success: false,
        status: 400,
        message: "Missing required fields: description, totalAmount, and participants are required",
      });
      return;
    }

    // Create split using service (all blockchain mocking happens in service)
    const result = await splitService.createSplit(req.user.walletAddress, {
      description,
      totalAmount,
      participants,
    });

    res.status(201).json({
      success: true,
      status: 201,
      message: "Split created successfully",
      data: {
        splitId: result.splitId,
        contractAddress: result.contractAddress,
        txHash: result.txHash,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get split by ID
 * @route GET /api/split/:splitId
 * @access Private (requires authentication)
 */
const getSplitById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const splitIdParam = req.params.splitId;
    
    // Handle case where splitId might be an array
    const splitIdStr = Array.isArray(splitIdParam) ? splitIdParam[0] : splitIdParam;
    
    if (!splitIdStr) {
      res.status(400).json({
        success: false,
        status: 400,
        message: "Split ID is required",
      });
      return;
    }

    const splitId = parseInt(splitIdStr, 10);

    if (isNaN(splitId)) {
      res.status(400).json({
        success: false,
        status: 400,
        message: "Invalid split ID",
      });
      return;
    }

    const split = await splitService.getSplitById(splitId);

    if (!split) {
      res.status(404).json({
        success: false,
        status: 404,
        message: "Split not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      status: 200,
      message: "Split retrieved successfully",
      data: split,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get splits by creator
 * @route GET /api/split/creator
 * @access Private (requires authentication)
 */
const getSplitsByCreator = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      const error: CustomError = new Error('User not authenticated');
      error.status = 401;
      error.errorCode = ErrorCode.UNAUTHORIZED;
      error.color = 'red';
      return next(error);
    }

    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : undefined;

    const splits = await splitService.getSplitsByCreator(req.user.walletAddress, {
      status,
      limit,
      skip,
    });

    res.status(200).json({
      success: true,
      status: 200,
      message: "Splits retrieved successfully",
      data: splits,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get splits where user is a participant
 * @route GET /api/split/participant
 * @access Private (requires authentication)
 */
const getSplitsByParticipant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      const error: CustomError = new Error('User not authenticated');
      error.status = 401;
      error.errorCode = ErrorCode.UNAUTHORIZED;
      error.color = 'red';
      return next(error);
    }

    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : undefined;

    const splits = await splitService.getSplitsByParticipant(req.user.walletAddress, {
      status,
      limit,
      skip,
    });

    res.status(200).json({
      success: true,
      status: 200,
      message: "Splits retrieved successfully",
      data: splits,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all splits for authenticated user (created and participated)
 * @route GET /api/split
 * @access Private (requires authentication)
 */
const getSplits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      const error: CustomError = new Error('User not authenticated');
      error.status = 401;
      error.errorCode = ErrorCode.UNAUTHORIZED;
      error.color = 'red';
      return next(error);
    }

    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : undefined;

    const splits = await splitService.getSplits(req.user.walletAddress, {
      status,
      limit,
      skip,
    });

    res.status(200).json({
      success: true,
      status: 200,
      message: "Splits retrieved successfully",
      data: splits,
    });
  } catch (error) {
    next(error);
  }
};

export {
  createSplit,
  getSplitById,
  getSplits,
  getSplitsByCreator,
  getSplitsByParticipant,
};
