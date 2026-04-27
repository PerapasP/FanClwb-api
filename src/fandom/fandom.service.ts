import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateFandomDto } from './dto/create-fandom.dto';
import { UpdateFandomDto } from './dto/update-fandom.dto';
import { ManageMemberDto } from './dto/manage-member.dto';
import { PaginationQueryDto } from '@/community/dto/pagination-query.dto';

@Injectable()
export class FandomService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── CREATE FANDOM (admin only) ──────────────────────
  async create(dto: CreateFandomDto) {
    const artist = await this.prisma.artists.findUnique({
      where: { artist_id: dto.artist_id },
    });

    if (!artist) {
      throw new NotFoundException('Artist not found');
    }

    const existing = await this.prisma.fandoms.findUnique({
      where: { artist_id: dto.artist_id },
    });

    if (existing) {
      throw new ConflictException('Fandom already exists for this artist');
    }

    return this.prisma.fandoms.create({
      data: {
        artist_id: dto.artist_id,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        image_url: dto.image_url,
        banner_url: dto.banner_url,
      },
      include: {
        artist: {
          select: { artist_id: true, name: true, slug: true },
        },
      },
    });
  }

  // ─── GET ALL FANDOMS ─────────────────────────────────
  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = { is_active: true };

    const [fandoms, total] = await Promise.all([
      this.prisma.fandoms.findMany({
        where,
        skip,
        take: limit,
        include: {
          artist: {
            select: {
              artist_id: true,
              name: true,
              slug: true,
              image_url: true,
            },
          },
          _count: { select: { members: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.fandoms.count({ where }),
    ]);

    return {
      data: fandoms,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── GET FANDOM BY SLUG ──────────────────────────────
  async findBySlug(slug: string, userId?: string) {
    const fandom = await this.prisma.fandoms.findUnique({
      where: { slug },
      include: {
        artist: {
          select: { artist_id: true, name: true, slug: true, image_url: true },
        },
        _count: { select: { members: true, posts: true } },
        ...(userId
          ? {
              members: {
                where: { user_id: userId },
                take: 1,
              },
            }
          : {}),
      },
    });

    if (!fandom || !fandom.is_active) {
      throw new NotFoundException('Fandom not found');
    }

    return {
      ...fandom,
      _userMembership: userId ? (fandom.members?.[0] ?? null) : undefined,
      members: undefined,
    };
  }

  // ─── UPDATE FANDOM ───────────────────────────────────
  async update(fandomId: string, dto: UpdateFandomDto) {
    const fandom = await this.prisma.fandoms.findUnique({
      where: { fandom_id: fandomId },
    });

    if (!fandom) {
      throw new NotFoundException('Fandom not found');
    }

    return this.prisma.fandoms.update({
      where: { fandom_id: fandomId },
      data: dto,
    });
  }

  // ─── JOIN FANDOM ─────────────────────────────────────
  async join(fandomId: string, userId: string) {
    const fandom = await this.prisma.fandoms.findUnique({
      where: { fandom_id: fandomId },
    });

    if (!fandom || !fandom.is_active) {
      throw new NotFoundException('Fandom not found');
    }

    const existing = await this.prisma.fandom_members.findUnique({
      where: {
        fandom_id_user_id: { fandom_id: fandomId, user_id: userId },
      },
    });

    if (existing) {
      throw new ConflictException('Already a member of this fandom');
    }

    return this.prisma.fandom_members.create({
      data: {
        fandom_id: fandomId,
        user_id: userId,
        role: 'member',
      },
    });
  }

  // ─── LEAVE FANDOM ────────────────────────────────────
  async leave(fandomId: string, userId: string) {
    const membership = await this.prisma.fandom_members.findUnique({
      where: {
        fandom_id_user_id: { fandom_id: fandomId, user_id: userId },
      },
    });

    if (!membership) {
      throw new NotFoundException('Not a member of this fandom');
    }

    await this.prisma.fandom_members.delete({
      where: { id: membership.id },
    });

    return { message: 'Left fandom successfully' };
  }

  // ─── GET MEMBERS ─────────────────────────────────────
  async getMembers(fandomId: string, query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = { fandom_id: fandomId };

    const [members, total] = await Promise.all([
      this.prisma.fandom_members.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: { user_id: true, fullname: true, email: true },
          },
        },
        orderBy: [{ role: 'asc' }, { joined_at: 'asc' }],
      }),
      this.prisma.fandom_members.count({ where }),
    ]);

    return {
      data: members,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── MANAGE MEMBER ROLE (moderator/admin) ─────────────
  async manageMember(
    fandomId: string,
    actorUserId: string,
    dto: ManageMemberDto,
  ) {
    // เช็คสิทธิ์ actor
    const actor = await this.prisma.fandom_members.findUnique({
      where: {
        fandom_id_user_id: { fandom_id: fandomId, user_id: actorUserId },
      },
    });

    if (!actor || actor.role === 'member') {
      throw new ForbiddenException('Insufficient fandom permissions');
    }

    // moderator ตั้งได้แค่ member, admin ตั้งได้ทุก role
    if (actor.role === 'moderator' && dto.role !== 'member') {
      throw new ForbiddenException('Moderators can only manage members');
    }

    const target = await this.prisma.fandom_members.findUnique({
      where: {
        fandom_id_user_id: { fandom_id: fandomId, user_id: dto.user_id },
      },
    });

    if (!target) {
      throw new NotFoundException('User is not a member of this fandom');
    }

    return this.prisma.fandom_members.update({
      where: { id: target.id },
      data: { role: dto.role },
      include: {
        user: {
          select: { user_id: true, fullname: true },
        },
      },
    });
  }

  // ─── KICK MEMBER ─────────────────────────────────────
  async kickMember(
    fandomId: string,
    actorUserId: string,
    targetUserId: string,
  ) {
    const actor = await this.prisma.fandom_members.findUnique({
      where: {
        fandom_id_user_id: { fandom_id: fandomId, user_id: actorUserId },
      },
    });

    if (!actor || actor.role === 'member') {
      throw new ForbiddenException('Insufficient fandom permissions');
    }

    const target = await this.prisma.fandom_members.findUnique({
      where: {
        fandom_id_user_id: { fandom_id: fandomId, user_id: targetUserId },
      },
    });

    if (!target) {
      throw new NotFoundException('User is not a member');
    }

    // ห้าม kick คนที่ role สูงกว่าหรือเท่ากับ
    const roleHierarchy: Record<string, number> = {
      member: 0,
      moderator: 1,
      admin: 2,
    };

    if (roleHierarchy[target.role] >= roleHierarchy[actor.role]) {
      throw new ForbiddenException(
        'Cannot kick member with equal or higher role',
      );
    }

    await this.prisma.fandom_members.delete({
      where: { id: target.id },
    });

    return { message: 'Member kicked successfully' };
  }
}
