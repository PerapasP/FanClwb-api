/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { VoteDto } from '../dto/vote.dto';
import type {
  CommentWithRelations,
  PaginatedResult,
} from '../interfaces/community.interface';

const MAX_COMMENT_DEPTH = 3;

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── CREATE COMMENT ───────────────────────────────────
  async create(
    postId: string,
    userId: string,
    dto: CreateCommentDto,
  ): Promise<CommentWithRelations> {
    // เช็คว่า post มีจริง
    const post = await this.prisma.posts.findUnique({
      where: { post_id: postId },
    });

    if (!post || post.is_deleted) {
      throw new NotFoundException('Post not found');
    }

    let depth = 0;

    // เช็ค parent comment
    if (dto.parent_id) {
      const parent = await this.prisma.post_comments.findUnique({
        where: { comment_id: dto.parent_id },
      });

      if (!parent || parent.is_deleted) {
        throw new NotFoundException('Parent comment not found');
      }

      if (parent.post_id !== postId) {
        throw new ForbiddenException(
          'Parent comment does not belong to this post',
        );
      }

      if (parent.depth >= MAX_COMMENT_DEPTH) {
        throw new ForbiddenException(
          `Maximum comment depth of ${MAX_COMMENT_DEPTH} reached`,
        );
      }

      depth = parent.depth + 1;
    }

    const comment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.post_comments.create({
        data: {
          post_id: postId,
          user_id: userId,
          content: dto.content ?? null,
          parent_id: dto.parent_id ?? null,
          depth,
        },
      });

      // สร้าง images
      if (dto.image_urls?.length) {
        await tx.comment_images.createMany({
          data: dto.image_urls.map((url, index) => ({
            comment_id: created.comment_id,
            image_url: url,
            sort_order: index,
          })),
        });
      }

      // อัปเดต post comment_count
      await tx.posts.update({
        where: { post_id: postId },
        data: { comment_count: { increment: 1 } },
      });

      // อัปเดต parent reply_count
      if (dto.parent_id) {
        await tx.post_comments.update({
          where: { comment_id: dto.parent_id },
          data: { reply_count: { increment: 1 } },
        });
      }

      return created;
    });

    return this.findOne(comment.comment_id, userId);
  }

  // ─── GET COMMENTS FOR POST (TOP-LEVEL) ────────────────
  async findByPost(
    postId: string,
    query: PaginationQueryDto,
    userId?: string,
  ): Promise<PaginatedResult<CommentWithRelations>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      post_id: postId,
      parent_id: null, // top-level only
      is_deleted: false,
    };

    const [comments, total] = await Promise.all([
      this.prisma.post_comments.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'asc' },
        include: this.commentInclude(userId),
      }),
      this.prisma.post_comments.count({ where }),
    ]);

    return {
      data: comments.map((c) => this.mapComment(c, userId)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── GET REPLIES FOR COMMENT ──────────────────────────
  async findReplies(
    commentId: string,
    query: PaginationQueryDto,
    userId?: string,
  ): Promise<PaginatedResult<CommentWithRelations>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const parent = await this.prisma.post_comments.findUnique({
      where: { comment_id: commentId },
    });

    if (!parent || parent.is_deleted) {
      throw new NotFoundException('Comment not found');
    }

    const where = {
      parent_id: commentId,
      is_deleted: false,
    };

    const [replies, total] = await Promise.all([
      this.prisma.post_comments.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'asc' },
        include: this.commentInclude(userId),
      }),
      this.prisma.post_comments.count({ where }),
    ]);

    return {
      data: replies.map((c) => this.mapComment(c, userId)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── GET SINGLE COMMENT ───────────────────────────────
  async findOne(
    commentId: string,
    userId?: string,
  ): Promise<CommentWithRelations> {
    const comment = await this.prisma.post_comments.findUnique({
      where: { comment_id: commentId },
      include: this.commentInclude(userId),
    });

    if (!comment || comment.is_deleted) {
      throw new NotFoundException('Comment not found');
    }

    return this.mapComment(comment, userId);
  }

  // ─── UPDATE COMMENT ───────────────────────────────────
  async update(
    commentId: string,
    userId: string,
    dto: UpdateCommentDto,
  ): Promise<CommentWithRelations> {
    const comment = await this.prisma.post_comments.findUnique({
      where: { comment_id: commentId },
    });

    if (!comment || comment.is_deleted) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user_id !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    await this.prisma.$transaction(async (tx) => {
      if (dto.content !== undefined) {
        await tx.post_comments.update({
          where: { comment_id: commentId },
          data: { content: dto.content },
        });
      }

      if (dto.image_urls !== undefined) {
        await tx.comment_images.deleteMany({
          where: { comment_id: commentId },
        });

        if (dto.image_urls.length) {
          await tx.comment_images.createMany({
            data: dto.image_urls.map((url, index) => ({
              comment_id: commentId,
              image_url: url,
              sort_order: index,
            })),
          });
        }
      }
    });

    return this.findOne(commentId, userId);
  }

  // ─── SOFT DELETE COMMENT ──────────────────────────────
  async remove(
    commentId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const comment = await this.prisma.post_comments.findUnique({
      where: { comment_id: commentId },
    });

    if (!comment || comment.is_deleted) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user_id !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.post_comments.update({
        where: { comment_id: commentId },
        data: { is_deleted: true },
      });

      // ลด comment_count ของ post
      await tx.posts.update({
        where: { post_id: comment.post_id },
        data: { comment_count: { decrement: 1 } },
      });

      // ลด reply_count ของ parent
      if (comment.parent_id) {
        await tx.post_comments.update({
          where: { comment_id: comment.parent_id },
          data: { reply_count: { decrement: 1 } },
        });
      }
    });

    return { message: 'Comment deleted successfully' };
  }

  // ─── VOTE (UPVOTE / DOWNVOTE) ─────────────────────────
  async vote(
    commentId: string,
    userId: string,
    dto: VoteDto,
  ): Promise<{
    vote: 'upvote' | 'downvote' | null;
    upvote_count: number;
    downvote_count: number;
  }> {
    const comment = await this.prisma.post_comments.findUnique({
      where: { comment_id: commentId },
    });

    if (!comment || comment.is_deleted) {
      throw new NotFoundException('Comment not found');
    }

    const existing = await this.prisma.comment_votes.findUnique({
      where: {
        comment_id_user_id: {
          comment_id: commentId,
          user_id: userId,
        },
      },
    });

    return this.prisma.$transaction(async (tx) => {
      let { upvote_count, downvote_count } = comment;

      if (existing) {
        if (existing.vote_type === dto.vote_type) {
          // กดซ้ำ → ลบ vote ออก (toggle off)
          await tx.comment_votes.delete({
            where: { id: existing.id },
          });

          if (dto.vote_type === 'upvote') upvote_count--;
          else downvote_count--;

          await tx.post_comments.update({
            where: { comment_id: commentId },
            data: { upvote_count, downvote_count },
          });

          return { vote: null, upvote_count, downvote_count };
        }

        // เปลี่ยน vote (up→down หรือ down→up)
        await tx.comment_votes.update({
          where: { id: existing.id },
          data: { vote_type: dto.vote_type },
        });

        if (dto.vote_type === 'upvote') {
          upvote_count++;
          downvote_count--;
        } else {
          upvote_count--;
          downvote_count++;
        }

        await tx.post_comments.update({
          where: { comment_id: commentId },
          data: { upvote_count, downvote_count },
        });

        return { vote: dto.vote_type, upvote_count, downvote_count };
      }

      // vote ใหม่
      await tx.comment_votes.create({
        data: {
          comment_id: commentId,
          user_id: userId,
          vote_type: dto.vote_type,
        },
      });

      if (dto.vote_type === 'upvote') upvote_count++;
      else downvote_count++;

      await tx.post_comments.update({
        where: { comment_id: commentId },
        data: { upvote_count, downvote_count },
      });

      return { vote: dto.vote_type, upvote_count, downvote_count };
    });
  }

  // ─── HELPER: INCLUDE ──────────────────────────────────
  private commentInclude(userId?: string) {
    return {
      user: {
        select: {
          user_id: true,
          fullname: true,
        },
      },
      images: {
        orderBy: { sort_order: 'asc' as const },
      },
      ...(userId
        ? {
            votes: {
              where: { user_id: userId },
              take: 1,
            },
          }
        : {}),
    };
  }

  // ─── HELPER: MAP COMMENT ──────────────────────────────
  private mapComment(comment: any, userId?: string): CommentWithRelations {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { votes, ...rest } = comment;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return {
      ...rest,
      _userVote: userId
        ? ((votes?.[0]?.vote_type as 'upvote' | 'downvote') ?? null)
        : undefined,
    };
  }
}
