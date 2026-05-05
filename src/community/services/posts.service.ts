// src/community/services/posts.service.ts

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { type CreatePostDto } from '../dto/create-post.dto';
import { type UpdatePostDto } from '../dto/update-post.dto';
import { type PaginationQueryDto } from '../dto/pagination-query.dto';
import {
  type PaginatedResult,
  type PostWithRelations,
} from '../interfaces/community.interface';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── SHARED INCLUDE ───────────────────────────────────
  private postInclude(userId?: string): Prisma.postsInclude {
    return {
      user: {
        select: {
          user_id: true,
          fullname: true,
          email: true,
          image_url: true,
        },
      },
      images: {
        orderBy: { sort_order: 'asc' },
      },
      fandom: {
        select: {
          fandom_id: true,
          name: true,
          slug: true,
          image_url: true,
        },
      },
      artist: {
        select: {
          artist_id: true,
          name: true,
          image_url: true,
        },
      },
      ...(userId
        ? {
            reactions: {
              where: { user_id: userId },
              take: 1,
            },
          }
        : {}),
    };
  }

  // ─── MAP POST ─────────────────────────────────────────
  private mapPost(
    post: Record<string, any>,
    userId?: string,
  ): PostWithRelations {
    const { reactions, ...rest } = post;

    return {
      ...rest,
      _userReacted: userId
        ? Array.isArray(reactions) && reactions.length > 0
        : undefined,
    } as PostWithRelations;
  }

  // ─── VALIDATE FANDOM MEMBERSHIP ──────────────────────
  private async validateFandomMembership(
    fandomId: string,
    userId: string,
  ): Promise<void> {
    const membership = await this.prisma.fandom_members.findUnique({
      where: {
        fandom_id_user_id: {
          fandom_id: fandomId,
          user_id: userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You must join this fandom to post');
    }
  }

  // ─── VALIDATE POST AS ────────────────────────────────
  private async validatePostAs(
    userId: string,
    postAsType: string,
    postAsId?: string,
  ): Promise<void> {
    if (postAsType === 'user') return;

    if (postAsType === 'artist' || postAsType === 'member') {
      const artistAccount = await this.prisma.artist_accounts.findUnique({
        where: { user_id: userId },
      });

      if (!artistAccount) {
        throw new ForbiddenException('No artist account linked');
      }

      if (postAsType === 'artist') {
        if (!postAsId || artistAccount.artist_id !== postAsId) {
          throw new ForbiddenException('Cannot post as this artist');
        }
      }

      if (postAsType === 'member') {
        if (!postAsId || artistAccount.member_id !== postAsId) {
          throw new ForbiddenException('Cannot post as this member');
        }
      }
    }

    if (postAsType === 'fandom') {
      if (!postAsId) throw new ForbiddenException('post_as_id required for post_as_type=fandom');
      
      const [membership, user, fandom] = await Promise.all([
        this.prisma.fandom_members.findFirst({
          where: {
            fandom_id: postAsId,
            user_id: userId,
          },
        }),
        this.prisma.users.findUnique({ where: { user_id: userId } }),
        this.prisma.fandoms.findUnique({ where: { fandom_id: postAsId } })
      ]);

      const isFandomStaff = membership && (
        membership.role.toLowerCase() === 'admin' || 
        membership.role.toLowerCase() === 'moderator'
      );
      const isGlobalAdmin = user && user.role.toLowerCase() === 'admin';
      const isCreator = fandom && fandom.creator_id === userId;

      if (!isFandomStaff && !isGlobalAdmin && !isCreator) {
        throw new ForbiddenException('Permission denied: You are not authorized to post as this fandom');
      }
    }
  }

  // ─── CREATE POST ──────────────────────────────────────
  async create(userId: string, dto: CreatePostDto): Promise<PostWithRelations> {
    // validate fandom or artist follow
    if (dto.fandom_id) {
      // Find artist associated with this fandom
      const fandom = await this.prisma.fandoms.findUnique({
        where: { fandom_id: dto.fandom_id },
        select: { artist_id: true }
      });

      if (fandom) {
        // Check if member, follower, global admin, or creator
        const [membership, follower, user, fandomFull] = await Promise.all([
          this.prisma.fandom_members.findFirst({
            where: { fandom_id: dto.fandom_id, user_id: userId }
          }),
          fandom.artist_id
            ? this.prisma.artist_followers.findFirst({
                where: { artist_id: fandom.artist_id, user_id: userId }
              })
            : Promise.resolve(null),
          this.prisma.users.findUnique({ where: { user_id: userId } }),
          this.prisma.fandoms.findUnique({ where: { fandom_id: dto.fandom_id } })
        ]);

        const isGlobalAdmin = user?.role.toLowerCase() === 'admin';
        const isCreator = fandomFull?.creator_id === userId;

        if (!membership && !follower && !isGlobalAdmin && !isCreator) {
          throw new ForbiddenException('You must follow the artist or join the fandom to post');
        }
      }
    }

    // validate post as
    const postAsType = dto.post_as_type ?? 'user';
    await this.validatePostAs(userId, postAsType, dto.post_as_id);

    // create
    const post = await this.prisma.$transaction(async (tx) => {
      const created = await tx.posts.create({
        data: {
          user_id: userId,
          content: dto.content,
          post_as_type: postAsType,
          post_as_id: dto.post_as_id ?? null,
          fandom_id: dto.fandom_id ?? null,
          artist_id: dto.artist_id ?? null,
          is_exclusive: dto.is_exclusive ?? false,
        },
      });

      // images
      if (dto.image_urls?.length) {
        await tx.post_images.createMany({
          data: dto.image_urls.map((url, index) => ({
            post_id: created.post_id,
            image_url: url,
            sort_order: index,
          })),
        });
      }

      return created;
    });

    return this.findOne(post.post_id, userId);
  }

  // ─── FIND ALL (FEED) ─────────────────────────────────
  async findAll(
    query: PaginationQueryDto,
    userId?: string,
  ): Promise<PaginatedResult<PostWithRelations>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.postsWhereInput = {
      is_deleted: false,
      OR: [
        { post_as_type: 'artist' },
        { fandom_id: { not: null } }
      ]
    };

    const [posts, total] = await Promise.all([
      this.prisma.posts.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: this.postInclude(userId),
      }),
      this.prisma.posts.count({ where }),
    ]);

    return {
      data: posts.map((post) => this.mapPost(post, userId)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── FIND FANDOM FEED ────────────────────────────────
  async findByFandom(
    fandomId: string,
    query: PaginationQueryDto,
    userId?: string,
  ): Promise<PaginatedResult<PostWithRelations>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const fandom = await this.prisma.fandoms.findUnique({
      where: { fandom_id: fandomId },
    });

    if (!fandom || !fandom.is_active) {
      throw new NotFoundException('Fandom not found');
    }

    const where: Prisma.postsWhereInput = {
      fandom_id: fandomId,
      is_deleted: false,
    };

    const [posts, total] = await Promise.all([
      this.prisma.posts.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ is_pinned: 'desc' }, { created_at: 'desc' }],
        include: this.postInclude(userId),
      }),
      this.prisma.posts.count({ where }),
    ]);

    return {
      data: posts.map((post) => this.mapPost(post, userId)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── FIND ARTIST FEED ────────────────────────────────
  async findByArtist(
    artistId: string,
    query: PaginationQueryDto,
    userId?: string,
  ): Promise<PaginatedResult<PostWithRelations>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    // Fetch posts associated with this artist (either directly or via their fandom)
    const fandom = await this.prisma.fandoms.findUnique({
      where: { artist_id: artistId },
      select: { fandom_id: true }
    });

    const where: Prisma.postsWhereInput = {
      OR: [
        { artist_id: artistId },
        { post_as_type: 'artist', post_as_id: artistId },
        ...(fandom ? [{ fandom_id: fandom.fandom_id }] : [])
      ],
      is_deleted: false,
    };

    const [posts, total] = await Promise.all([
      this.prisma.posts.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: this.postInclude(userId),
      }),
      this.prisma.posts.count({ where }),
    ]);

    return {
      data: posts.map((post) => this.mapPost(post, userId)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── FIND ONE ─────────────────────────────────────────
  async findOne(postId: string, userId?: string): Promise<PostWithRelations> {
    const post = await this.prisma.posts.findUnique({
      where: { post_id: postId },
      include: this.postInclude(userId),
    });

    if (!post || post.is_deleted) {
      throw new NotFoundException('Post not found');
    }

    return this.mapPost(post, userId);
  }

  // ─── UPDATE POST ──────────────────────────────────────
  async update(
    postId: string,
    userId: string,
    dto: UpdatePostDto,
  ): Promise<PostWithRelations> {
    const post = await this.prisma.posts.findUnique({
      where: { post_id: postId },
    });

    if (!post || post.is_deleted) {
      throw new NotFoundException('Post not found');
    }

    if (post.user_id !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    await this.prisma.$transaction(async (tx) => {
      if (dto.content !== undefined) {
        await tx.posts.update({
          where: { post_id: postId },
          data: { content: dto.content },
        });
      }

      if (dto.image_urls !== undefined) {
        await tx.post_images.deleteMany({
          where: { post_id: postId },
        });

        if (dto.image_urls.length) {
          await tx.post_images.createMany({
            data: dto.image_urls.map((url, index) => ({
              post_id: postId,
              image_url: url,
              sort_order: index,
            })),
          });
        }
      }
    });

    return this.findOne(postId, userId);
  }

  // ─── SOFT DELETE ──────────────────────────────────────
  async remove(postId: string, userId: string): Promise<{ message: string }> {
    const post = await this.prisma.posts.findUnique({
      where: { post_id: postId },
    });

    if (!post || post.is_deleted) {
      throw new NotFoundException('Post not found');
    }

    // owner ลบได้ + fandom moderator/admin ลบได้
    if (post.user_id !== userId) {
      if (post.fandom_id) {
        const membership = await this.prisma.fandom_members.findUnique({
          where: {
            fandom_id_user_id: {
              fandom_id: post.fandom_id,
              user_id: userId,
            },
          },
        });

        if (!membership || membership.role === 'member') {
          throw new ForbiddenException('You can only delete your own posts');
        }
      } else {
        throw new ForbiddenException('You can only delete your own posts');
      }
    }

    await this.prisma.posts.update({
      where: { post_id: postId },
      data: { is_deleted: true },
    });

    return { message: 'Post deleted successfully' };
  }

  // ─── TOGGLE LOVE ──────────────────────────────────────
  async toggleLove(
    postId: string,
    userId: string,
  ): Promise<{ loved: boolean; like_count: number }> {
    const post = await this.prisma.posts.findUnique({
      where: { post_id: postId },
    });

    if (!post || post.is_deleted) {
      throw new NotFoundException('Post not found');
    }

    const existing = await this.prisma.post_reactions.findUnique({
      where: {
        post_id_user_id: {
          post_id: postId,
          user_id: userId,
        },
      },
    });

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.post_reactions.delete({
          where: { id: existing.id },
        }),
        this.prisma.posts.update({
          where: { post_id: postId },
          data: { like_count: { decrement: 1 } },
        }),
      ]);

      return {
        loved: false,
        like_count: Math.max(0, post.like_count - 1),
      };
    }

    await this.prisma.$transaction([
      this.prisma.post_reactions.create({
        data: {
          post_id: postId,
          user_id: userId,
          type: 'like',
        },
      }),
      this.prisma.posts.update({
        where: { post_id: postId },
        data: { like_count: { increment: 1 } },
      }),
    ]);

    return {
      loved: true,
      like_count: post.like_count + 1,
    };
  }

  // ─── PIN POST (fandom moderator+) ────────────────────
  async togglePin(
    postId: string,
    userId: string,
  ): Promise<{ pinned: boolean }> {
    const post = await this.prisma.posts.findUnique({
      where: { post_id: postId },
    });

    if (!post || post.is_deleted) {
      throw new NotFoundException('Post not found');
    }

    if (!post.fandom_id) {
      throw new ForbiddenException('Only fandom posts can be pinned');
    }

    // เช็คสิทธิ์
    const membership = await this.prisma.fandom_members.findUnique({
      where: {
        fandom_id_user_id: {
          fandom_id: post.fandom_id,
          user_id: userId,
        },
      },
    });

    if (!membership || membership.role === 'member') {
      throw new ForbiddenException('Insufficient permissions to pin posts');
    }

    const updated = await this.prisma.posts.update({
      where: { post_id: postId },
      data: { is_pinned: !post.is_pinned },
    });

    return { pinned: updated.is_pinned };
  }

  // ─── FIND BY USER ────────────────────────────────────
  async findByUser(
    targetUserId: string,
    query: PaginationQueryDto,
    currentUserId?: string,
  ): Promise<PaginatedResult<PostWithRelations>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.postsWhereInput = {
      user_id: targetUserId,
      is_deleted: false,
    };

    const [posts, total] = await Promise.all([
      this.prisma.posts.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: this.postInclude(currentUserId),
      }),
      this.prisma.posts.count({ where }),
    ]);

    return {
      data: posts.map((post) => this.mapPost(post, currentUserId)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── FIND MEMBER FEED ────────────────────────────────
  async findByMember(
    memberId: string,
    query: PaginationQueryDto,
    userId?: string,
  ): Promise<PaginatedResult<PostWithRelations>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.postsWhereInput = {
      post_as_type: 'member',
      post_as_id: memberId,
      is_deleted: false,
    };

    const [posts, total] = await Promise.all([
      this.prisma.posts.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: this.postInclude(userId),
      }),
      this.prisma.posts.count({ where }),
    ]);

    return {
      data: posts.map((post) => this.mapPost(post, userId)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
