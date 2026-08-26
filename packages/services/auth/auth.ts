import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import { env } from '../env.js'

class AuthService {
    private static instance: AuthService;

    private constructor() {}

    static getInstance(): AuthService { 
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    async hashPassword(password: string): Promise<string> {
        const salt = await bcryptjs.genSalt(12);
        return bcryptjs.hash(password, salt);
    }

    async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcryptjs.compare(password, hash);
    }

    generateAccessToken(userId: string): string {
        return jwt.sign({ userId }, env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    }

    generateRefreshToken(userId: string): string {
        return jwt.sign({ userId }, env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    }

    verifyAccessToken(token: string): { userId: string } {
        try {
            const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
            return decoded as { userId: string };
        } catch (error) {
            throw new Error(`err: ${error}`);
        }
    }

    verifyRefreshToken(token: string): { userId: string } {
        try {
            const decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET);
            return decoded as { userId: string };
        } catch (error) {
            throw new Error(`err: ${error}`);
        }
    }
}

export const authService = AuthService.getInstance();
