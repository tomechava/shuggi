import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
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
    ) {}

    async register(dto: any) {
        const user: UserDocument = await this.usersService.create(
            dto.email,
            dto.password,
            dto.name,
        );

        // Generar y enviar token de verificación de email
        const verificationToken = await this.usersService.generateEmailVerificationToken(user.email);

        try {
            await this.emailService.sendVerificationEmail(user.email, verificationToken, user.name || user.email);
        } catch (error) {
            // Log error pero no fallar el registro
            console.error('Failed to send verification email:', error);
        }

        return {
            message: 'User registered successfully. Please check your email to verify your account.',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        };
    }

    async login(dto: any) {
        const user: UserDocument | null = await this.usersService.findByEmail(dto.email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Validar que el email esté verificado
        if (!user.isEmailVerified) {
            throw new ForbiddenException('Please verify your email before logging in');
        }

        const valid = await bcrypt.compare(dto.password, user.passwordHash);

        if (!valid) {
            throw new UnauthorizedException('Invalid credentials');
        }

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

    private signToken(user: UserDocument) {
        return {
            accessToken: this.jwtService.sign({
                sub: user.id,
                role: user.role,
            }),
        };
    }
}
