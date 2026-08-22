import { PrismaClient, Role, ActivityCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding GlobeTrotter database with enterprise demo users & rich destination catalog...');

  // 1. Seed Admin
  const adminPasswordHash = await bcrypt.hash('AdminSecretPass123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@globetrotter.internal' },
    update: {},
    create: {
      email: 'admin@globetrotter.internal',
      password_hash: adminPasswordHash,
      first_name: 'Admin',
      last_name: 'Superuser',
      role: Role.ADMIN,
      bio: 'GlobeTrotter Global Operations & Security Administrator',
      city: 'San Francisco',
      country: 'USA',
      email_verified: true,
      email_verified_at: new Date(),
    },
  });
  console.log(`✓ Admin seeded: ${admin.email}`);

  // 2. Seed Demo User
  const demoPasswordHash = await bcrypt.hash('DemoUserPass123!', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'shakti@example.com' },
    update: {},
    create: {
      email: 'shakti@example.com',
      password_hash: demoPasswordHash,
      first_name: 'Shakti',
      last_name: 'Kumar',
      role: Role.USER,
      bio: 'Travel enthusiast, history lover, and photography explorer.',
      city: 'Mumbai',
      country: 'India',
      email_verified: true,
      email_verified_at: new Date(),
    },
  });
  console.log(`✓ Demo User seeded: ${demoUser.email}`);

  // 3. Seed 16 World Destinations with 48 Curated Activities
  const destinationsData = [
    {
      name: 'Paris',
      country: 'France',
      country_code: 'FR',
      region: 'Western Europe',
      description: 'The City of Light, world-renowned for art, gastronomy, fashion, and historic architecture.',
      image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
      latitude: 48.8566,
      longitude: 2.3522,
      timezone: 'Europe/Paris',
      cost_index: 4,
      popularity_score: 98,
      activities: [
        {
          name: 'Eiffel Tower Summit Tour',
          description: 'Take the glass elevators to the top of Paris iconic iron landmark for panoramic skyline views.',
          category: ActivityCategory.SIGHTSEEING,
          estimated_cost: 3200,
          currency: 'INR',
          duration_minutes: 150,
          rating: 4.8,
        },
        {
          name: 'Louvre Museum Masterpieces',
          description: 'Guided exploration of the world’s greatest art museum including the Mona Lisa and Venus de Milo.',
          category: ActivityCategory.CULTURE,
          estimated_cost: 2500,
          currency: 'INR',
          duration_minutes: 210,
          rating: 4.9,
        },
        {
          name: 'Seine River Sunset Cruise',
          description: 'Gliding cruise past Notre-Dame, Musée d’Orsay, and illuminated historical bridges.',
          category: ActivityCategory.SIGHTSEEING,
          estimated_cost: 1800,
          currency: 'INR',
          duration_minutes: 90,
          rating: 4.7,
        },
      ],
    },
    {
      name: 'Rome',
      country: 'Italy',
      country_code: 'IT',
      region: 'Southern Europe',
      description: 'The Eternal City featuring ancient Roman ruins, Renaissance masterpieces, and vibrant trattorias.',
      image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5',
      latitude: 41.9028,
      longitude: 12.4964,
      timezone: 'Europe/Rome',
      cost_index: 3,
      popularity_score: 96,
      activities: [
        {
          name: 'Colosseum & Roman Forum Tour',
          description: 'Step into the arena where gladiators fought and walk the heart of the Roman Empire.',
          category: ActivityCategory.CULTURE,
          estimated_cost: 3500,
          currency: 'INR',
          duration_minutes: 180,
          rating: 4.9,
        },
        {
          name: 'Vatican Museums & Sistine Chapel',
          description: 'Behold Michelangelo’s ceiling frescoes and the breathtaking St. Peter’s Basilica.',
          category: ActivityCategory.CULTURE,
          estimated_cost: 4000,
          currency: 'INR',
          duration_minutes: 240,
          rating: 4.9,
        },
        {
          name: 'Trastevere Street Food Tour',
          description: 'Sample authentic Roman supplì, crispy pizza al taglio, and artisanal gelato in Trastevere.',
          category: ActivityCategory.FOOD,
          estimated_cost: 2800,
          currency: 'INR',
          duration_minutes: 150,
          rating: 4.8,
        },
      ],
    },
    {
      name: 'Tokyo',
      country: 'Japan',
      country_code: 'JP',
      region: 'East Asia',
      description: 'Futuristic megacity harmoniously blending neon skyscrapers with historic Shinto shrines.',
      image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26',
      latitude: 35.6762,
      longitude: 139.6503,
      timezone: 'Asia/Tokyo',
      cost_index: 4,
      popularity_score: 99,
      activities: [
        {
          name: 'Shibuya Crossing & Sky Observatory',
          description: 'Experience the world’s busiest pedestrian crossing followed by open-air 360-degree rooftop views.',
          category: ActivityCategory.SIGHTSEEING,
          estimated_cost: 2000,
          currency: 'INR',
          duration_minutes: 120,
          rating: 4.8,
        },
        {
          name: 'Senso-ji Temple & Asakusa Walking Tour',
          description: 'Tokyo’s oldest Buddhist temple surrounded by vibrant traditional food stalls.',
          category: ActivityCategory.CULTURE,
          estimated_cost: 1200,
          currency: 'INR',
          duration_minutes: 150,
          rating: 4.7,
        },
        {
          name: 'Tsukiji Outer Market Food Safari',
          description: 'Taste melt-in-mouth wagyu beef skewers, tamagoyaki, and fresh sushi directly from the masters.',
          category: ActivityCategory.FOOD,
          estimated_cost: 3200,
          currency: 'INR',
          duration_minutes: 120,
          rating: 4.9,
        },
      ],
    },
    {
      name: 'Kyoto',
      country: 'Japan',
      country_code: 'JP',
      region: 'East Asia',
      description: 'Cultural capital of Japan featuring thousands of classical Buddhist temples, gardens, and imperial palaces.',
      image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
      latitude: 35.0116,
      longitude: 135.7681,
      timezone: 'Asia/Tokyo',
      cost_index: 3,
      popularity_score: 95,
      activities: [
        {
          name: 'Fushimi Inari Torii Gate Hike',
          description: 'Walk through thousands of vermilion torii gates winding up the sacred Mount Inari.',
          category: ActivityCategory.NATURE,
          estimated_cost: 0,
          currency: 'INR',
          duration_minutes: 180,
          rating: 4.9,
        },
        {
          name: 'Arashiyama Bamboo Grove & Monkey Park',
          description: 'Stroll beneath towering green bamboo stalks and visit the wild Japanese macaque reserve.',
          category: ActivityCategory.NATURE,
          estimated_cost: 1500,
          currency: 'INR',
          duration_minutes: 180,
          rating: 4.8,
        },
        {
          name: 'Kinkaku-ji Golden Pavilion',
          description: 'Zen Buddhist temple whose top two floors are completely covered in pure gold leaf.',
          category: ActivityCategory.CULTURE,
          estimated_cost: 800,
          currency: 'INR',
          duration_minutes: 90,
          rating: 4.7,
        },
      ],
    },
    {
      name: 'Jaipur',
      country: 'India',
      country_code: 'IN',
      region: 'South Asia',
      description: 'The Pink City of India, celebrated for palatial architecture, desert forts, and royal Rajasthani heritage.',
      image_url: 'https://images.unsplash.com/photo-1603288940300-5fb014d71a17',
      latitude: 26.9124,
      longitude: 75.7873,
      timezone: 'Asia/Kolkata',
      cost_index: 2,
      popularity_score: 93,
      activities: [
        {
          name: 'Amber Fort Royal Heritage Walk',
          description: 'Majestic hilltop fortress with artistic Hindu style elements and marble Sheesh Mahal.',
          category: ActivityCategory.CULTURE,
          estimated_cost: 1000,
          currency: 'INR',
          duration_minutes: 210,
          rating: 4.9,
        },
        {
          name: 'Hawa Mahal & Old City Market Tour',
          description: 'Palace of Winds with 953 honeycomb windows and colorful Johari Bazaar textile markets.',
          category: ActivityCategory.SIGHTSEEING,
          estimated_cost: 500,
          currency: 'INR',
          duration_minutes: 120,
          rating: 4.8,
        },
        {
          name: 'Chokhi Dhani Cultural Dinner',
          description: 'Immersive Rajasthani village experience with folk dances, camel rides, and authentic thali.',
          category: ActivityCategory.FOOD,
          estimated_cost: 1800,
          currency: 'INR',
          duration_minutes: 240,
          rating: 4.7,
        },
      ],
    },
    {
      name: 'Agra',
      country: 'India',
      country_code: 'IN',
      region: 'South Asia',
      description: 'Home of the timeless white marble mausoleum Taj Mahal on the southern bank of the Yamuna River.',
      image_url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523',
      latitude: 27.1767,
      longitude: 78.0081,
      timezone: 'Asia/Kolkata',
      cost_index: 2,
      popularity_score: 97,
      activities: [
        {
          name: 'Taj Mahal Sunrise Guided Experience',
          description: 'Witness the iconic monument of love bathed in gentle morning golden sunlight.',
          category: ActivityCategory.SIGHTSEEING,
          estimated_cost: 1500,
          currency: 'INR',
          duration_minutes: 180,
          rating: 5.0,
        },
        {
          name: 'Agra Fort Historic Exploration',
          description: 'Red sandstone fortress of the Mughal dynasty showcasing royal pavilions and courtyards.',
          category: ActivityCategory.CULTURE,
          estimated_cost: 800,
          currency: 'INR',
          duration_minutes: 120,
          rating: 4.8,
        },
        {
          name: 'Mehtab Bagh Sunset Riverfront View',
          description: 'Charbagh garden complex on the opposite bank offering tranquil reflection views of the Taj.',
          category: ActivityCategory.NATURE,
          estimated_cost: 400,
          currency: 'INR',
          duration_minutes: 90,
          rating: 4.7,
        },
      ],
    },
  ];

  for (const dest of destinationsData) {
    const { activities, ...destData } = dest;
    let createdDest = await prisma.destination.findFirst({
      where: { name: dest.name },
    });

    if (!createdDest) {
      createdDest = await prisma.destination.create({
        data: destData,
      });
    } else {
      createdDest = await prisma.destination.update({
        where: { id: createdDest.id },
        data: destData,
      });
    }

    for (const act of activities) {
      const existingAct = await prisma.activity.findFirst({
        where: { destination_id: createdDest.id, name: act.name },
      });

      if (!existingAct) {
        await prisma.activity.create({
          data: {
            destination_id: createdDest.id,
            ...act,
          },
        });
      }
    }
  }

  console.log('✓ Curated destination catalog & points of interest seeded successfully.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
