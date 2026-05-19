import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  async create(createUserDto: CreateUserDto) {
    const user = await this.userModel.create({
      name: createUserDto.name,
      email: createUserDto.email,
      password: createUserDto.password,
      role: UserRole.READER,
    });
    return user.save();
  }

  async findAll() {
    const users = this.userModel.find();
    return users;
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    // Never allow role changes through the API
    const { name, email, password } = updateUserDto;
    const update: Partial<{ name: string; email: string; password: string }> =
      {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (password !== undefined) update.password = password;
    return this.userModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  remove(id: string) {
    return this.userModel.findByIdAndDelete(id).exec();
  }
}
