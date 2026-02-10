import { Controller, Body, Get, Param, Post, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    async create (@Body() dto: CreateUserDto) {
        return this.usersService.create(
            dto.email,
            dto.password,
            dto.name,
        );
    }
    @UseGuards(JwtAuthGuard)
    @Get('me')
    getMe(@Req() req) {
        return req.user;
    }
    
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    
}
