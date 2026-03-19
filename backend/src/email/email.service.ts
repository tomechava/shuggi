import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly frontendUrl: string;

    constructor(
        private mailerService: MailerService,
        private configService: ConfigService,
    ) {
        this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
    }

    async sendVerificationEmail(email: string, token: string, name: string): Promise<void> {
        const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;

        try {
            await this.mailerService.sendMail({
                to: email,
                subject: '¡Bienvenido a Shuggi! Verifica tu email',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4CAF50;">¡Hola ${name}! 👋</h1>
            <p>Gracias por registrarte en Shuggi, la plataforma que combate el desperdicio de comida.</p>
            <p>Por favor verifica tu email haciendo click en el siguiente botón:</p>
            <a href="${verificationUrl}" 
               style="display: inline-block; background-color: #4CAF50; color: white; 
                      padding: 12px 24px; text-decoration: none; border-radius: 5px; 
                      margin: 20px 0;">
              Verificar Email
            </a>
            <p>O copia y pega este link en tu navegador:</p>
            <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Este link expira en 24 horas. Si no solicitaste esta cuenta, ignora este email.
            </p>
          </div>
        `,
            });

            this.logger.log(`Verification email sent to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send verification email to ${email}:`, error);
            throw error;
        }
    }

    async sendPasswordResetEmail(email: string, token: string, name: string): Promise<void> {
        const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;

        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Restablecer contraseña - Shuggi',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #FF9800;">Hola ${name},</h1>
            <p>Recibimos una solicitud para restablecer tu contraseña.</p>
            <p>Haz click en el siguiente botón para crear una nueva contraseña:</p>
            <a href="${resetUrl}" 
               style="display: inline-block; background-color: #FF9800; color: white; 
                      padding: 12px 24px; text-decoration: none; border-radius: 5px; 
                      margin: 20px 0;">
              Restablecer Contraseña
            </a>
            <p>O copia y pega este link en tu navegador:</p>
            <p style="color: #666; word-break: break-all;">${resetUrl}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Este link expira en 1 hora. Si no solicitaste este cambio, ignora este email.
            </p>
          </div>
        `,
            });

            this.logger.log(`Password reset email sent to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send password reset email to ${email}:`, error);
            throw error;
        }
    }
}