export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PostImage {
  id: string;
  image_url: string;
  sort_order: number;
}

export interface PostUser {
  user_id: string;
  fullname: string | null;
  email: string | null;
}

export interface PostWithRelations {
  post_id: string;
  user_id: string;
  content: string | null;
  repost_of_id: string | null;
  post_as_type: string;
  post_as_id: string | null;
  fandom_id: string | null;
  like_count: number;
  comment_count: number;
  repost_count: number;
  is_pinned: boolean;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date | null;
  user: PostUser;
  images: PostImage[];
  repost_of?: PostWithRelations | null;
  fandom?: { fandom_id: string; name: string; slug: string } | null;
  _userReacted?: boolean;
}

export interface CommentImage {
  id: string;
  image_url: string;
  sort_order: number;
}

export interface CommentWithRelations {
  comment_id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  repost_of_id: string | null;
  content: string | null;
  upvote_count: number;
  downvote_count: number;
  reply_count: number;
  repost_count: number;
  depth: number;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date | null;
  user: {
    user_id: string;
    fullname: string | null;
  };
  images: CommentImage[];
  _userVote?: 'upvote' | 'downvote' | null;
}
