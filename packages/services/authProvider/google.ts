import {OAuth2Client} from 'google-auth-library'
import {env}  from '../env.js'
class GoogleService {
    private static instance: GoogleService;

    private oauthClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

    private constructor(){}

    static getInstance(): GoogleService {
        if(!GoogleService.instance){
            GoogleService.instance = new GoogleService();
        }
        return GoogleService.instance;
    }

    async verifyIdToken(idToken: string){
        const ticket = await this.oauthClient.verifyIdToken({
            idToken,
            audience: env.GOOGLE_CLIENT_ID
        })

        const payload = ticket.getPayload();
        if(!payload || !payload.email) throw new Error('Invalid Google token payload');

        return {
            email: payload.email,
            name: payload.name ?? '',
            picture: payload.picture ?? '',
            sub: payload.sub!
        };
    }
}

export const googleService = GoogleService.getInstance();