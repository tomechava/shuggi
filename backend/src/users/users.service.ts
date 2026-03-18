import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
    ) {}

    async create(
        email: string,
        password: string,
        name?: string,
    ): Promise<UserDocument> {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new this.userModel({
            email,
            passwordHash: hashedPassword,
            name,
        });

        return user.save();
    }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async findById(id: string): Promise<User | null> {
        return this.userModel.findById(id).exec();
    }

    async findAll(): Promise<User[]> {
        return this.userModel.find().exec();
    }

    /**
     * Generar y guardar token de verificación de email
     */
    async generateEmailVerificationToken(email: string): Promise<string> {
        const user = await this.findByEmail(email);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Generar token seguro de 32 bytes
        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Guardar token hasheado en BD con expiración de 24 horas
        await this.userModel.findByIdAndUpdate(user.id, {
            emailVerificationToken: hashedToken,
            emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        return token;
    }

    /**
     * Verificar email con token
     */
    async verifyEmail(token: string): Promise<UserDocument> {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await this.userModel.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: new Date() },
        });

        if (!user) {
            throw new BadRequestException('Invalid or expired verification token');
        }

        // Marcar email como verificado y limpiar token
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;

        return user.save();
    }

    /**
     * Generar y guardar token de reset de contraseña
     */
    async generatePasswordResetToken(email: string): Promise<string> {
        const user = await this.findByEmail(email);
        if (!user) {
            // No exponer si el usuario existe o no (security best practice)
            return 'token-not-generated';
        }

        // Generar token seguro de 32 bytes
        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Guardar token hasheado en BD con expiración de 1 hora
        await this.userModel.findByIdAndUpdate(user.id, {
            passwordResetToken: hashedToken,
            passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
        });

        return token;
    }

    /**
     * Resetear contraseña con token
     */
    async resetPassword(token: string, newPassword: string): Promise<UserDocument> {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await this.userModel.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: new Date() },
        });

        if (!user) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        // Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar contraseña y limpiar token
        user.passwordHash = hashedPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        return user.save();
    }
}
