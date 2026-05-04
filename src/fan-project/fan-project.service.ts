import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateFanProjectDto } from './dto/create-fan-project.dto';
import { DonateFanProjectDto } from './dto/donate-fan-project.dto';
import { UpdateFanProjectDto } from './dto/update-fan-project.dto';

@Injectable()
export class FanProjectService {
  constructor(private readonly prisma: PrismaService) {}

  // =============================================
  // CREATE
  // =============================================
  async create(userId: string, dto: CreateFanProjectDto) {
    // Check if user is admin or moderator of the fandom
    const member = await this.prisma.fandom_members.findUnique({
      where: {
        fandom_id_user_id: {
          fandom_id: dto.fandom_id,
          user_id: userId,
        },
      },
    });

    if (!member || (member.role !== 'admin' && member.role !== 'moderator')) {
      throw new ForbiddenException('Only fandom admins or moderators can create projects');
    }

    return this.prisma.fan_projects.create({
      data: {
        fandom_id: dto.fandom_id,
        creator_id: userId,
        title: dto.title,
        description: dto.description,
        image_url: dto.image_url,
        target_amount: dto.target_amount,
        end_date: new Date(dto.end_date),
        tiers: dto.tiers as any,
      },
      include: {
        fandom: {
          select: { name: true, slug: true }
        }
      }
    });
  }

  // =============================================
  // UPDATE
  // =============================================
  async update(userId: string, projectId: string, dto: UpdateFanProjectDto) {
    const project = await this.prisma.fan_projects.findUnique({
      where: { project_id: projectId },
      include: {
        fandom: {
          include: {
            members: {
              where: { user_id: userId },
            },
          },
        },
      },
    });

    if (!project) throw new NotFoundException('Project not found');

    // Check permissions: must be project creator, fandom admin/mod, or system admin
    const membership = project.fandom?.members?.[0];
    const isProjectCreator = project.creator_id === userId;
    const isFandomAdmin = membership && (membership.role === 'admin' || membership.role === 'moderator');

    if (!isProjectCreator && !isFandomAdmin) {
      throw new ForbiddenException('Only the project creator or fandom admins can update projects');
    }

    // Cannot lower target_amount below current_amount
    if (dto.target_amount && dto.target_amount < project.current_amount) {
      throw new BadRequestException('Target amount cannot be lower than current donated amount');
    }

    return this.prisma.fan_projects.update({
      where: { project_id: projectId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.image_url !== undefined && { image_url: dto.image_url }),
        ...(dto.target_amount && { target_amount: dto.target_amount }),
        ...(dto.end_date && { end_date: new Date(dto.end_date) }),
        ...(dto.tiers !== undefined && { tiers: dto.tiers as any }),
      },
      include: {
        fandom: {
          select: { name: true, slug: true, image_url: true }
        },
        _count: {
          select: { donations: true }
        }
      }
    });
  }

  // =============================================
  // CANCEL (Soft Delete)
  // =============================================
  async cancel(userId: string, projectId: string) {
    const project = await this.prisma.fan_projects.findUnique({
      where: { project_id: projectId },
      include: {
        fandom: {
          include: {
            members: {
              where: { user_id: userId },
            },
          },
        },
      },
    });

    if (!project) throw new NotFoundException('Project not found');

    const membership = project.fandom?.members?.[0];
    const isProjectCreator = project.creator_id === userId;
    const isFandomAdmin = membership && (membership.role === 'admin' || membership.role === 'moderator');

    if (!isProjectCreator && !isFandomAdmin) {
      throw new ForbiddenException('Only the project creator or fandom admins can cancel projects');
    }

    if (project.status !== 'active') {
      throw new BadRequestException('Only active projects can be cancelled');
    }

    return this.prisma.fan_projects.update({
      where: { project_id: projectId },
      data: { status: 'cancelled' },
    });
  }

  // =============================================
  // READ - All active projects
  // =============================================
  async findAll() {
    return this.prisma.fan_projects.findMany({
      where: { status: 'active' },
      include: {
        fandom: {
          select: { name: true, slug: true, image_url: true }
        },
        _count: {
          select: { donations: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  // =============================================
  // READ - By fandom
  // =============================================
  async findByFandom(fandomId: string) {
    return this.prisma.fan_projects.findMany({
      where: { fandom_id: fandomId },
      include: {
        _count: {
          select: { donations: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  // =============================================
  // READ - Supported projects
  // =============================================
  async getSupportedProjects(userId: string) {
    return this.prisma.fan_projects.findMany({
      where: {
        donations: {
          some: {
            user_id: userId,
          },
        },
      },
      include: {
        fandom: {
          select: { name: true, slug: true, image_url: true }
        },
        _count: {
          select: { donations: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  // =============================================
  // READ - Single project detail
  // =============================================
  async findOne(id: string) {
    const project = await this.prisma.fan_projects.findUnique({
      where: { project_id: id },
      include: {
        fandom: {
          select: { name: true, slug: true, image_url: true }
        },
        creator: {
          select: { fullname: true, image_url: true }
        },
        donations: {
          take: 20,
          orderBy: { created_at: 'desc' },
          include: {
            user: {
              select: { fullname: true, image_url: true }
            }
          }
        },
        _count: {
          select: { donations: true }
        }
      },
    });

    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  // =============================================
  // LEADERBOARD - Top donors for a project
  // =============================================
  async getLeaderboard(projectId: string, limit: number = 20) {
    const project = await this.prisma.fan_projects.findUnique({
      where: { project_id: projectId },
      select: { project_id: true },
    });

    if (!project) throw new NotFoundException('Project not found');

    // Aggregate donations by user, ranked by total amount
    const leaderboard = await this.prisma.fan_project_donations.groupBy({
      by: ['user_id'],
      where: { project_id: projectId },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    });

    // Fetch user details for the leaderboard
    const userIds = leaderboard.map((entry) => entry.user_id);
    const users = await this.prisma.users.findMany({
      where: { user_id: { in: userIds } },
      select: { user_id: true, fullname: true, image_url: true },
    });

    const userMap = new Map(users.map((u) => [u.user_id, u]));

    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      user: userMap.get(entry.user_id) || { user_id: entry.user_id, fullname: 'Unknown', image_url: null },
      total_amount: entry._sum.amount || 0,
      donation_count: entry._count.id,
    }));
  }

  // =============================================
  // DONATE - With race condition protection & end_date check
  // =============================================
  async donate(userId: string, projectId: string, dto: DonateFanProjectDto) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Lock user row to prevent race conditions (SELECT FOR UPDATE)
      const [user] = await tx.$queryRawUnsafe<{ coins: number; bonus_coins: number }[]>(
        `SELECT coins, bonus_coins FROM users WHERE user_id = $1 FOR UPDATE`,
        userId,
      );

      if (!user) throw new NotFoundException('User not found');

      const totalBalance = user.coins + user.bonus_coins;
      if (totalBalance < dto.amount) {
        throw new BadRequestException('Insufficient coins');
      }

      // 2. Lock project row and check status + end_date
      const [project] = await tx.$queryRawUnsafe<{
        project_id: string;
        title: string;
        status: string;
        end_date: Date;
        current_amount: number;
        target_amount: number;
      }[]>(
        `SELECT project_id, title, status, end_date, current_amount, target_amount FROM fan_projects WHERE project_id = $1 FOR UPDATE`,
        projectId,
      );

      if (!project) throw new NotFoundException('Project not found');

      if (project.status !== 'active') {
        throw new BadRequestException('Project is not active');
      }

      // Check if project has passed its end date
      if (new Date(project.end_date) < new Date()) {
        // Auto-complete the project
        await tx.fan_projects.update({
          where: { project_id: projectId },
          data: { status: 'completed' },
        });
        throw new BadRequestException('This project has ended and is no longer accepting donations');
      }

      // 3. Deduct coins (deduct bonus first)
      let coinsToDeduct = dto.amount;
      let bonusDeducted = 0;
      let mainDeducted = 0;

      if (user.bonus_coins > 0) {
        bonusDeducted = Math.min(user.bonus_coins, coinsToDeduct);
        coinsToDeduct -= bonusDeducted;
      }
      mainDeducted = coinsToDeduct;

      const updatedUser = await tx.users.update({
        where: { user_id: userId },
        data: {
          coins: { decrement: mainDeducted },
          bonus_coins: { decrement: bonusDeducted }
        }
      });

      // 4. Update project amount
      const updatedProject = await tx.fan_projects.update({
        where: { project_id: projectId },
        data: {
          current_amount: { increment: dto.amount }
        }
      });

      // 5. Create donation record
      const donation = await tx.fan_project_donations.create({
        data: {
          project_id: projectId,
          user_id: userId,
          amount: dto.amount,
          message: dto.message,
        }
      });

      // 6. Record coin transaction
      await tx.coin_transactions.create({
        data: {
          user_id: userId,
          type: 'spend',
          amount: mainDeducted,
          bonus_amount: bonusDeducted,
          balance_after: updatedUser.coins,
          bonus_balance_after: updatedUser.bonus_coins,
          note: `Donate to project: ${project.title}`,
          ref_id: donation.id,
        }
      });

      // 7. Check if project goal reached → auto-complete
      if (updatedProject.current_amount >= updatedProject.target_amount) {
        await tx.fan_projects.update({
          where: { project_id: projectId },
          data: { status: 'completed' }
        });
      }

      return donation;
    });
  }
}
