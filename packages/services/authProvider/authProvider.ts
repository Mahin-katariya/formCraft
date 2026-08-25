import db, { and, authProviderTable, eq, userTable } from '@repo/database'

class AuthProviderService{
    private static instance: AuthProviderService;

    private constructor(){}

    static getInstance(): AuthProviderService{
        if(!AuthProviderService.instance){
            AuthProviderService.instance = new AuthProviderService();
        }

        return AuthProviderService.instance;
    }

    async findByProviderAndUserId(provider: string, providerUserId: string){

        const [authProvider] = await db.select()
        .from(authProviderTable)
        .where(
            and(
                eq(authProviderTable.provider,provider),
                eq(authProviderTable.providerUserId, providerUserId)
            )
        );

        return authProvider;
    }

    async createAuthProvider(data: {userId: string, provider:string, providerUserId: string}){

        const [result] = await db
        .insert(authProviderTable)
        .values({userId: data.userId, provider: data.provider, providerUserId: data.providerUserId}).returning();

        if(!result) return {success: false, result: null}
        return {success: true, result};
    }
}

export const authProviderService = AuthProviderService.getInstance();