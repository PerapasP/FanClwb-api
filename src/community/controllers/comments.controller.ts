import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '@/auth/guards/optional-jwt-auth.guard';
import { CommentsService } from '../services/comments.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { VoteDto } from '../dto/vote.dto';
import {
  type AuthenticatedRequest,
  type OptionalAuthRequest,
} from '@/auth/interfaces/auth.interface';

@Controller('posts')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post(':postId/comments')
  @UseGuards(JwtAuthGuard)
  create(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(postId, req.user.user_id, dto);
  }

  @Get(':postId/comments')
  @UseGuards(OptionalJwtAuthGuard)
  findByPost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query() query: PaginationQueryDto,
    @Req() req: OptionalAuthRequest,
  ) {
    return this.commentsService.findByPost(postId, query, req.user?.user_id);
  }

  @Get('comments/:commentId/replies')
  @UseGuards(OptionalJwtAuthGuard)
  findReplies(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Query() query: PaginationQueryDto,
    @Req() req: OptionalAuthRequest,
  ) {
    return this.commentsService.findReplies(commentId, query, req.user?.user_id);
  }

  @Patch('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(commentId, req.user.user_id, dto);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.commentsService.remove(commentId, req.user.user_id);
  }

  @Post('comments/:commentId/vote')
  @UseGuards(JwtAuthGuard)
  vote(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: VoteDto,
  ) {
    return this.commentsService.vote(commentId, req.user.user_id, dto);
  }
}
