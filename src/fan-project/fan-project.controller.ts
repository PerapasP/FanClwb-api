import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { FanProjectService } from './fan-project.service';
import { CreateFanProjectDto } from './dto/create-fan-project.dto';
import { DonateFanProjectDto } from './dto/donate-fan-project.dto';
import { UpdateFanProjectDto } from './dto/update-fan-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as authInterface from '../auth/interfaces/auth.interface';

@Controller('fan-projects')
export class FanProjectController {
  constructor(private readonly fanProjectService: FanProjectService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: authInterface.AuthenticatedRequest, @Body() dto: CreateFanProjectDto) {
    return this.fanProjectService.create(req.user.user_id, dto);
  }

  @Get()
  findAll() {
    return this.fanProjectService.findAll();
  }

  @Get('fandom/:fandomId')
  findByFandom(@Param('fandomId') fandomId: string) {
    return this.fanProjectService.findByFandom(fandomId);
  }

  @Get('supported')
  @UseGuards(JwtAuthGuard)
  getSupportedProjects(@Req() req: authInterface.AuthenticatedRequest) {
    return this.fanProjectService.getSupportedProjects(req.user.user_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fanProjectService.findOne(id);
  }

  @Get(':id/leaderboard')
  getLeaderboard(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.fanProjectService.getLeaderboard(id, limit ? parseInt(limit, 10) : 20);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Req() req: authInterface.AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateFanProjectDto,
  ) {
    return this.fanProjectService.update(req.user.user_id, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  cancel(
    @Req() req: authInterface.AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.fanProjectService.cancel(req.user.user_id, id);
  }

  @Post(':id/donate')
  @UseGuards(JwtAuthGuard)
  donate(
    @Req() req: authInterface.AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: DonateFanProjectDto,
  ) {
    return this.fanProjectService.donate(req.user.user_id, id, dto);
  }
}
