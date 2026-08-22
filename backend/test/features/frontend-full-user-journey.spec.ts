import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { Role } from '@prisma/client';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { HashUtil } from '../../src/common/utils/hash.util';

describe('Frontend Full User Journey Simulation (Live End-to-End Test)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Track session tokens & entities across the journey
  let userAToken: string;
  let userARefreshToken: string;
  let userBToken: string;
  let adminToken: string;
  let tripId: string;
  let stopId: string;
  let sectionId: string;
  let destinationId: string;
  let activityId: string;
  let shareToken: string;
  let postId: string;
  let commentId: string;

  const timestamp = Date.now();
  const emailA = `traveler.sophia.${timestamp}@example.com`;
  const emailB = `traveler.alex.${timestamp}@example.com`;
  const adminEmail = `admin.sim.${timestamp}@globetrotter.internal`;
  const password = 'Password123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    // Create verified admin account for testing
    const passwordHash = await HashUtil.hashPassword(password, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password_hash: passwordHash,
        first_name: 'Admin',
        last_name: 'Superuser',
        role: Role.ADMIN,
        email_verified: true,
        email_verified_at: new Date(),
      },
    });
  }, 60000);

  afterAll(async () => {
    // Cleanup created test accounts
    await prisma.user.deleteMany({
      where: {
        email: { in: [emailA, emailB, adminEmail] },
      },
    });
    await app.close();
  });

  describe('1. Authentication & Registration (Frontend Onboarding)', () => {
    it('Frontend sends POST /api/v1/auth/register -> creates account and returns tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: emailA,
          password,
          first_name: 'Sophia',
          last_name: 'Traveler',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(emailA);
      expect(res.body.data.access_token).toBeDefined();
      expect(res.body.data.refresh_token).toBeDefined();
      userARefreshToken = res.body.data.refresh_token;
    });

    it('Frontend sends POST /api/v1/auth/login -> logs in and obtains access_token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: emailA,
          password,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      userAToken = res.body.data.access_token;
      userARefreshToken = res.body.data.refresh_token;
      expect(userAToken).toBeDefined();
    });

    it('Frontend sends POST /api/v1/auth/refresh -> rotates refresh token and obtains new access token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: userARefreshToken })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.access_token).toBeDefined();
      userAToken = res.body.data.access_token;
    });

    it('Frontend registers second user Alex for collaboration tests', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: emailB,
          password,
          first_name: 'Alex',
          last_name: 'Explorer',
        })
        .expect(201);

      userBToken = res.body.data.access_token;
      expect(userBToken).toBeDefined();
    });

    it('Frontend logs in as Admin to obtain adminToken', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: adminEmail,
          password,
        })
        .expect(200);

      adminToken = res.body.data.access_token;
      expect(adminToken).toBeDefined();
    });
  });

  describe('2. User Profile Setup & Dynamic Statistics', () => {
    it('Frontend sends GET /api/v1/users/me -> retrieves authenticated user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.email).toBe(emailA);
      expect(res.body.data.first_name).toBe('Sophia');
    });

    it('Frontend sends GET /api/v1/users/me/stats -> retrieves live user statistics', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me/stats')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.total_trips).toBe(0);
      expect(res.body.data.saved_destinations).toBe(0);
    });

    it('Frontend sends PATCH /api/v1/users/me -> updates city, country, and bio', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          city: 'San Francisco',
          country: 'USA',
          bio: 'Passionate globe trotter and photography enthusiast',
        })
        .expect(200);

      expect(res.body.data.city).toBe('San Francisco');
      expect(res.body.data.bio).toBe('Passionate globe trotter and photography enthusiast');
    });
  });

  describe('3. Destination & Activity Catalog Discovery', () => {
    it('Frontend sends GET /api/v1/destinations -> lists seeded destinations', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/destinations')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      destinationId = res.body.data[0].id;
    });

    it('Frontend sends POST /api/v1/destinations/:destinationId/save -> saves destination', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/destinations/${destinationId}/save`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.message).toBe('Destination saved to bookmarks');
    });

    it('Frontend sends GET /api/v1/destinations/:destinationId/activities -> retrieves activities', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/destinations/${destinationId}/activities`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      activityId = res.body.data[0].id;
    });
  });

  describe('4. Trip Creation & Itinerary Architecture', () => {
    it('Frontend sends POST /api/v1/trips -> creates "Epic Japan Tour 2026"', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/trips')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Epic Japan Tour 2026',
          description: 'Exploring modern Tokyo and historical Kyoto',
          start_date: '2026-10-01',
          end_date: '2026-10-10',
          budget_limit: 300000,
          currency: 'JPY',
        })
        .expect(201);

      expect(res.body.data.title).toBe('Epic Japan Tour 2026');
      tripId = res.body.data.id;
    });

    it('Frontend sends POST /api/v1/trips/:tripId/stops -> adds stop to trip', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/trips/${tripId}/stops`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          destination_id: destinationId,
          arrival_date: '2026-10-01',
          departure_date: '2026-10-06',
          stop_order: 1,
        })
        .expect(201);

      expect(res.body.data.destination.id).toBe(destinationId);
      stopId = res.body.data.id;
    });

    it('Frontend sends POST /api/v1/trips/:tripId/sections -> adds trip section', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/trips/${tripId}/sections`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Tokyo Exploration',
          section_type: 'ACTIVITY',
          start_date: '2026-10-01',
          end_date: '2026-10-05',
          planned_budget: 80000,
          currency: 'JPY',
          section_order: 1,
        })
        .expect(201);

      expect(res.body.data.title).toBe('Tokyo Exploration');
      sectionId = res.body.data.id;
    });

    it('Frontend sends POST /api/v1/trips/:tripId/itinerary/items -> schedules activity', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/trips/${tripId}/itinerary/items`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          trip_stop_id: stopId,
          activity_id: activityId,
          item_date: '2026-10-02',
          start_time: '09:00',
          end_time: '12:00',
          item_order: 0,
        })
        .expect(201);

      expect(res.body.data.item_date).toBe('2026-10-02');
    });

    it('Frontend sends GET /api/v1/trips/:tripId/itinerary -> retrieves day-by-day itinerary', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/trips/${tripId}/itinerary`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.days.length).toBeGreaterThan(0);
    });
  });

  describe('5. Budget & Expenses Module', () => {
    it('Frontend sends POST /api/v1/trips/:tripId/budget/expenses -> logs hotel expense', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/trips/${tripId}/budget/expenses`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Tokyo Hotel 5 Nights',
          amount: 60000,
          category: 'STAY',
          currency: 'JPY',
          expense_date: '2026-10-01',
          trip_section_id: sectionId,
        })
        .expect(201);

      expect(res.body.data.amount).toBe(60000);
    });

    it('Frontend sends POST /api/v1/trips/:tripId/budget/expenses -> logs dining expense', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/trips/${tripId}/budget/expenses`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Sushi Tsukiji Tasting Menu',
          amount: 15000,
          category: 'MEALS',
          currency: 'JPY',
          expense_date: '2026-10-02',
        })
        .expect(201);

      expect(res.body.data.amount).toBe(15000);
    });

    it('Frontend sends GET /api/v1/trips/:tripId/budget -> retrieves dynamically calculated summary', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/trips/${tripId}/budget`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.total_budget).toBe(300000);
      expect(res.body.data.total_spent).toBe(75000);
      expect(res.body.data.remaining).toBe(225000);
      expect(res.body.data.expense_count).toBe(2);
    });

    it('Frontend sends GET /api/v1/trips/:tripId/budget/breakdown -> checks category allocations', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/trips/${tripId}/budget/breakdown`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.categories.length).toBeGreaterThan(0);
      const stay = res.body.data.categories.find((c: any) => c.category === 'STAY');
      expect(stay.total).toBe(60000);
    });
  });

  describe('6. Trip Sharing, Public Viewing & Copy-to-Account', () => {
    it('Frontend sends POST /api/v1/sharing/trips/:tripId/share -> generates 16-character crypto token', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/sharing/trips/${tripId}/share`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ visibility: 'PUBLIC' })
        .expect(201);

      shareToken = res.body.data.share_token;
      expect(shareToken).toHaveLength(16);
    });

    it('Unauthenticated public user views shared trip (Zero PII or budget leakage)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/sharing/shared/${shareToken}`)
        .expect(200);

      expect(res.body.data.title).toBe('Epic Japan Tour 2026');
      expect(res.body.data.user_id).toBeUndefined();
      expect(res.body.data.user).toBeUndefined();
      expect(res.body.data.budget_limit).toBeUndefined();
      expect(res.body.data.expenses).toBeUndefined();
    });

    it('Alex copies Sophia shared trip into his account -> receives independent copy', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/sharing/shared/${shareToken}/copy`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(201);

      expect(res.body.data.copied_from).toBe(tripId);
      expect(res.body.data.trip_id).toBeDefined();
    });
  });

  describe('7. Community Feed, Reactions & Threaded Discussions', () => {
    it('Sophia creates community post -> visible in public feed', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/community/posts')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Top 5 hidden ramen spots in Tokyo!',
          content: 'Here is my curated list of unforgettable ramen dining experiences in Tokyo...',
          destination_id: destinationId,
        })
        .expect(201);

      postId = res.body.data.id;
      expect(res.body.data.title).toBe('Top 5 hidden ramen spots in Tokyo!');
    });

    it('Alex reacts to Sophia post with LOVE', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/community/posts/${postId}/react`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ reaction_type: 'LOVE' })
        .expect(200);

      expect(res.body.data.reaction_type).toBe('LOVE');
    });

    it('Alex comments on Sophia post', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/community/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ content: 'Saving this for my upcoming trip in November!' })
        .expect(201);

      commentId = res.body.data.id;
    });

    it('Sophia replies to Alex comment creating threaded hierarchy', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/community/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          content: 'You will love the spicy miso ramen in Shibuya!',
          parent_comment_id: commentId,
        })
        .expect(201);

      expect(res.body.data.parent_comment_id).toBe(commentId);
    });

    it('Frontend retrieves full post with threaded discussion tree', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/community/posts/${postId}`)
        .expect(200);

      expect(res.body.data.comments).toHaveLength(1); // Top-level comment
      expect(res.body.data.comments[0].replies).toHaveLength(1); // Nested reply
      expect(res.body.data.reactions_count.love).toBe(1);
    });
  });

  describe('8. Admin Dashboard Backend Operations', () => {
    it('Admin retrieves platform stats overview', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.total_users).toBeGreaterThanOrEqual(2);
      expect(res.body.data.total_trips).toBeGreaterThanOrEqual(1);
      expect(res.body.data.total_expenses_amount).toBeGreaterThanOrEqual(75000);
    });

    it('Admin retrieves user directory', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('Admin inspects live telemetry analytics trends', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/analytics/trends')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.total_events).toBeGreaterThan(0);
    });

    it('Admin views security audit log trail', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('Normal user receives 404 Not Found (IDOR defense) when trying to access admin endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(404);
    });
  });
});
