import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

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
}
