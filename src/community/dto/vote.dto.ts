import { IsIn } from 'class-validator';

export class VoteDto {
  @IsIn(['upvote', 'downvote'])
  vote_type!: 'upvote' | 'downvote';
}
