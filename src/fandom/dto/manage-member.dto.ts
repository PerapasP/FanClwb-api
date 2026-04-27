import { IsIn, IsUUID } from 'class-validator';
import { type FandomRole } from '@prisma/client';

export class ManageMemberDto {
  @IsUUID()
  user_id!: string;

  @IsIn(['member', 'moderator', 'admin'])
  role!: FandomRole;
}
