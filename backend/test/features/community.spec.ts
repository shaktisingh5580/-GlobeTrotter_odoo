import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Role, PostVisibility, ReactionType } from '@prisma/client';
import { CommunityService } from '../../src/features/community/community.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuditService } from '../../src/audit/audit.service';
import { AppConfigService } from '../../src/config/config.service';
import { AuthenticatedUser } from '../../src/common/decorators/current-user.decorator';

describe('CommunityService (Phase 14: Community Module)', () => {
  let service: CommunityService;
  let prisma: any;
  let audit: any;
  let config: any;

  const mockUser: AuthenticatedUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'author@example.com',
    role: Role.USER,
  };

  const samplePost = {
    id: 'post-100',
    user_id: mockUser.id,
    title: 'My Incredible Trip to Paris',
    content: 'The architectural beauty of the Louvre and Eiffel Tower was breathtaking.',
    trip_id: null,
    destination_id: 'dest-1',
    activity_id: null,
    visibility: PostVisibility.PUBLIC,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    user: {
      id: mockUser.id,
      first_name: 'Shakti',
      last_name: 'Kumar',
      avatar_file: null,
    },
    destination: {
      id: 'dest-1',
      name: 'Paris',
      country: 'France',
    },
    activity: null,
    media: [],
    reactions: [
      {
        id: 'react-1',
        post_id: 'post-100',
        user_id: mockUser.id,
        reaction_type: ReactionType.LIKE,
      },
    ],
    comments: [],
    _count: { comments: 2, reactions: 1 },
  };

  beforeEach(async () => {
    prisma = {
      communityPost: {
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      communityComment: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      communityReaction: {
        count: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      communityPostMedia: {
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      mediaFile: {
        findFirst: jest.fn(),
      },
      destination: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      activity: {
        findUnique: jest.fn(),
      },
      trip: {
        findFirst: jest.fn(),
      },
    };

    audit = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    config = {
      port: 3000,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: AppConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<CommunityService>(CommunityService);
  });

  describe('listPosts', () => {
    it('should return list of public community posts with pagination and reaction counts', async () => {
      prisma.communityPost.count.mockResolvedValue(1);
      prisma.communityPost.findMany.mockResolvedValue([samplePost]);

      const result = await service.listPosts(
        { sort: 'recent', order: 'desc', limit: 20, offset: 0 },
        mockUser,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe(samplePost.title);
      expect(result.items[0].reactions_count.like).toBe(1);
      expect(result.items[0].user_reaction).toBe(ReactionType.LIKE);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('getPost', () => {
    it('should return post detail with threaded comments', async () => {
      const postWithComments = {
        ...samplePost,
        comments: [
          {
            id: 'comm-1',
            post_id: 'post-100',
            content: 'Great photo!',
            parent_comment_id: null,
            created_at: new Date(),
            updated_at: new Date(),
            user: { id: 'user-2', first_name: 'Priya', last_name: 'S', avatar_file: null },
          },
          {
            id: 'comm-2',
            post_id: 'post-100',
            content: 'Thanks Priya!',
            parent_comment_id: 'comm-1',
            created_at: new Date(),
            updated_at: new Date(),
            user: { id: mockUser.id, first_name: 'Shakti', last_name: 'Kumar', avatar_file: null },
          },
        ],
      };

      prisma.communityPost.findFirst.mockResolvedValue(postWithComments);

      const result = await service.getPost(samplePost.id, mockUser);

      expect(result.id).toBe(samplePost.id);
      expect(result.comments).toHaveLength(1); // Top-level comment
      expect(result.comments[0].replies).toHaveLength(1); // Nested reply
      expect(result.comments[0].replies[0].content).toBe('Thanks Priya!');
    });
  });

  describe('createPost', () => {
    it('should create community post and log audit', async () => {
      prisma.destination.findUnique.mockResolvedValue({ id: 'dest-1' });
      prisma.communityPost.create.mockResolvedValue(samplePost);

      const result = await service.createPost(
        {
          title: 'My Incredible Trip to Paris',
          content: 'The architectural beauty was stunning.',
          destination_id: 'dest-1',
        },
        mockUser,
        'req-post-1',
      );

      expect(result.title).toBe(samplePost.title);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'POST_CREATED',
          actor_user_id: mockUser.id,
        }),
      );
    });
  });

  describe('reactToPost', () => {
    it('should upsert reaction and return total count', async () => {
      prisma.communityPost.findFirst.mockResolvedValue(samplePost);
      prisma.communityReaction.upsert.mockResolvedValue({});
      prisma.communityReaction.count.mockResolvedValue(5);

      const result = await service.reactToPost(
        samplePost.id,
        ReactionType.LOVE,
        mockUser,
      );

      expect(result.reaction_type).toBe(ReactionType.LOVE);
      expect(result.total_reactions).toBe(5);
    });
  });

  describe('createComment', () => {
    it('should create comment and log audit', async () => {
      prisma.communityPost.findFirst.mockResolvedValue(samplePost);
      prisma.communityComment.create.mockResolvedValue({
        id: 'comm-1',
        post_id: samplePost.id,
        content: 'Loved reading this!',
        parent_comment_id: null,
        created_at: new Date(),
        updated_at: new Date(),
        user: { id: mockUser.id, first_name: 'Shakti', last_name: 'Kumar', avatar_file: null },
      });

      const result = await service.createComment(
        samplePost.id,
        { content: 'Loved reading this!' },
        mockUser,
        'req-comm-1',
      );

      expect(result.content).toBe('Loved reading this!');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'COMMENT_CREATED',
          actor_user_id: mockUser.id,
        }),
      );
    });
  });
});
