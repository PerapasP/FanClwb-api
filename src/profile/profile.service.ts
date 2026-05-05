import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateProfileDto, ChangePasswordDto } from './dto/profile.dto';
import { UpdateTaxInfoDto } from './dto/tax.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Profile for user ${userId} not found`);
    }

    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Profile for user ${userId} not found`);
    }

    const updatedUser = await this.prisma.users.update({
      where: { user_id: userId },
      data: {
        fullname: updateProfileDto.fullname,
        email: updateProfileDto.email,
        phone_number: updateProfileDto.phone,
        // Add other fields if needed
      },
    });

    return updatedUser;
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;
    
    const identity = await this.prisma.user_identities.findFirst({
      where: { user_id: userId, provider: 'email' },
    });

    if (!identity || !identity.password) {
      throw new BadRequestException('Email identity not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, identity.password);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user_identities.update({
      where: { id: identity.id },
      data: { password: hashedPassword },
    });
    
    return { message: 'Password changed successfully' };
  }

  async getTaxInfo(userId: string) {
    // Implement if needed
    return { userId };
  }

  async updateTaxInfo(userId: string, updateTaxInfoDto: UpdateTaxInfoDto) {
    // Implement if needed
    return { userId, ...updateTaxInfoDto };
  }
}
