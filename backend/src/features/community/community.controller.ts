import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReactionType } from '@prisma/client';
import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { CreateCommentDto, UpdateCommentDto } from './dto/create-comment.dto';
import { ReactPostDto, AttachMediaDto } from './dto/react-post.dto';
import {
  PostSummaryResponse,
  PostDetailResponse,
  CommentReplyResponse,
  PostMediaItem,
  TrendingResponse,
} from './dto/community-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequestId } from '../../common/decorators/request-id.decorator';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Public()
  @Get('posts')
  @HttpCode(HttpStatus.OK)
  async listPosts(
    @Query() query: PostQueryDto,
    @CurrentUser() user: AuthenticatedUser | null,
  ): Promise<{ items: PostSummaryResponse[]; pagination: { total: number; limit: number; offset: number; has_more: boolean } }> {
    return this.communityService.listPosts(query, user);
  }

  @Public()
  @Get('trending')
  @HttpCode(HttpStatus.OK)
  async getTrending(
    @CurrentUser() user: AuthenticatedUser | null,
  ): Promise<TrendingResponse> {
    return this.communityService.getTrending(user);
  }

  @Get('my-posts')
  @HttpCode(HttpStatus.OK)
  async getMyPosts(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PostSummaryResponse[]> {
    return this.communityService.getMyPosts(user);
  }

  @Post('posts')
  @HttpCode(HttpStatus.CREATED)
  async createPost(
    @Body() dto: CreatePostDto,
    @CurrentUser() user: AuthenticatedUser,
    @RequestId() requestId: string,
  ): Promise<PostSummaryResponse> {
    return this.communityService.createPost(dto, user, requestId);
  }

  @Public()
  @Get('posts/:postId')
  @HttpCode(HttpStatus.OK)
  async getPost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser() user: AuthenticatedUser | null,
  ): Promise<PostDetailResponse> {
    return this.communityService.getPost(postId, user);
  }

  @Patch('posts/:postId')
  @HttpCode(HttpStatus.OK)
  async updatePost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: UpdatePostDto,
    @CurrentUser() user: AuthenticatedUser,
    @RequestId() requestId: string,
  ): Promise<PostSummaryResponse> {
    return this.communityService.updatePost(postId, dto, user, requestId);
  }

  @Delete('posts/:postId')
  @HttpCode(HttpStatus.OK)
  async deletePost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser() user: AuthenticatedUser,
    @RequestId() requestId: string,
  ): Promise<{ message: string }> {
    return this.communityService.deletePost(postId, user, requestId);
  }

  @Post('posts/:postId/media')
  @HttpCode(HttpStatus.CREATED)
  async attachMedia(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: AttachMediaDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PostMediaItem> {
    return this.communityService.attachMedia(postId, dto, user);
  }

  @Delete('posts/:postId/media/:mediaId')
  @HttpCode(HttpStatus.OK)
  async removeMedia(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    return this.communityService.removeMedia(postId, mediaId, user);
  }

  @Post('posts/:postId/comments')
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthenticatedUser,
    @RequestId() requestId: string,
  ): Promise<CommentReplyResponse> {
    return this.communityService.createComment(postId, dto, user, requestId);
  }

  @Patch('comments/:commentId')
  @HttpCode(HttpStatus.OK)
  async updateComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: AuthenticatedUser,
    @RequestId() requestId: string,
  ): Promise<CommentReplyResponse> {
    return this.communityService.updateComment(commentId, dto, user, requestId);
  }

  @Delete('comments/:commentId')
  @HttpCode(HttpStatus.OK)
  async deleteComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @RequestId() requestId: string,
  ): Promise<{ message: string }> {
    return this.communityService.deleteComment(commentId, user, requestId);
  }

  @Post('posts/:postId/react')
  @HttpCode(HttpStatus.OK)
  async reactToPost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: ReactPostDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ reaction_type: ReactionType; total_reactions: number }> {
    return this.communityService.reactToPost(
      postId,
      dto.reaction_type || ReactionType.LIKE,
      user,
    );
  }

  @Delete('posts/:postId/react')
  @HttpCode(HttpStatus.OK)
  async removeReaction(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    return this.communityService.removeReaction(postId, user);
  }
}
