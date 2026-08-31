import {authService, userService, emailService, googleService, authProviderService} from '@repo/services'
import { publicProcedure, protectedProcedure, router } from '../../trpc.js'
import { clearRefreshCookie, getRefreshCookie, setRefreshCookie } from '../../utils/cookie.js'
import { createUserWithEmailAndPassword, signInUserWithEmailAndPassword, verifyEmail, googleLogin, authTokenOutput, refreshOutput, logoutOutput, meOutput, verifyEmailOutput } from './model.js'
import { generatePath } from '../../utils/path-generator.js'
import { TRPCError } from '@trpc/server'



const getPath = generatePath('/authentication')

export const authRouter = router({
    createUserWithEmailAndPassword: publicProcedure.meta({
        openapi: {
            method: 'POST',
            path: getPath('/createUserWithEmailAndPassword'),
            tags: ['Authentication']
        }
    })
    .input(createUserWithEmailAndPassword)
    .output(authTokenOutput)
    .mutation(async ({input, ctx}) => {
        const {displayName, email, password} = input;
        
        const userExists = await userService.findUserByEmail(email);
        if(userExists) throw new TRPCError({
            code: 'CONFLICT',
            message: 'User with this email exists'
        });

        const passwordHash = await authService.hashPassword(password);

        const user = await userService.createUser({email, passwordHash, displayName});

        if(!user) throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'failed to process user information in db'
        })
        const accessToken = authService.generateAccessToken(user.id);
        const refreshToken = authService.generateRefreshToken(user.id);

        const refreshTokenResponse = await userService.updateRefreshToken(user.id,refreshToken);
        if(!refreshTokenResponse) throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'failed to update refreshToken in db'
        });

        setRefreshCookie(ctx,refreshToken)

        const token = crypto.randomUUID();
        await userService.updateVerificationToken(user.id,token);
        emailService.sendVerificationEmail(user.email, token);

        return {accessToken, id: user.id, email: user.email, emailVerified: user.emailVerified};
    }),
    signInUserWithEmailAndPassword: publicProcedure.meta({
        openapi: {
            method: 'POST',
            path: getPath('/signInUserWithEmailAndPassword'),
            tags: ['Authentication']
        }
    })
    .input(signInUserWithEmailAndPassword)
    .output(authTokenOutput)
    .mutation(async ({input, ctx}) => {
        const {email, password} = input;

        const user = await userService.findUserByEmail(email);

        if(!user) throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'invalid email or password'
        });

        if(!user.passwordHash) throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'invalid email or password'
        })

        const isValidPassword = await authService.verifyPassword(password, user.passwordHash);

        if(!isValidPassword) throw new TRPCError({
            code:'UNAUTHORIZED',
            message: 'invalid email or password'
        });

        const accessToken = authService.generateAccessToken(user.id);
        const refreshToken = authService.generateRefreshToken(user.id);

        const refreshTokenResponse = await userService.updateRefreshToken(user.id,refreshToken);
        if(!refreshTokenResponse) throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'failed to update refreshToken in db'
        });

         setRefreshCookie(ctx,refreshToken)

        return {accessToken, id: user.id, email: user.email, emailVerified: user.emailVerified};
    }),
    refresh: publicProcedure.meta({
        openapi: {
            method: 'POST',
            path: getPath('/refresh'),
            tags: ['Authorization']
        }
    })
    .output(refreshOutput)
    .mutation(async ({ctx}) => {
        const refreshToken = getRefreshCookie(ctx);
        if(!refreshToken) throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'invalid refresh token'
        });

        const {userId} = authService.verifyRefreshToken(refreshToken);

        const user = await userService.findUserById(userId);

        if(!user) throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'user not found'
        });

        if(user.refreshToken !== refreshToken) throw new TRPCError({
            code:'UNAUTHORIZED',
            message: 'session revoked'
        });

        const newAccessToken = authService.generateAccessToken(user.id);
        const newRefreshToken = authService.generateRefreshToken(user.id);
        const refreshTokenResponse = await userService.updateRefreshToken(user.id,newRefreshToken);
        if(!refreshTokenResponse) throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'failed to update refreshToken in db'
        });

         setRefreshCookie(ctx,newRefreshToken)

        return {accessToken: newAccessToken};
    }),
    logoutUser: protectedProcedure.meta({
        openapi: {
            method: 'POST',
            path: getPath('/logout'),
            tags: ["Authorization"]
        }
    })
    .output(logoutOutput)
    .mutation(async ({ctx}) => {
        const refreshTokenResponse = await userService.updateRefreshToken(ctx.userId,null);
        if(!refreshTokenResponse) throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'failed to update refreshToken in db'
        });

        clearRefreshCookie(ctx);

        return {success:  true};
    }),
    me: protectedProcedure.meta({
        openapi: {
            method: 'GET',
            path: getPath('/me'),
        }
    })
    .output(meOutput)
    .query(async ({ctx}) => {

        if(!ctx.userId) throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'not authenticated'
        })

        const user = await userService.findUserById(ctx.userId);
        if(!user) throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'user not found'
        });
        
        return {id: user.id, email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl, emailVerified: user.emailVerified};
    }),
    verifyEmail: publicProcedure
    .meta({
        openapi: {
            method: "POST",
            path: getPath('/verify'),
            tags: ['Authentication']
        }
    })
    .input(verifyEmail)
    .output(verifyEmailOutput)
    .mutation(async ({input}) => {
        const {token} = input;

        const {user} = await userService.findUserByVerificationToken(token);
        if(!user) throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid or expired verification link'
        });
        
        const emailVerificationStatus = await userService.setEmailVerified(user.id);

        if(!emailVerificationStatus) throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'failed to update the verification status'
        })

        return { success: true};
    }),
    resendVerification: protectedProcedure.meta({
        openapi: {
            method: 'POST',
            path: getPath('/resend-email'),
            tags: ['Authentication']
        }
    })
    .output(verifyEmailOutput)
    .mutation(async ({ctx}) => {

        const user = await userService.findUserById(ctx.userId);
        if(!user) throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'user not found'
        });

        if(user.emailVerified) throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Email already verified'
        });

        const token = crypto.randomUUID();

        const updateStatus = await userService.updateVerificationToken(user.id, token);
        if(!updateStatus) throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: "Failed to update the verification token"
        });

        emailService.sendVerificationEmail(user.email, token);

        return {success: true};
    }),
    googleLogin: publicProcedure.meta({
        openapi: {
            method: 'POST',
            path: getPath('/googleLogin'),
            tags: ["Authorization"]
        }
    })
    .input(googleLogin)
    .output(authTokenOutput)
    .mutation(async ({input, ctx}) => {
        const {idToken} = input;

        let googlePayload;
        try {
            googlePayload = await googleService.verifyIdToken(idToken);
        } catch {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Invalid Google token'
            });
        }

        const {email, name, picture, sub} = googlePayload;

        let currentUser = await userService.findUserByEmail(email);

        if(currentUser){
            const authProvider = await authProviderService.findByProviderAndUserId('google', sub);
            if(!authProvider){
                await authProviderService.createAuthProvider({userId: currentUser.id, provider: 'google', providerUserId: sub});
            }
            if(!currentUser.avatarUrl && picture){
                await userService.updateAvatarUrl(currentUser.id, picture);
            }
        } else {
            const result = await userService.createGoogleUser({email, displayName: name, avatarUrl: picture});
            if(!result.user) throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'failed to create google user'
            });
            currentUser = result.user;
            await authProviderService.createAuthProvider({userId: currentUser.id, provider: 'google', providerUserId: sub});
        }

        const accessToken = authService.generateAccessToken(currentUser.id);
        const refreshToken = authService.generateRefreshToken(currentUser.id);

        await userService.updateRefreshToken(currentUser.id, refreshToken);
        setRefreshCookie(ctx, refreshToken);

        return {accessToken, id: currentUser.id, email: currentUser.email, emailVerified: currentUser.emailVerified};
    })

})