import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateProfileDto, ChangePasswordDto, ProfileResponseDto } from './dto/profile.dto';
import { UpdateTaxInfoDto, TaxInfoResponseDto } from './dto/tax.dto';

@Injectable()
export class ProfileService {
  // Mock data - replace with actual database
  private profiles: ProfileResponseDto[] = [
    {
      id: '1',
      fullName: 'Admin User',
      email: 'admin@example.com',
      phone: '+1234567890',
      dateOfBirth: '1990-01-01',
      address: '123 Main St, City, State',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  private taxInfos: TaxInfoResponseDto[] = [
    {
      id: '1',
      ssn: '***-**-6789',
      filingStatus: 'single',
      annualIncome: 50000,
      dependents: 0,
      employer: 'ABC Corporation',
      userId: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const profile = this.profiles.find(p => p.id === userId);
    if (!profile) {
      throw new NotFoundException(`Profile for user ${userId} not found`);
    }
    return profile;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<ProfileResponseDto> {
    const profileIndex = this.profiles.findIndex(p => p.id === userId);
    if (profileIndex === -1) {
      throw new NotFoundException(`Profile for user ${userId} not found`);
    }

    const updatedProfile = {
      ...this.profiles[profileIndex],
      ...updateProfileDto,
      updatedAt: new Date(),
    };

    this.profiles[profileIndex] = updatedProfile;
    return updatedProfile;
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;
    
    // In real app, verify current password against database
    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    // In real app, hash and save the new password
    console.log(`Password changed for user ${userId}`);
    
    return { message: 'Password changed successfully' };
  }

  async getTaxInfo(userId: string): Promise<TaxInfoResponseDto> {
    const taxInfo = this.taxInfos.find(t => t.userId === userId);
    if (!taxInfo) {
      throw new NotFoundException(`Tax information for user ${userId} not found`);
    }
    return taxInfo;
  }

  async updateTaxInfo(userId: string, updateTaxInfoDto: UpdateTaxInfoDto): Promise<TaxInfoResponseDto> {
    const taxInfoIndex = this.taxInfos.findIndex(t => t.userId === userId);
    
    if (taxInfoIndex === -1) {
      // Create new tax info if doesn't exist
      const newTaxInfo: TaxInfoResponseDto = {
        id: (this.taxInfos.length + 1).toString(),
        ...updateTaxInfoDto,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.taxInfos.push(newTaxInfo);
      return newTaxInfo;
    }

    // Update existing tax info
    const updatedTaxInfo = {
      ...this.taxInfos[taxInfoIndex],
      ...updateTaxInfoDto,
      updatedAt: new Date(),
    };

    this.taxInfos[taxInfoIndex] = updatedTaxInfo;
    return updatedTaxInfo;
  }
}
