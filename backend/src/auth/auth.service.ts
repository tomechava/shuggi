import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { UserDocument } from 'src/users/schemas/user.schema';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) {}

    async register(dto: any) {
    const user: UserDocument = await this.usersService.create(
      dto.email,
      dto.password,
      dto.name,
    );

        return this.signToken(user); 
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

        return this.signToken(user); 
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
