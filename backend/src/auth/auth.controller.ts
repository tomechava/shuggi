import {
    Body,
    Controller,
    Post,
    Get,
    Res,
    UseGuards,
    Request,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { JwtAuthGuard } from './jwt.guard';

// Opciones de cookie por entorno
// Development: SameSite lax + secure false (localhost no tiene HTTPS)
// Production:  SameSite strict + secure true + domain .shuggi.com
const cookieOptions = {
    httpOnly: true,   // JS no puede leer el token — protección XSS
    secure: process.env.NODE_ENV === 'production',
    sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
    domain: process.env.NODE_ENV === 'production' ? '.shuggi.com' : undefined,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en ms — igual que JWT expiry
    path: '/',
};

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    /**
     * Login — setea httpOnly cookie con JWT
     * POST /auth/login
     * Response body: { user, emailVerificationRequired }
     * Response cookie: access_token (httpOnly, no accesible desde JS)
     */
    @Post('login')
    async login(
        @Body() dto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { token, emailVerificationRequired } = await this.authService.login(dto);

        // Setear cookie — el browser la envía automáticamente en cada request
        res.cookie('access_token', token, cookieOptions);

        return { emailVerificationRequired };
    }

    /**
     * Logout — limpia la cookie
     * POST /auth/logout
     */
    @Post('logout')
    logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('access_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
            domain: process.env.NODE_ENV === 'production' ? '.shuggi.com' : undefined,
            path: '/',
        });

        return { message: 'Logged out successfully' };
    }

    /**
     * Me — retorna el usuario actual desde el JWT en la cookie
     * GET /auth/me
     * Usado por el frontend al cargar la app para restaurar la sesión
     */
    @Get('me')
    @UseGuards(JwtAuthGuard)
    getMe(@Request() req) {
        // req.user viene del JwtStrategy.validate()
        return { user: req.user };
    }

    /**
     * Verificar email con token
     * POST /auth/verify-email
     */
    @Post('verify-email')
    verifyEmail(@Body() dto: VerifyEmailDto) {
        return this.authService.verifyEmail(dto.token);
    }

    /**
     * Solicitar reset de contraseña
     * POST /auth/forgot-password
     */
    @Post('forgot-password')
    forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }

    /**
     * Resetear contraseña con token
     * POST /auth/reset-password
     */
    @Post('reset-password')
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto.token, dto.newPassword);
    }

    /**
     * Reenviar email de verificación
     * POST /auth/resend-verification
     */
    @Post('resend-verification')
    resendVerification(@Body() dto: ResendVerificationDto) {
        return this.authService.resendVerification(dto.email);
    }
}