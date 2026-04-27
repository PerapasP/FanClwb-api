// artist/artist.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetArtistsQueryDto } from './dto/get-artists-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ArtistService {
  constructor(private prisma: PrismaService) {}

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

  async findOne(artistId: string) {
    const artist = await this.prisma.artists.findUnique({
      where: { artist_id: artistId },
      include: {
        category: true,
        label: true,
        detail: true,
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

    return artist;
  }

  async findBySlug(slug: string) {
    const artist = await this.prisma.artists.findUnique({
      where: { slug },
      include: {
        category: true,
        label: true,
        detail: true,
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

    return artist;
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

  async findMember(artistId: string, memberId: string) {
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

    return member;
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
}
