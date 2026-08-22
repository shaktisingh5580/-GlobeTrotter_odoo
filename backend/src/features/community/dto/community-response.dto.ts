import { PostVisibility, ReactionType } from '@prisma/client';

export interface AuthorSummary {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

export interface PostMediaItem {
  id: string;
  media_file_id: string;
  url: string;
  display_order: number;
}

export interface ReactionCounts {
  like: number;
  love: number;
  inspire: number;
  helpful: number;
}

export interface CommentReplyResponse {
  id: string;
  post_id: string;
  author: AuthorSummary;
  content: string;
  parent_comment_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CommentResponse {
  id: string;
  post_id: string;
  author: AuthorSummary;
  content: string;
  parent_comment_id: string | null;
  replies: CommentReplyResponse[];
  created_at: Date;
  updated_at: Date;
}

export interface PostSummaryResponse {
  id: string;
  title: string;
  content: string;
  author: AuthorSummary;
  destination?: {
    id: string;
    name: string;
    country: string;
  } | null;
  activity?: {
    id: string;
    name: string;
    category: string | null;
  } | null;
  trip_id?: string | null;
  media: PostMediaItem[];
  reactions_count: ReactionCounts;
  comments_count: number;
  user_reaction?: ReactionType | null;
  visibility: PostVisibility;
  created_at: Date;
  updated_at: Date;
}

export interface PostDetailResponse extends PostSummaryResponse {
  comments: CommentResponse[];
}

export interface TrendingDestinationItem {
  id: string;
  name: string;
  country: string;
  image_url: string | null;
  post_count: number;
}

export interface TrendingResponse {
  trending_destinations: TrendingDestinationItem[];
  recent_posts: PostSummaryResponse[];
}
