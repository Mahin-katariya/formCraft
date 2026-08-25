import db, { InsertUser, SelectUser } from '@repo/database';
import {eq, userTable} from '@repo/database'


class UserService {
    private static instance: UserService;

    private constructor(){};

    static getInstance(): UserService {
        if(!UserService.instance){
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }

    async findUserByEmail(email: string): Promise<SelectUser | undefined>{
        const [user] = await db.select().from(userTable).where(eq(userTable.email, email));
        return user;
    }

    async findUserById(id: string){
        const [user] = await db.select().from(userTable).where(eq(userTable.id, id));
        return user;
    }

    async createUser(data: {email: string, passwordHash: string, displayName?: string}): Promise<SelectUser | undefined>{
        const [user] = await db.insert(userTable).values(data).returning();
        return user;
    }

    async updateRefreshToken(userId: string, token: string | null){
        const [result] =  await db.update(userTable).set({refreshToken: token}).where(eq(userTable.id, userId)).returning();
        if(!result) return undefined;
        return result.id;
    }

    // Email service helpers
    async findUserByVerificationToken(token: string){
        const [user] = await db.select().from(userTable).where(eq(userTable.verificationToken, token));
        return {user};
    }

    async setEmailVerified(userId: string){
        await db.update(userTable).set({emailVerified: true, verificationToken:null}).where(eq(userTable.id, userId));
        return {success: true}
    }

    async updateVerificationToken(userId: string, token: string){
        await db.update(userTable).set({verificationToken: token}).where(eq(userTable.id, userId));
        return {success: true};
    }

    async createGoogleUser(data: {email: string, displayName: string, avatarUrl: string}){
        const [user] = await db
        .insert(userTable)
        .values(
            {
                email: data.email, 
                displayName: data.displayName, 
                avatarUrl: data.avatarUrl, 
                emailVerified: true, 
                passwordHash: null
            }
        ).returning();

        if(!user)  return {success: false, user: null};
        return {success: true, user}
    }

    async updateAvatarUrl(userId: string, avatarUrl: string){
        await db.update(userTable).set({avatarUrl}).where(eq(userTable.id, userId));
    }

}

export const userService = UserService.getInstance();