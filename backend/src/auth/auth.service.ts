import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { UserDocument } from 'src/users/schemas/user.schema';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly emailService: EmailService,
    ) { }

    async register(dto: any) {
        const user: UserDocument = await this.usersService.create(
            dto.email,
            dto.password,
            dto.name,
        );

        // Use userId-based method — user object already in memory
        const verificationToken = await this.usersService.setVerificationToken(
            user.id,
        );

        try {
            await this.emailService.sendVerificationEmail(
                user.email,
                verificationToken,
                user.name || user.email,
            );
        } catch (error) {
            // Don't fail registration if email fails — user can resend later
            console.error('Failed to send verification email:', error);
        }

        return {
            message: 'User registered successfully. Please check your email to verify your account.',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                isEmailVerified: false,
            },
        };
    }


    async login(dto: any) {
        const user: UserDocument | null = await this.usersService.findByEmail(dto.email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const valid = await bcrypt.compare(dto.password, user.passwordHash);

        if (!valid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Validate password BEFORE checking verification — prevents user enumeration
        // via different error messages. Soft flag instead of hard block (MVP decision).
        return this.signToken(user);
    }

    /**
     * Verificar email con token
     */
    async verifyEmail(token: string) {
        const user = await this.usersService.verifyEmail(token);

        return {
            message: 'Email verified successfully',
            user: {
                id: user.id,
                email: user.email,
                isEmailVerified: user.isEmailVerified,
            },
        };
    }

    /**
    * Resends verification email. Uses silent success for non-existent emails
    * to prevent user enumeration attacks. Rate limited via hasRecentVerificationRequest
    * to prevent email spam — 5 minute cooldown enforced at the service layer.
    */
    async resendVerification(email: string) {
        const user = await this.usersService.findByEmail(email);

        // Silent success — never leak whether email exists in the system
        if (!user) {
            return { message: 'If that email exists, a new verification link has been sent.' };
        }

        // Already verified — no need to resend
        if (user.isEmailVerified) {
            return { message: 'This account is already verified.' };
        }

        // Enforce 5-minute cooldown between resend requests
        const tooSoon = await this.usersService.hasRecentVerificationRequest(user.id);
        if (tooSoon) {
            throw new BadRequestException(
                'Please wait at least 5 minutes before requesting another verification email.',
            );
        }

        const verificationToken = await this.usersService.setVerificationToken(user.id);

        try {
            await this.emailService.sendVerificationEmail(
                user.email,
                verificationToken,
                user.name || user.email,
            );
        } catch (error) {
            console.error('Failed to resend verification email:', error);
            throw new BadRequestException('Failed to send email. Please try again later.');
        }

        return { message: 'If that email exists, a new verification link has been sent.' };
    }

    /**
     * Solicitar reset de contraseña
     */
    async forgotPassword(email: string) {
        // No exponer si el usuario existe o no
        const resetToken = await this.usersService.generatePasswordResetToken(email);

        // Buscar usuario para enviar email (sin exponer si existe)
        const user = await this.usersService.findByEmail(email);
        if (user) {
            try {
                await this.emailService.sendPasswordResetEmail(email, resetToken, user.name || email);
            } catch (error) {
                console.error('Failed to send password reset email:', error);
            }
        }

        return {
            message: 'If the email exists in our system, a password reset link will be sent',
        };
    }

    /**
     * Resetear contraseña con token
     */
    async resetPassword(token: string, newPassword: string) {
        const user = await this.usersService.resetPassword(token, newPassword);

        return {
            message: 'Password reset successfully',
            user: {
                id: user.id,
                email: user.email,
            },
        };
    }

    signToken(user: UserDocument): { token: string; emailVerificationRequired: boolean } {
        const token = this.jwtService.sign({
            sub: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
        });

        return {
            token,
            emailVerificationRequired: !user.isEmailVerified,
        };
    }
}
