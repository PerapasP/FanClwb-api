import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { LinkArtistDto } from './dto/link-artist.dto';

@Injectable()
export class ArtistAccountService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── LINK USER → ARTIST (admin only) ──────────────────
  async link(dto: LinkArtistDto) {
    // validate
    if (dto.type === 'group' && !dto.artist_id) {
      throw new BadRequestException('artist_id is required for group type');
    }

    if (dto.type === 'solo' && !dto.member_id) {
      throw new BadRequestException('member_id is required for solo type');
    }

    // เช็คว่า user มีจริง
    const user = await this.prisma.users.findUnique({
      where: { user_id: dto.user_id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // เช็คว่ายังไม่มี artist account
    const existing = await this.prisma.artist_accounts.findUnique({
      where: { user_id: dto.user_id },
    });

    if (existing) {
      throw new ConflictException('User already has an artist account');
    }

    // สร้าง artist account + อัปเดต role
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.artist_accounts.create({
        data: {
          user_id: dto.user_id,
          type: dto.type,
          artist_id: dto.type === 'group' ? dto.artist_id : null,
          member_id: dto.type === 'solo' ? dto.member_id : null,
          is_verified: true,
        },
        include: {
          user: {
            select: { user_id: true, fullname: true, email: true },
          },
          artist: {
            select: { artist_id: true, name: true },
          },
          member: {
            select: { member_id: true, name: true },
          },
        },
      });

      await tx.users.update({
        where: { user_id: dto.user_id },
        data: { role: 'artist' },
      });

      return account;
    });
  }

  // ─── UNLINK ───────────────────────────────────────────
  async unlink(userId: string) {
    const account = await this.prisma.artist_accounts.findUnique({
      where: { user_id: userId },
    });

    if (!account) {
      throw new NotFoundException('Artist account not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.artist_accounts.delete({
        where: { id: account.id },
      });

      await tx.users.update({
        where: { user_id: userId },
        data: { role: 'fan' },
      });

      return { message: 'Artist account unlinked' };
    });
  }

  // ─── GET ARTIST ACCOUNT BY USER ───────────────────────
  async findByUser(userId: string) {
    const account = await this.prisma.artist_accounts.findUnique({
      where: { user_id: userId },
      include: {
        artist: {
          select: { artist_id: true, name: true, slug: true, image_url: true },
        },
        member: {
          select: { member_id: true, name: true, image_url: true },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Artist account not found');
    }

    return account;
  }
}
