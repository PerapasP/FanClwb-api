// artist/artist.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetArtistsQueryDto } from './dto/get-artists-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ArtistService {
  constructor(public prisma: PrismaService) {}

  async findAll(query: GetArtistsQueryDto) {
    const {
      search,
      categorySlug,
      labelId,
      status,
      page = 1,
      limit = 20,
    } = query;

    const where: Prisma.artistsWhereInput = {};

    if (status !== undefined) {
      where.status = status;
    }

    if (labelId) {
      where.label_id = labelId;
    }

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { detail: { fullname: { contains: search, mode: 'insensitive' } } },
        { detail: { fullname_eng: { contains: search, mode: 'insensitive' } } },
        { detail: { nickname: { contains: search, mode: 'insensitive' } } },
        { detail: { nickname_eng: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [artists, total] = await this.prisma.$transaction([
      this.prisma.artists.findMany({
        where,
        include: {
          category: true,
          label: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.artists.count({ where }),
    ]);

    return {
      data: artists,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(artistId: string, userId?: string) {
    const artist = await this.prisma.artists.findUnique({
      where: { artist_id: artistId },
      include: {
        category: true,
        label: true,
        detail: true,
        fandom: true,
        sns_links: {
          include: { platform: true },
          orderBy: { sort_order: 'asc' },
        },
        members: {
          where: { is_active: true },
          include: {
            sns_links: {
              include: { platform: true },
              orderBy: { sort_order: 'asc' },
            },
          },
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    if (!artist) {
      throw new NotFoundException('Artist not found');
    }

    let isFollowing = false;
    if (userId) {
      const follow = await this.prisma.artist_followers.findFirst({
        where: {
          artist_id: artist.artist_id,
          user_id: userId,
        },
      });
      isFollowing = !!follow;
    }

    let members = artist.members as any[];
    if (userId) {
      members = await Promise.all(
        artist.members.map(async (m) => {
          const mFollow = await this.prisma.member_followers.findFirst({
            where: { member_id: m.member_id, user_id: userId },
          });
          return { ...m, isFollowing: !!mFollow };
        }),
      );
    }

    return {
      ...artist,
      members,
      isFollowing,
    };
  }

  async findBySlug(slug: string, userId?: string) {
    const artist = await this.prisma.artists.findUnique({
      where: { slug },
      include: {
        category: true,
        label: true,
        detail: true,
        fandom: true,
        sns_links: {
          include: { platform: true },
          orderBy: { sort_order: 'asc' },
        },
        members: {
          where: { is_active: true },
          include: {
            sns_links: {
              include: { platform: true },
              orderBy: { sort_order: 'asc' },
            },
          },
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    if (!artist) {
      throw new NotFoundException('Artist not found');
    }

    let isFollowing = false;
    if (userId) {
      const follow = await this.prisma.artist_followers.findFirst({
        where: {
          artist_id: artist.artist_id,
          user_id: userId,
        },
      });
      isFollowing = !!follow;
    }

    let members = artist.members as any[];
    if (userId) {
      members = await Promise.all(
        artist.members.map(async (m) => {
          const mFollow = await this.prisma.member_followers.findFirst({
            where: { member_id: m.member_id, user_id: userId },
          });
          return { ...m, isFollowing: !!mFollow };
        }),
      );
    }

    return {
      ...artist,
      members,
      isFollowing,
    };
  }

  async findMembers(artistId: string) {
    const artist = await this.prisma.artists.findUnique({
      where: { artist_id: artistId },
    });

    if (!artist) {
      throw new NotFoundException('Artist not found');
    }

    return this.prisma.artist_members.findMany({
      where: {
        artist_id: artistId,
        is_active: true,
      },
      include: {
        sns_links: {
          include: { platform: true },
          orderBy: { sort_order: 'asc' },
        },
      },
      orderBy: { sort_order: 'asc' },
    });
  }

  async findMember(artistId: string, memberId: string, userId?: string) {
    const member = await this.prisma.artist_members.findFirst({
      where: {
        member_id: memberId,
        artist_id: artistId,
      },
      include: {
        artist: {
          include: { label: true, category: true },
        },
        sns_links: {
          include: { platform: true },
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    let isFollowing = false;
    if (userId) {
      const follow = await this.prisma.member_followers.findFirst({
        where: {
          member_id: member.member_id,
          user_id: userId,
        },
      });
      isFollowing = !!follow;
    }

    return {
      ...member,
      isFollowing,
    };
  }

  async findMemberById(memberId: string, userId?: string) {
    const member = await this.prisma.artist_members.findUnique({
      where: { member_id: memberId },
      include: {
        artist: {
          include: { label: true, category: true, fandom: true },
        },
        sns_links: {
          include: { platform: true },
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    let isFollowing = false;
    if (userId) {
      const follow = await this.prisma.member_followers.findFirst({
        where: {
          member_id: member.member_id,
          user_id: userId,
        },
      });
      isFollowing = !!follow;
    }

    return {
      ...member,
      isFollowing,
    };
  }

  async findCategories() {
    return this.prisma.artist_categories.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findLabels() {
    return this.prisma.labels.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async follow(artistId: string, userId: string) {
    const artist = await this.prisma.artists.findUnique({
      where: { artist_id: artistId },
    });

    if (!artist) {
      throw new NotFoundException('Artist not found');
    }

    const existing = await this.prisma.artist_followers.findFirst({
      where: {
        artist_id: artistId,
        user_id: userId,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.artist_followers.create({
      data: {
        artist_id: artistId,
        user_id: userId,
      },
    });
  }

  async unfollow(artistId: string, userId: string) {
    const follow = await this.prisma.artist_followers.findFirst({
      where: {
        artist_id: artistId,
        user_id: userId,
      },
    });

    if (!follow) {
      return { message: 'Not following' };
    }

    await this.prisma.artist_followers.delete({
      where: { id: follow.id },
    });

    return { message: 'Unfollowed' };
  }

  async followMember(memberId: string, userId: string) {
    const member = await this.prisma.artist_members.findUnique({
      where: { member_id: memberId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const existing = await this.prisma.member_followers.findFirst({
      where: {
        member_id: memberId,
        user_id: userId,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.member_followers.create({
      data: {
        member_id: memberId,
        user_id: userId,
      },
    });
  }

  async unfollowMember(memberId: string, userId: string) {
    const follow = await this.prisma.member_followers.findFirst({
      where: {
        member_id: memberId,
        user_id: userId,
      },
    });

    if (!follow) {
      return { message: 'Not following' };
    }

    await this.prisma.member_followers.delete({
      where: { id: follow.id },
    });

    return { message: 'Unfollowed' };
  }

  async getFollowing(userId: string) {
    const following = await this.prisma.artist_followers.findMany({
      where: { user_id: userId },
      include: {
        artist: {
          include: {
            category: true,
            label: true,
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return following.map(f => f.artist);
  }

  async getFollowingMembers(userId: string) {
    const following = await this.prisma.member_followers.findMany({
      where: { user_id: userId },
      include: {
        member: {
          include: {
            artist: true,
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return following.map(f => f.member);
  }

  async update(artistId: string, dto: any) {
    const artist = await this.prisma.artists.findUnique({
      where: { artist_id: artistId },
    });

    if (!artist) {
      throw new NotFoundException('Artist not found');
    }

    return this.prisma.artists.update({
      where: { artist_id: artistId },
      data: dto,
    });
  }
}
