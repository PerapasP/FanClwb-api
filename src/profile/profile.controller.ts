import {
  Controller,
  Get,
  Patch,
  Body,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileDto, ChangePasswordDto, ProfileResponseDto } from './dto/profile.dto';
import { UpdateTaxInfoDto, TaxInfoResponseDto } from './dto/tax.dto';

@ApiTags('Profile')
@Controller('profile')
@ApiBearerAuth()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully', type: ProfileResponseDto })
  getProfile(@Request() req) {
    return this.profileService.getProfile(req.user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: ProfileResponseDto })
  updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.id, updateProfileDto);
  }

  @Patch('password')
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.profileService.changePassword(req.user.id, changePasswordDto);
  }

  @Get('tax-info')
  @ApiOperation({ summary: 'Get user tax information' })
  @ApiResponse({ status: 200, description: 'Tax info retrieved successfully', type: TaxInfoResponseDto })
  getTaxInfo(@Request() req) {
    return this.profileService.getTaxInfo(req.user.id);
  }

  @Patch('tax-info')
  @ApiOperation({ summary: 'Update user tax information' })
  @ApiResponse({ status: 200, description: 'Tax info updated successfully', type: TaxInfoResponseDto })
  updateTaxInfo(@Request() req, @Body() taxInfoDto: UpdateTaxInfoDto) {
    return this.profileService.updateTaxInfo(req.user.id, taxInfoDto);
  }
}