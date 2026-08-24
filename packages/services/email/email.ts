import { Resend } from 'resend';
import {env} from '../env.js';

class EmailService {
    private static instance: EmailService;

    private resendClient = new Resend(env.RESEND_API_KEY);

    private constructor(){}

    static getInstance(): EmailService {
        if(!EmailService.instance){
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }

    sendVerificationEmail(to: string, token: string){
        const verificationUrl = env.FRONTEND_URL + "/verify?token=" + token;
        this.resendClient.emails.send({
            from: env.RESEND_FROM_EMAIL,
            to,
            subject: "Verify you email - Pigeon",
            html: `Click <a href="${verificationUrl}">here</a> to verify your account with Pigeon 🐦`
        })
    }
}

export const emailService = EmailService.getInstance();

