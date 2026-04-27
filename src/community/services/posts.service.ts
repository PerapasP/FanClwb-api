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
        },
      },
      repost_of: {
        include: {
          user: {
            select: {
              user_id: true,
              fullname: true,
              email: true,
            },
          },
          images: {
            orderBy: { sort_order: 'asc' },
          },
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

  // ─── CREATE POST ──────────────────────────────────────
  async create(userId: string, dto: CreatePostDto): Promise<PostWithRelations> {
    // validate repost
    if (dto.repost_of_id) {
      const original = await this.prisma.posts.findUnique({
        where: { post_id: dto.repost_of_id },
      });

      if (!original || original.is_deleted) {
        throw new NotFoundException('Original post not found');
      }
    }

    // validate fandom
    if (dto.fandom_id) {
      await this.validateFandomMembership(dto.fandom_id, userId);
    }

    // validate post as
    const postAsType = dto.post_as_type ?? 'user';
    await this.validatePostAs(userId, postAsType, dto.post_as_id);

    // create
    const post = await this.prisma.$transaction(async (tx) => {
      const created = await tx.posts.create({
        data: {
          user_id: userId,
          content: dto.content ?? null,
          repost_of_id: dto.repost_of_id ?? null,
          post_as_type: postAsType,
          post_as_id: dto.post_as_id ?? null,
          fandom_id: dto.fandom_id ?? null,
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

      // increment repost count
      if (dto.repost_of_id) {
        await tx.posts.update({
          where: { post_id: dto.repost_of_id },
          data: { repost_count: { increment: 1 } },
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
      fandom_id: null, // feed ทั่วไป ไม่ดึง fandom posts
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
}
