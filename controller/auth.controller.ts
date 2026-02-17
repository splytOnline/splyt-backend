import { Request, Response, NextFunction } from "express";
import authService from "../services/auth/auth.service";
import { ResponseType } from "../types/response";
/**
 * Auth Controller
 * 
 * Handles authentication requests and user verification.
 */

// ==================================================
// Types and Interfaces
// ==================================================


interface AuthError extends Error {
  status?: number;
  code?: string;
}


// ==================================================
// Auth Controller
// ==================================================

/**
 * Authentication hook middleware
 * Verifies user token and creates/updates user
 */
const authHook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { body } = req;
    const { walletAddress, signature } = body;
    //if email or password is not provided, return error
    if(!signature || !walletAddress){
      res.status(400).json({
        success:false,
        status:400,
        message:"Signature and Wallet address are required"
      });
      return;
    }


    const token = await authService.verifyCredentials(walletAddress, signature);
    res.status(200).json({
      success:true,
      status:200,
      message:"User verified successfully",
      data:token
    });
  }
  catch(error){
    next(error);
  }
}

  
  export { authHook };