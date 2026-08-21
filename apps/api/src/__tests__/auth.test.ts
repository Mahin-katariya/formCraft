import {serverRouter} from '@repo/trpc/server'
import db,{ userTable} from '@repo/database'
import { createTestContext } from './helpers/create-test-context.js'
import { userService } from '@repo/services'

beforeEach(async () => {
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
    await db.delete(userTable);
})