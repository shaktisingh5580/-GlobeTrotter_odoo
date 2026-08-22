import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PostVisibility, ReactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AppConfigService } from '../../config/config.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { CreateCommentDto, UpdateCommentDto } from './dto/create-comment.dto';
import { ReactPostDto, AttachMediaDto } from './dto/react-post.dto';
import {
  PostSummaryResponse,
  PostDetailResponse,
  CommentResponse,
  CommentReplyResponse,
  PostMediaItem,
  TrendingResponse,
  TrendingDestinationItem,
} from './dto/community-response.dto';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Lists community posts with search, tag/destination filters, and pagination.
   */
  async listPosts(
    query: PostQueryDto,
    user?: AuthenticatedUser | null,
  ): Promise<{ items: PostSummaryResponse[]; pagination: { total: number; limit: number; offset: number; has_more: boolean } }> {
    const where: any = {
      deleted_at: null,
      OR: [
        { visibility: PostVisibility.PUBLIC },
        ...(user ? [{ user_id: user.id }] : []),
      ],
    };

    if (query.q) {
      where.AND = [
        {
          OR: [
            { title: { contains: query.q, mode: 'insensitive' } },
            { content: { contains: query.q, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (query.destination_id) where.destination_id = query.destination_id;
    if (query.activity_id) where.activity_id = query.activity_id;
    if (query.user_id) where.user_id = query.user_id;

    const [total, posts] = await Promise.all([
      this.prisma.communityPost.count({ where }),
      this.prisma.communityPost.findMany({
        where,
        take: query.limit,
        skip: query.offset,
        orderBy: { created_at: query.order },
        include: {
          user: { include: { avatar_file: true } },
          destination: true,
          activity: true,
          media: {
            include: { media_file: true },
            orderBy: { display_order: 'asc' },
          },
          reactions: true,
          _count: {
            select: { comments: true },
          },
        },
      }),
    ]);

    const items: PostSummaryResponse[] = posts.map((p) =>
      this.toPostSummary(p, user?.id),
    );

    return {
      items,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        has_more: query.offset + query.limit < total,
      },
    };
  }

  /**
   * Retrieves single post detail with threaded comments and reaction counts.
   */
  async getPost(
    postId: string,
    user?: AuthenticatedUser | null,
  ): Promise<PostDetailResponse> {
    const post = await this.prisma.communityPost.findFirst({
      where: {
        id: postId,
        deleted_at: null,
        OR: [
          { visibility: PostVisibility.PUBLIC },
          ...(user ? [{ user_id: user.id }] : []),
        ],
      },
      include: {
        user: { include: { avatar_file: true } },
        destination: true,
        activity: true,
        media: {
          include: { media_file: true },
          orderBy: { display_order: 'asc' },
        },
        reactions: true,
        comments: {
          where: { deleted_at: null },
          include: {
            user: { include: { avatar_file: true } },
          },
          orderBy: { created_at: 'asc' },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found or is private.');
    }

    const summary = this.toPostSummary(post, user?.id);

    // Build threaded comments hierarchy (top level comments with replies)
    const commentMap = new Map<string, CommentResponse>();
    const topLevelComments: CommentResponse[] = [];

    for (const c of post.comments) {
      const commentObj: CommentResponse = {
        id: c.id,
        post_id: c.post_id,
        author: {
          id: c.user.id,
          first_name: c.user.first_name,
          last_name: c.user.last_name,
          avatar_url: this.resolveAvatarUrl(c.user.avatar_file),
        },
        content: c.content,
        parent_comment_id: c.parent_comment_id,
        replies: [],
        created_at: c.created_at,
        updated_at: c.updated_at,
      };
      commentMap.set(c.id, commentObj);
    }

    for (const c of post.comments) {
      const mapped = commentMap.get(c.id)!;
      if (c.parent_comment_id && commentMap.has(c.parent_comment_id)) {
        commentMap.get(c.parent_comment_id)!.replies.push(mapped);
      } else if (!c.parent_comment_id) {
        topLevelComments.push(mapped);
      }
    }

    return {
      ...summary,
      comments: topLevelComments,
    };
  }

  /**
   * Creates a new community post.
   */
  async createPost(
    dto: CreatePostDto,
    user: AuthenticatedUser,
    requestId: string,
  ): Promise<PostSummaryResponse> {
    if (dto.trip_id) {
      const trip = await this.prisma.trip.findFirst({
        where: { id: dto.trip_id, user_id: user.id, deleted_at: null },
      });
      if (!trip) {
        throw new NotFoundException('Trip not found for this user.');
      }
    }

    if (dto.destination_id) {
      const dest = await this.prisma.destination.findUnique({
        where: { id: dto.destination_id },
      });
      if (!dest) throw new NotFoundException('Destination not found.');
    }

    if (dto.activity_id) {
      const act = await this.prisma.activity.findUnique({
        where: { id: dto.activity_id },
      });
      if (!act) throw new NotFoundException('Activity not found.');
    }

    const post = await this.prisma.communityPost.create({
      data: {
        user_id: user.id,
        title: dto.title,
        content: dto.content,
        trip_id: dto.trip_id || null,
        destination_id: dto.destination_id || null,
        activity_id: dto.activity_id || null,
        visibility: dto.visibility || PostVisibility.PUBLIC,
      },
      include: {
        user: { include: { avatar_file: true } },
        destination: true,
        activity: true,
        media: { include: { media_file: true } },
        reactions: true,
        _count: { select: { comments: true } },
      },
    });

    await this.audit.log({
      action: 'POST_CREATED',
      actor_user_id: user.id,
      resource_type: 'community_post',
      resource_id: post.id,
      request_id: requestId,
      new_values: { title: post.title, visibility: post.visibility },
    });

    return this.toPostSummary(post, user.id);
  }

  /**
   * Updates an authored community post.
   */
  async updatePost(
    postId: string,
    dto: UpdatePostDto,
    user: AuthenticatedUser,
    requestId: string,
  ): Promise<PostSummaryResponse> {
    const existing = await this.prisma.communityPost.findFirst({
      where: { id: postId, user_id: user.id, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('Post not found.');
    }

    const updated = await this.prisma.communityPost.update({
      where: { id: postId },
      data: {
        title: dto.title !== undefined ? dto.title : undefined,
        content: dto.content !== undefined ? dto.content : undefined,
        visibility: dto.visibility !== undefined ? dto.visibility : undefined,
      },
      include: {
        user: { include: { avatar_file: true } },
        destination: true,
        activity: true,
        media: {
          include: { media_file: true },
          orderBy: { display_order: 'asc' },
        },
        reactions: true,
        _count: { select: { comments: true } },
      },
    });

    await this.audit.log({
      action: 'POST_UPDATED',
      actor_user_id: user.id,
      resource_type: 'community_post',
      resource_id: postId,
      request_id: requestId,
      new_values: dto as any,
    });

    return this.toPostSummary(updated, user.id);
  }

  /**
   * Soft-deletes a community post.
   */
  async deletePost(
    postId: string,
    user: AuthenticatedUser,
    requestId: string,
  ): Promise<{ message: string }> {
    const existing = await this.prisma.communityPost.findFirst({
      where: { id: postId, user_id: user.id, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('Post not found.');
    }

    await this.prisma.communityPost.update({
      where: { id: postId },
      data: { deleted_at: new Date() },
    });

    await this.audit.log({
      action: 'POST_DELETED',
      actor_user_id: user.id,
      resource_type: 'community_post',
      resource_id: postId,
      request_id: requestId,
    });

    return { message: 'Post deleted successfully.' };
  }

  /**
   * Attaches an uploaded media file to a post with verified media ownership.
   */
  async attachMedia(
    postId: string,
    dto: AttachMediaDto,
    user: AuthenticatedUser,
  ): Promise<PostMediaItem> {
    const post = await this.prisma.communityPost.findFirst({
      where: { id: postId, user_id: user.id, deleted_at: null },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    const file = await this.prisma.mediaFile.findFirst({
      where: {
        id: dto.media_file_id,
        owner_user_id: user.id,
        deleted_at: null,
      },
    });

    if (!file) {
      throw new NotFoundException('Media file not found or unauthorized.');
    }

    const attached = await this.prisma.communityPostMedia.upsert({
      where: {
        uq_post_media_order: {
          post_id: postId,
          display_order: dto.display_order,
        },
      },
      create: {
        post_id: postId,
        media_file_id: dto.media_file_id,
        display_order: dto.display_order,
      },
      update: {
        media_file_id: dto.media_file_id,
      },
      include: {
        media_file: true,
      },
    });

    const baseUrl = `http://localhost:${this.config.port}`;
    return {
      id: attached.id,
      media_file_id: attached.media_file_id,
      url: `${baseUrl}/uploads/${attached.media_file.storage_key}`,
      display_order: attached.display_order,
    };
  }

  /**
   * Removes media attachment from post.
   */
  async removeMedia(
    postId: string,
    mediaId: string,
    user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    const post = await this.prisma.communityPost.findFirst({
      where: { id: postId, user_id: user.id, deleted_at: null },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    await this.prisma.communityPostMedia.deleteMany({
      where: { id: mediaId, post_id: postId },
    });

    return { message: 'Media attachment removed successfully.' };
  }

  /**
   * Creates a threaded comment or reply.
   */
  async createComment(
    postId: string,
    dto: CreateCommentDto,
    user: AuthenticatedUser,
    requestId: string,
  ): Promise<CommentReplyResponse> {
    const post = await this.prisma.communityPost.findFirst({
      where: { id: postId, deleted_at: null },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    if (dto.parent_comment_id) {
      const parent = await this.prisma.communityComment.findFirst({
        where: {
          id: dto.parent_comment_id,
          post_id: postId,
          deleted_at: null,
        },
      });
      if (!parent) {
        throw new NotFoundException('Parent comment not found for this post.');
      }
    }

    const comment = await this.prisma.communityComment.create({
      data: {
        post_id: postId,
        user_id: user.id,
        parent_comment_id: dto.parent_comment_id || null,
        content: dto.content,
      },
      include: {
        user: { include: { avatar_file: true } },
      },
    });

    await this.audit.log({
      action: 'COMMENT_CREATED',
      actor_user_id: user.id,
      resource_type: 'community_comment',
      resource_id: comment.id,
      request_id: requestId,
      new_values: { post_id: postId },
    });

    return {
      id: comment.id,
      post_id: comment.post_id,
      author: {
        id: comment.user.id,
        first_name: comment.user.first_name,
        last_name: comment.user.last_name,
        avatar_url: this.resolveAvatarUrl(comment.user.avatar_file),
      },
      content: comment.content,
      parent_comment_id: comment.parent_comment_id,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
    };
  }

  /**
   * Updates an authored comment.
   */
  async updateComment(
    commentId: string,
    dto: UpdateCommentDto,
    user: AuthenticatedUser,
    requestId: string,
  ): Promise<CommentReplyResponse> {
    const existing = await this.prisma.communityComment.findFirst({
      where: { id: commentId, user_id: user.id, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('Comment not found.');
    }

    const updated = await this.prisma.communityComment.update({
      where: { id: commentId },
      data: { content: dto.content },
      include: {
        user: { include: { avatar_file: true } },
      },
    });

    await this.audit.log({
      action: 'COMMENT_UPDATED',
      actor_user_id: user.id,
      resource_type: 'community_comment',
      resource_id: commentId,
      request_id: requestId,
    });

    return {
      id: updated.id,
      post_id: updated.post_id,
      author: {
        id: updated.user.id,
        first_name: updated.user.first_name,
        last_name: updated.user.last_name,
        avatar_url: this.resolveAvatarUrl(updated.user.avatar_file),
      },
      content: updated.content,
      parent_comment_id: updated.parent_comment_id,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    };
  }

  /**
   * Soft-deletes a comment.
   */
  async deleteComment(
    commentId: string,
    user: AuthenticatedUser,
    requestId: string,
  ): Promise<{ message: string }> {
    const existing = await this.prisma.communityComment.findFirst({
      where: { id: commentId, user_id: user.id, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('Comment not found.');
    }

    await this.prisma.communityComment.update({
      where: { id: commentId },
      data: { deleted_at: new Date() },
    });

    await this.audit.log({
      action: 'COMMENT_DELETED',
      actor_user_id: user.id,
      resource_type: 'community_comment',
      resource_id: commentId,
      request_id: requestId,
    });

    return { message: 'Comment deleted successfully.' };
  }

  /**
   * Adds or updates a reaction to a post.
   */
  async reactToPost(
    postId: string,
    reactionType: ReactionType,
    user: AuthenticatedUser,
  ): Promise<{ reaction_type: ReactionType; total_reactions: number }> {
    const post = await this.prisma.communityPost.findFirst({
      where: { id: postId, deleted_at: null },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    await this.prisma.communityReaction.upsert({
      where: {
        uq_post_user_reaction: {
          post_id: postId,
          user_id: user.id,
        },
      },
      create: {
        post_id: postId,
        user_id: user.id,
        reaction_type: reactionType,
      },
      update: {
        reaction_type: reactionType,
      },
    });

    const totalReactions = await this.prisma.communityReaction.count({
      where: { post_id: postId },
    });

    return {
      reaction_type: reactionType,
      total_reactions: totalReactions,
    };
  }

  /**
   * Removes a reaction from a post.
   */
  async removeReaction(
    postId: string,
    user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    await this.prisma.communityReaction.deleteMany({
      where: {
        post_id: postId,
        user_id: user.id,
      },
    });

    return { message: 'Reaction removed successfully.' };
  }

  /**
   * Retrieves trending destinations and recent active posts.
   */
  async getTrending(user?: AuthenticatedUser | null): Promise<TrendingResponse> {
    const [destinations, recentPosts] = await Promise.all([
      this.prisma.destination.findMany({
        where: {
          community_posts: {
            some: { deleted_at: null, visibility: PostVisibility.PUBLIC },
          },
        },
        include: {
          _count: {
            select: { community_posts: true },
          },
        },
        orderBy: {
          community_posts: { _count: 'desc' },
        },
        take: 6,
      }),
      this.prisma.communityPost.findMany({
        where: { deleted_at: null, visibility: PostVisibility.PUBLIC },
        orderBy: { created_at: 'desc' },
        take: 6,
        include: {
          user: { include: { avatar_file: true } },
          destination: true,
          activity: true,
          media: {
            include: { media_file: true },
            orderBy: { display_order: 'asc' },
          },
          reactions: true,
          _count: { select: { comments: true } },
        },
      }),
    ]);

    const trendingDestinations: TrendingDestinationItem[] = destinations.map((d) => ({
      id: d.id,
      name: d.name,
      country: d.country,
      image_url: d.image_url,
      post_count: d._count.community_posts,
    }));

    return {
      trending_destinations: trendingDestinations,
      recent_posts: recentPosts.map((p) => this.toPostSummary(p, user?.id)),
    };
  }

  /**
   * Retrieves authenticated user's posts.
   */
  async getMyPosts(user: AuthenticatedUser): Promise<PostSummaryResponse[]> {
    const posts = await this.prisma.communityPost.findMany({
      where: { user_id: user.id, deleted_at: null },
      orderBy: { created_at: 'desc' },
      include: {
        user: { include: { avatar_file: true } },
        destination: true,
        activity: true,
        media: {
          include: { media_file: true },
          orderBy: { display_order: 'asc' },
        },
        reactions: true,
        _count: { select: { comments: true } },
      },
    });

    return posts.map((p) => this.toPostSummary(p, user.id));
  }

  private toPostSummary(post: any, currentUserId?: string): PostSummaryResponse {
    const counts = { like: 0, love: 0, inspire: 0, helpful: 0 };
    let userReaction: ReactionType | null = null;

    if (post.reactions) {
      for (const r of post.reactions) {
        if (r.reaction_type === ReactionType.LIKE) counts.like++;
        else if (r.reaction_type === ReactionType.LOVE) counts.love++;
        else if (r.reaction_type === ReactionType.INSPIRE) counts.inspire++;
        else if (r.reaction_type === ReactionType.HELPFUL) counts.helpful++;

        if (currentUserId && r.user_id === currentUserId) {
          userReaction = r.reaction_type;
        }
      }
    }

    const baseUrl = `http://localhost:${this.config.port}`;
    const media: PostMediaItem[] = post.media
      ? post.media.map((m: any) => ({
          id: m.id,
          media_file_id: m.media_file_id,
          url: m.media_file ? `${baseUrl}/uploads/${m.media_file.storage_key}` : '',
          display_order: m.display_order,
        }))
      : [];

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      author: {
        id: post.user.id,
        first_name: post.user.first_name,
        last_name: post.user.last_name,
        avatar_url: this.resolveAvatarUrl(post.user.avatar_file),
      },
      destination: post.destination
        ? {
            id: post.destination.id,
            name: post.destination.name,
            country: post.destination.country,
          }
        : null,
      activity: post.activity
        ? {
            id: post.activity.id,
            name: post.activity.name,
            category: post.activity.category,
          }
        : null,
      trip_id: post.trip_id ?? null,
      media,
      reactions_count: counts,
      comments_count: post._count?.comments || 0,
      user_reaction: userReaction,
      visibility: post.visibility,
      created_at: post.created_at,
      updated_at: post.updated_at,
    };
  }

  private resolveAvatarUrl(avatarFile: any): string | null {
    if (!avatarFile || !avatarFile.storage_key) return null;
    return `http://localhost:${this.config.port}/uploads/${avatarFile.storage_key}`;
  }
}
