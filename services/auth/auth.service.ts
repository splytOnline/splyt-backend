import jwt from "jsonwebtoken";
import { ethers } from "ethers";
import config from "../../config/app.config";
import usersModel from "../../models/users.model";
import { generateNameFromAddress } from "../../utils/names";

class AuthService {
    private readonly MESSAGE_TO_SIGN = `Welcome to Splyt!

Sign this message to authenticate and access your account.

This signature proves you own this wallet and allows secure access to your Splyt account.

Platform: Splyt - Split Bills, Settle Instantly`

    /**
     * Validates Ethereum signature for the message "Lorem Ipsum"
     * @param walletAddress - The wallet address that signed the message
     * @param signature - The signature to validate
     * @returns Object containing walletAddress, displayName, and JWT token
     */
    public async verifyCredentials(walletAddress: string, signature: string): Promise<{
        walletAddress: string;
        displayName: string;
        token: string;
    }> {
        try {
            // Validate inputs
            if (!walletAddress || !signature) {
                throw new Error("Wallet address and signature are required");
            }

            // Normalize wallet address to lowercase
            const normalizedAddress = walletAddress.toLowerCase();

            // Validate wallet address format
            if (!/^0x[a-fA-F0-9]{40}$/.test(normalizedAddress)) {
                throw new Error("Invalid wallet address format");
            }

            // Validate signature format (should be 132 characters: 0x + 130 hex chars)
            if (!/^0x[a-fA-F0-9]{130}$/.test(signature)) {
                throw new Error("Invalid signature format");
            }

            // Verify the signature
            const isValidSignature = this.verifySignature(
                this.MESSAGE_TO_SIGN,
                signature,
                normalizedAddress
            );

            if (!isValidSignature) {
                throw new Error("Invalid signature: Signature does not match the wallet address");
            }

            // Find user in database
            let user = await usersModel.findByWallet(normalizedAddress);

            // If user doesn't exist, create a new one with generated name
            if (!user) {
                const displayName = generateNameFromAddress(normalizedAddress);
                
                user = await usersModel.create({
                    walletAddress: normalizedAddress,
                    displayName: displayName,
                    totalSplitsCreated: 0,
                    totalSplitsJoined: 0,
                    totalAmountSplit: 0
                });
            }

            // Create JWT token that never expires
            // Using a very large expiration (100 years in seconds) to effectively make it never expire
            // 100 years ≈ 3,153,600,000 seconds
            const NEVER_EXPIRE_SECONDS = 100 * 365 * 24 * 60 * 60; // 3,153,600,000 seconds
            const token = jwt.sign(
                {
                    walletAddress: user.walletAddress,
                    displayName: user.displayName,
                    userId: user._id.toString()
                },
                config.jwt.secret!,
                {
                    expiresIn: NEVER_EXPIRE_SECONDS // Effectively never expires
                }
            );

            // Update user's last active timestamp
            await user.updateActivity();

            return {
                walletAddress: user.walletAddress,
                displayName: user.displayName,
                token: token
            };

        } catch (error) {
            // Re-throw with more context if needed
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Authentication failed: " + String(error));
        }
    }

    /**
     * Verifies an Ethereum signature using ethers.js
     * @param message - The message that was signed
     * @param signature - The signature to verify
     * @param expectedAddress - The wallet address that should have signed the message
     * @returns true if signature is valid, false otherwise
     */
    private verifySignature(message: string, signature: string, expectedAddress: string): boolean {
        try {
            // Recover the address from the signature
            const recoveredAddress = ethers.verifyMessage(message, signature);
            
            // Compare addresses (case-insensitive)
            return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
        } catch (error) {
            // If signature verification fails, return false
            return false;
        }
    }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;