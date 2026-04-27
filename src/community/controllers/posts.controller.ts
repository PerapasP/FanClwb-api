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
import { PostsService } from '../services/posts.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import {
  type AuthenticatedRequest,
  type OptionalAuthRequest,
} from '@/auth/interfaces/auth.interface';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreatePostDto) {
    return this.postsService.create(req.user.user_id, dto);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@Query() query: PaginationQueryDto, @Req() req: OptionalAuthRequest) {
    return this.postsService.findAll(query, req.user?.user_id);
  }

  @Get('fandom/:fandomId')
  @UseGuards(OptionalJwtAuthGuard)
  findByFandom(
    @Param('fandomId', ParseUUIDPipe) fandomId: string,
    @Query() query: PaginationQueryDto,
    @Req() req: OptionalAuthRequest,
  ) {
    return this.postsService.findByFandom(fandomId, query, req.user?.user_id);
  }

  @Get('user/:userId')
  @UseGuards(OptionalJwtAuthGuard)
  findByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: PaginationQueryDto,
    @Req() req: OptionalAuthRequest,
  ) {
    return this.postsService.findByUser(userId, query, req.user?.user_id);
  }

  @Get(':postId')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Req() req: OptionalAuthRequest,
  ) {
    return this.postsService.findOne(postId, req.user?.user_id);
  }

  @Patch(':postId')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(postId, req.user.user_id, dto);
  }

  @Delete(':postId')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.postsService.remove(postId, req.user.user_id);
  }

  @Post(':postId/love')
  @UseGuards(JwtAuthGuard)
  toggleLove(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.postsService.toggleLove(postId, req.user.user_id);
  }

  @Post(':postId/pin')
  @UseGuards(JwtAuthGuard)
  togglePin(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.postsService.togglePin(postId, req.user.user_id);
  }
}
