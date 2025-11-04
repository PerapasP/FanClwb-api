import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/users.dto';
import { PaginationDto, PaginatedResponseDto } from './dto/paginate.dto';

@Injectable()
export class UsersService {
  // Mock data for demonstration - replace with actual database
  private users: UserResponseDto[] = [
    {
      id: '1',
      fullName: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  create(createUserDto: CreateUserDto): UserResponseDto {
    const newUser: UserResponseDto = {
      id: (this.users.length + 1).toString(),
      fullName: createUserDto.fullName,
      email: createUserDto.email,
      role: createUserDto.role || 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  findAll(paginationDto: PaginationDto): PaginatedResponseDto<UserResponseDto> {
    const { page = 1, limit = 10 } = paginationDto;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = this.users.slice(startIndex, endIndex);
    const total = this.users.length;
    const totalPages = Math.ceil(total / limit);

    return {
      data: paginatedUsers,
      total,
      page,
      limit,
      totalPages,
    };
  }

  findOne(id: string): UserResponseDto {
    const user = this.users.find(user => user.id === id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  update(id: string, updateUserDto: UpdateUserDto): UserResponseDto {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updatedUser = {
      ...this.users[userIndex],
      ...updateUserDto,
      updatedAt: new Date(),
    };

    this.users[userIndex] = updatedUser;
    return updatedUser;
  }

  remove(id: string): { message: string } {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.users.splice(userIndex, 1);
    return { message: `User with ID ${id} has been deleted` };
  }

  getProfile(id: string): UserResponseDto {
    return this.findOne(id);
  }
}
