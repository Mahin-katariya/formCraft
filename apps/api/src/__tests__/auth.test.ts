    import {serverRouter} from '@repo/trpc/server'
    import db,{userTable, authProviderTable} from '@repo/database'
    import { createTestContext } from './helpers/create-test-context.js'
import { emailService, userService, googleService, authProviderService } from '@repo/services'

const mockGooglePayload = {
    email: 'googleuser@gmail.com',
    name: 'Google User',
    picture: 'https://lh3.googleusercontent.com/photo.jpg',
    sub: '1234567890'
}

vi.mock('@repo/services', async (importOriginal) => {
    const original = await importOriginal() as Record<string, unknown>;
    return {
        ...original,
        emailService: {
            sendVerificationEmail: vi.fn()
        },
        googleService: {
            verifyIdToken: vi.fn()
        }
    }
})

beforeEach(async () => {
    vi.clearAllMocks();
    await db.delete(authProviderTable);
    await db.delete(userTable);
})

describe("auth.createUserWithEmailAndPassword", () => {
    it("register a new user and returns tokens", async () => {
        const {ctx, cookieJar} = createTestContext();
        const caller = serverRouter.createCaller(ctx);
        const result = await caller.auth.createUserWithEmailAndPassword({email: "test@test.com", password: "password123"});

        expect(result).toHaveProperty("accessToken");
        expect(result).toHaveProperty("id");
        expect(result.email).toBe("test@test.com");
        expect(result.emailVerified).toBe(false);
        expect(cookieJar['refresh-token']).toBeDefined();
    });

    it("registering an existing user", async () => {
        const {ctx, cookieJar} = createTestContext();
        const caller = serverRouter.createCaller(ctx);

        await caller.auth.createUserWithEmailAndPassword({ email: "test@test.com", password: "password123"})

        await expect(
            caller.auth.createUserWithEmailAndPassword({ email: "test@test.com", password: "password123"})
        )
        .rejects.toThrow("User with this email exists");
    })

    it("send verification link to registered user", async () => {
        const {ctx, cookieJar} = createTestContext();
        const caller = serverRouter.createCaller(ctx);

        await caller.auth.createUserWithEmailAndPassword({ email: "test@test.com", password: "password123"})
        expect(emailService.sendVerificationEmail).toHaveBeenCalledWith("test@test.com", expect.any(String));
    })
});

describe("auth.signInUserWithEmailAndPassword", () => {
    it("sign in an existing user with correct credentials", async () => {
        const {ctx: registerCtx} = createTestContext();
        const registerCaller = serverRouter.createCaller(registerCtx);

        await registerCaller.auth.createUserWithEmailAndPassword({email:'test@test.com',password:'password123'});

        const {ctx: signInCtx, cookieJar} = createTestContext();
        const signInCaller = serverRouter.createCaller(signInCtx);

        const result = await signInCaller.auth.signInUserWithEmailAndPassword({email: "test@test.com", password: "password123"})
        expect(result).toHaveProperty("accessToken");
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("email");
        expect(result.email).toBe('test@test.com');
        expect(cookieJar['refresh-token']).toBeDefined();
    });

    it("user trying to signin, without having an existing account",async () => {
        const {ctx: signInCtx} = createTestContext();
        const signInCaller = serverRouter.createCaller(signInCtx);

        await expect(
            signInCaller.auth.signInUserWithEmailAndPassword({ email: "test@test.com", password: "password123"})
        )
        .rejects.toThrow("invalid email or password");
    });

    it("user trying to signin using incorrect password", async () => {
        const {ctx: registerCtx} = createTestContext();
        const registerCaller = serverRouter.createCaller(registerCtx);

        await registerCaller.auth.createUserWithEmailAndPassword({email:'test@test.com',password:'password123'});

        const {ctx: signInCtx} = createTestContext();
        const signInCaller = serverRouter.createCaller(signInCtx);

        await expect(
            signInCaller.auth.signInUserWithEmailAndPassword({ email: "test@test.com", password: "password321"})
        )
        .rejects.toThrow("invalid email or password");
    })
})

describe("auth.refresh", () => {
    it("rotate tokens successfully", async() => {
        const {ctx: registerCtx, cookieJar} = createTestContext();
        const registerCaller = serverRouter.createCaller(registerCtx);

        await registerCaller.auth.createUserWithEmailAndPassword({email:'test@test.com',password:'password123'});

        const {ctx: refreshCtx} = createTestContext({cookies: {...cookieJar}});
        const refreshCaller = serverRouter.createCaller(refreshCtx);

        const result = await refreshCaller.auth.refresh();

        expect(result).toHaveProperty("accessToken");
    });

    it("Error: no refresh cookie", async() => {
        const {ctx: refreshCtx} = createTestContext();
        const refreshCaller = serverRouter.createCaller(refreshCtx);

        await expect(
            refreshCaller.auth.refresh()
        ).rejects.toThrow('invalid refresh token');
    });

    it("Error: revoked token", async() => {
        const {ctx: registerCtx, cookieJar} = createTestContext();
        const registerCaller = serverRouter.createCaller(registerCtx);

        const registerResult = await registerCaller.auth.createUserWithEmailAndPassword({email:'test@test.com',password:'password123'});

        await userService.updateRefreshToken(registerResult.id, null);

        const {ctx: refreshCtx} = createTestContext({cookies: {...cookieJar}});
        const refreshCaller = serverRouter.createCaller(refreshCtx);

        await expect(
            refreshCaller.auth.refresh()
        ).rejects.toThrow("session revoked");
    })
})

describe("auth.logoutUser", () => {
    it("logs out a user successfully", async() => {
        const {ctx: registerCtx} = createTestContext();
        const registerCaller = serverRouter.createCaller(registerCtx);

        const registerResult = await registerCaller.auth.createUserWithEmailAndPassword({email:'test@test.com',password:'password123'});

        const {ctx: logoutCtx, cookieJar} = createTestContext({authToken: registerResult.accessToken});
        const logoutCaller = serverRouter.createCaller(logoutCtx);

        const result = await logoutCaller.auth.logoutUser();

        expect(result).toEqual({success: true});
        expect(cookieJar['refresh-token']).toBeUndefined();

        const user = await userService.findUserById(registerResult.id);
        expect(user?.refreshToken).toBeNull();
    })
})

describe("auth.me", () => {
    it("returns user profile", async() => {
        const {ctx: registerCtx} = createTestContext();
        const registerCaller = serverRouter.createCaller(registerCtx);

        const registerResult = await registerCaller.auth.createUserWithEmailAndPassword({email:'test@test.com',password:'password123'});

        const {ctx: meCtx} = createTestContext({authToken: registerResult.accessToken});
        const meCaller = serverRouter.createCaller(meCtx);

        const result = await meCaller.auth.me();

        expect(result.id).toBe(registerResult.id);
        expect(result.email).toBe('test@test.com');
        expect(result).toHaveProperty("displayName");
        expect(result).toHaveProperty("avatarUrl");
        expect(result).toHaveProperty("emailVerified");
    });

    it("throws UNAUTHORIZED without auth header", async() => {
        const {ctx} = createTestContext();
        const caller = serverRouter.createCaller(ctx);

        await expect(
            caller.auth.me()
        ).rejects.toThrow("authorization header - token missing");
    })
})

afterAll(async () => {
    await db.delete(authProviderTable);
    await db.delete(userTable);
})

describe("auth.verifyEmail", () => {
    it("valid token verifies registered users email", async () => {
        const {ctx: registerCtx} = createTestContext();
        const registerCaller = serverRouter.createCaller(registerCtx);

        const registerResult = await registerCaller.auth.createUserWithEmailAndPassword({email:'test@test.com',password:'password123'});

        const user = await userService.findUserById(registerResult.id);
        expect(user).toBeDefined();
        const token = user!.verificationToken;
        expect(token).toBeDefined();

        const {ctx: verifyCtx} = createTestContext();
        const verifyCaller = serverRouter.createCaller(verifyCtx);

        const result = await verifyCaller.auth.verifyEmail({token: token!});
        expect(result).toEqual({success: true});

        const verifiedUser = await userService.findUserById(registerResult.id);
        expect(verifiedUser!.emailVerified).toBe(true);
        expect(verifiedUser!.verificationToken).toBeNull();
    })

    it("invalid token returns error", async () => {
        const {ctx} = createTestContext();
        const caller = serverRouter.createCaller(ctx);

        await expect(
            caller.auth.verifyEmail({token: "some-fake-token-that-doesnt-exist"})
        ).rejects.toThrow("Invalid or expired verification link");
    })

    it("already-used token returns error", async () => {
        const {ctx: registerCtx} = createTestContext();
        const registerCaller = serverRouter.createCaller(registerCtx);

        const registerResult = await registerCaller.auth.createUserWithEmailAndPassword({email:'test@test.com',password:'password123'});

        const user = await userService.findUserById(registerResult.id);
        const token = user!.verificationToken!;

        const {ctx: verifyCtx} = createTestContext();
        const verifyCaller = serverRouter.createCaller(verifyCtx);
        await verifyCaller.auth.verifyEmail({token});

        const {ctx: verifyCtx2} = createTestContext();
        const verifyCaller2 = serverRouter.createCaller(verifyCtx2);

        await expect(
            verifyCaller2.auth.verifyEmail({token})
        ).rejects.toThrow("Invalid or expired verification link");
    })
})

describe("auth.resendVerification", () => {
    it("sends new verification email for unverified user", async () => {
        const {ctx: registerCtx} = createTestContext();
        const registerCaller = serverRouter.createCaller(registerCtx);

        const registerResult = await registerCaller.auth.createUserWithEmailAndPassword({email:'test@test.com',password:'password123'});

        vi.clearAllMocks();

        const {ctx: resendCtx} = createTestContext({authToken: registerResult.accessToken});
        const resendCaller = serverRouter.createCaller(resendCtx);

        const result = await resendCaller.auth.resendVerification();
        expect(result).toEqual({success: true});
        expect(vi.mocked(emailService.sendVerificationEmail)).toHaveBeenCalledWith("test@test.com", expect.any(String));
    })

    it("already verified user cannot resend", async () => {
        const {ctx: registerCtx} = createTestContext();
        const registerCaller = serverRouter.createCaller(registerCtx);

        const registerResult = await registerCaller.auth.createUserWithEmailAndPassword({email:'test@test.com',password:'password123'});

        const user = await userService.findUserById(registerResult.id);
        const token = user!.verificationToken!;

        const {ctx: verifyCtx} = createTestContext();
        const verifyCaller = serverRouter.createCaller(verifyCtx);
        await verifyCaller.auth.verifyEmail({token});

        const {ctx: resendCtx} = createTestContext({authToken: registerResult.accessToken});
        const resendCaller = serverRouter.createCaller(resendCtx);

        await expect(
            resendCaller.auth.resendVerification()
        ).rejects.toThrow("Email already verified");
    })
})

describe("auth.googleLogin", () => {
    it("creates a new user from Google login", async () => {
        vi.mocked(googleService.verifyIdToken).mockResolvedValue(mockGooglePayload);

        const {ctx, cookieJar} = createTestContext();
        const caller = serverRouter.createCaller(ctx);

        const result = await caller.auth.googleLogin({idToken: 'fake-google-token'});

        expect(result).toHaveProperty("accessToken");
        expect(result).toHaveProperty("id");
        expect(result.email).toBe("googleuser@gmail.com");
        expect(result.emailVerified).toBe(true);
        expect(cookieJar['refresh-token']).toBeDefined();

        const user = await userService.findUserById(result.id);
        expect(user!.avatarUrl).toBe("https://lh3.googleusercontent.com/photo.jpg");
        expect(user!.passwordHash).toBeNull();

        const authProvider = await authProviderService.findByProviderAndUserId('google', '1234567890');
        expect(authProvider).toBeDefined();
    })

    it("returns tokens for existing Google user without creating duplicate", async () => {
        vi.mocked(googleService.verifyIdToken).mockResolvedValue(mockGooglePayload);

        const {ctx: firstCtx} = createTestContext();
        const firstCaller = serverRouter.createCaller(firstCtx);
        const firstResult = await firstCaller.auth.googleLogin({idToken: 'fake-google-token'});

        const {ctx: secondCtx, cookieJar} = createTestContext();
        const secondCaller = serverRouter.createCaller(secondCtx);
        const secondResult = await secondCaller.auth.googleLogin({idToken: 'fake-google-token'});

        expect(secondResult).toHaveProperty("accessToken");
        expect(secondResult.id).toBe(firstResult.id);
        expect(cookieJar['refresh-token']).toBeDefined();
    })

    it("links Google account to existing credential user", async () => {
        const {ctx: registerCtx} = createTestContext();
        const registerCaller = serverRouter.createCaller(registerCtx);
        await registerCaller.auth.createUserWithEmailAndPassword({email: 'googleuser@gmail.com', password: 'password123'});

        vi.mocked(googleService.verifyIdToken).mockResolvedValue(mockGooglePayload);

        const {ctx: googleCtx, cookieJar} = createTestContext();
        const googleCaller = serverRouter.createCaller(googleCtx);
        const result = await googleCaller.auth.googleLogin({idToken: 'fake-google-token'});

        expect(result).toHaveProperty("accessToken");
        expect(result.email).toBe("googleuser@gmail.com");
        expect(cookieJar['refresh-token']).toBeDefined();

        const authProvider = await authProviderService.findByProviderAndUserId('google', '1234567890');
        expect(authProvider).toBeDefined();
    })

    it("rejects invalid Google token", async () => {
        vi.mocked(googleService.verifyIdToken).mockRejectedValue(new Error('Invalid token'));

        const {ctx} = createTestContext();
        const caller = serverRouter.createCaller(ctx);

        await expect(
            caller.auth.googleLogin({idToken: 'bad-token'})
        ).rejects.toThrow("Invalid Google token");
    })
})