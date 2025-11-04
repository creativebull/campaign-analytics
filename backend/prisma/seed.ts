import { PrismaClient, EventType, ExperimentStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Seed data configuration
const tenantsData = [
  { name: 'Acme Corp', apiKey: 'test-api-key-12345' },
  { name: 'Demo Company', apiKey: 'demo-api-key-67890' },
];

const experimentsData = [
  {
    tenantKey: 'test-api-key-12345',
    name: 'Homepage CTA Button Test',
    description: 'Testing different CTA button colors',
    status: ExperimentStatus.ACTIVE,
    variants: ['A', 'B'],
    startDate: new Date('2025-01-01'),
    endDate: null,
  },
  {
    tenantKey: 'test-api-key-12345',
    name: 'Pricing Page Layout Test',
    description: 'A/B test for pricing page design',
    status: ExperimentStatus.ACTIVE,
    variants: ['Control', 'Variant'],
    startDate: new Date('2025-01-15'),
    endDate: null,
  },
  {
    tenantKey: 'test-api-key-12345',
    name: 'Email Subject Line Test',
    description: 'Testing email subject line variations',
    status: ExperimentStatus.COMPLETED,
    variants: ['Original', 'New'],
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-31'),
  },
  {
    tenantKey: 'demo-api-key-67890',
    name: 'Landing Page Headline Test',
    description: 'Testing headline variations',
    status: ExperimentStatus.ACTIVE,
    variants: ['Headline A', 'Headline B'],
    startDate: new Date('2025-01-10'),
    endDate: null,
  },
];

const userAssignmentsData = [
  {
    experimentName: 'Homepage CTA Button Test',
    assignments: [
      { userId: 'user_001', variant: 'A' },
      { userId: 'user_002', variant: 'B' },
      { userId: 'user_003', variant: 'A' },
      { userId: 'user_004', variant: 'B' },
      { userId: 'user_005', variant: 'B' },
    ],
  },
  {
    experimentName: 'Pricing Page Layout Test',
    assignments: [
      { userId: 'user_006', variant: 'Control' },
      { userId: 'user_007', variant: 'Variant' },
      { userId: 'user_008', variant: 'Control' },
    ],
  },
];

interface EventData {
  tenantKey: string;
  userId: string;
  eventType: EventType;
  experimentName?: string;
  variant?: string;
  properties?: Record<string, any>;
  minutesAgo?: number;
  timestamp?: Date;
}

const eventsData: EventData[] = [
  // Experiment 1 - Homepage CTA Button Test
  {
    tenantKey: 'test-api-key-12345',
    userId: 'user_001',
    eventType: EventType.PAGE_VIEW,
    experimentName: 'Homepage CTA Button Test',
    variant: 'A',
    minutesAgo: 5,
  },
  {
    tenantKey: 'test-api-key-12345',
    userId: 'user_001',
    eventType: EventType.CLICK,
    experimentName: 'Homepage CTA Button Test',
    variant: 'A',
    properties: { element: 'cta_button' },
    minutesAgo: 4,
  },
  {
    tenantKey: 'test-api-key-12345',
    userId: 'user_001',
    eventType: EventType.CONVERSION,
    experimentName: 'Homepage CTA Button Test',
    variant: 'A',
    properties: { value: 99.99 },
    minutesAgo: 3,
  },
  {
    tenantKey: 'test-api-key-12345',
    userId: 'user_002',
    eventType: EventType.PAGE_VIEW,
    experimentName: 'Homepage CTA Button Test',
    variant: 'B',
    minutesAgo: 10,
  },
  {
    tenantKey: 'test-api-key-12345',
    userId: 'user_003',
    eventType: EventType.PAGE_VIEW,
    experimentName: 'Homepage CTA Button Test',
    variant: 'A',
    minutesAgo: 15,
  },
  {
    tenantKey: 'test-api-key-12345',
    userId: 'user_003',
    eventType: EventType.CLICK,
    experimentName: 'Homepage CTA Button Test',
    variant: 'A',
    minutesAgo: 14,
  },
  {
    tenantKey: 'test-api-key-12345',
    userId: 'user_004',
    eventType: EventType.PAGE_VIEW,
    experimentName: 'Homepage CTA Button Test',
    variant: 'B',
    minutesAgo: 20,
  },
  {
    tenantKey: 'test-api-key-12345',
    userId: 'user_004',
    eventType: EventType.CONVERSION,
    experimentName: 'Homepage CTA Button Test',
    variant: 'B',
    properties: { value: 49.99 },
    minutesAgo: 19,
  },
  {
    tenantKey: 'test-api-key-12345',
    userId: 'user_005',
    eventType: EventType.PAGE_VIEW,
    experimentName: 'Homepage CTA Button Test',
    variant: 'B',
    minutesAgo: 25,
  },
  // Experiment 2 - Pricing Page Layout Test
  {
    tenantKey: 'test-api-key-12345',
    userId: 'user_006',
    eventType: EventType.PAGE_VIEW,
    experimentName: 'Pricing Page Layout Test',
    variant: 'Control',
    minutesAgo: 30,
  },
  {
    tenantKey: 'test-api-key-12345',
    userId: 'user_007',
    eventType: EventType.PAGE_VIEW,
    experimentName: 'Pricing Page Layout Test',
    variant: 'Variant',
    minutesAgo: 35,
  },
  {
    tenantKey: 'test-api-key-12345',
    userId: 'user_007',
    eventType: EventType.CONVERSION,
    experimentName: 'Pricing Page Layout Test',
    variant: 'Variant',
    minutesAgo: 34,
  },
  // Experiment 3 - Email Subject Line Test (Historical)
  {
    tenantKey: 'test-api-key-12345',
    userId: 'user_010',
    eventType: EventType.PAGE_VIEW,
    experimentName: 'Email Subject Line Test',
    variant: 'Original',
    timestamp: new Date('2024-12-15T10:00:00Z'),
  },
  {
    tenantKey: 'test-api-key-12345',
    userId: 'user_011',
    eventType: EventType.PAGE_VIEW,
    experimentName: 'Email Subject Line Test',
    variant: 'New',
    timestamp: new Date('2024-12-15T11:00:00Z'),
  },
  {
    tenantKey: 'test-api-key-12345',
    userId: 'user_011',
    eventType: EventType.CONVERSION,
    experimentName: 'Email Subject Line Test',
    variant: 'New',
    timestamp: new Date('2024-12-15T11:05:00Z'),
  },
  // Experiment 4 - Landing Page Headline Test (Tenant 2)
  {
    tenantKey: 'demo-api-key-67890',
    userId: 'demo_user_001',
    eventType: EventType.PAGE_VIEW,
    experimentName: 'Landing Page Headline Test',
    variant: 'Headline A',
    minutesAgo: 40,
  },
  {
    tenantKey: 'demo-api-key-67890',
    userId: 'demo_user_002',
    eventType: EventType.PAGE_VIEW,
    experimentName: 'Landing Page Headline Test',
    variant: 'Headline B',
    minutesAgo: 45,
  },
  {
    tenantKey: 'demo-api-key-67890',
    userId: 'demo_user_002',
    eventType: EventType.CLICK,
    experimentName: 'Landing Page Headline Test',
    variant: 'Headline B',
    minutesAgo: 44,
  },
  // General events (no experiment)
  {
    tenantKey: 'test-api-key-12345',
    userId: 'user_020',
    eventType: EventType.PAGE_VIEW,
    minutesAgo: 50,
  },
  {
    tenantKey: 'test-api-key-12345',
    userId: 'user_021',
    eventType: EventType.CLICK,
    properties: { element: 'navigation_menu' },
    minutesAgo: 55,
  },
];

async function main() {
  console.log('Seeding database with mock data...\n');

  // Create tenants
  const tenants = await Promise.all(
    tenantsData.map((tenantData) =>
      prisma.tenant.upsert({
        where: { apiKey: tenantData.apiKey },
        update: {},
        create: tenantData,
      }),
    ),
  );

  const tenantMap = new Map(tenants.map((t) => [t.apiKey, t]));
  console.log('✅ Created tenants');

  // Create experiments
  const experiments = await Promise.all(
    experimentsData.map((expData) =>
      prisma.experiment.create({
        data: {
          tenantId: tenantMap.get(expData.tenantKey)!.id,
          name: expData.name,
          description: expData.description,
          status: expData.status,
          variants: expData.variants,
          startDate: expData.startDate,
          endDate: expData.endDate,
        },
      }),
    ),
  );

  const experimentMap = new Map(experiments.map((e) => [e.name, e]));
  console.log('✅ Created experiments');

  // Create user assignments
  const allAssignments = [];
  for (const assignmentGroup of userAssignmentsData) {
    const experiment = experimentMap.get(assignmentGroup.experimentName)!;
    const tenantId = experiments.find((e) => e.id === experiment.id)!.tenantId;
    const tenantObj = Array.from(tenantMap.values()).find((t) => t.id === tenantId)!;

    const assignments = await Promise.all(
      assignmentGroup.assignments.map((assignment) =>
        prisma.userAssignment.create({
          data: {
            tenantId: tenantObj.id,
            experimentId: experiment.id,
            userId: assignment.userId,
            variant: assignment.variant,
          },
        }),
      ),
    );
    allAssignments.push(...assignments);
  }

  console.log('✅ Created user assignments');

  // Create events
  const now = new Date();
  const events = await Promise.all(
    eventsData.map((eventData) => {
      const tenant = tenantMap.get(eventData.tenantKey)!;
      const experiment = eventData.experimentName
        ? experimentMap.get(eventData.experimentName)
        : null;

      return prisma.event.create({
        data: {
          tenantId: tenant.id,
          userId: eventData.userId,
          eventType: eventData.eventType,
          experimentId: experiment?.id || null,
          variant: eventData.variant || null,
          properties: eventData.properties || null,
          timestamp:
            eventData.timestamp ||
            new Date(now.getTime() - (eventData.minutesAgo || 0) * 60 * 1000),
        },
      });
    }),
  );

  console.log(`✅ Created ${events.length} events`);

  // Print summary
  console.log('\n📊 Seed Summary:');
  console.log(`   Tenants: ${tenants.length}`);
  console.log(`   Experiments: ${experiments.length}`);
  console.log(`   User Assignments: ${allAssignments.length}`);
  console.log(`   Events: ${events.length}`);

  console.log('\n🔑 API Keys:');
  tenants.forEach((tenant) => {
    console.log(`   ${tenant.name}: ${tenant.apiKey}`);
  });

  console.log('\n📈 Test Data Overview:');
  console.log(
    `   Experiment 1: Homepage CTA Button Test - Variant A: 2 users (1 conversion), Variant B: 3 users (1 conversion)`,
  );
  console.log(`   Experiment 2: Pricing Page Layout Test - 2 users with events`);
  console.log(
    `   Experiment 3: Email Subject Line Test (COMPLETED) - Historical data from December 2024`,
  );

  console.log('\n✅ Seed completed successfully!');
  console.log('\n💡 Try these endpoints:');
  console.log(`   GET /api/analytics/summary?experimentId=${experiments[0].id}`);
  console.log(`   GET /api/analytics/summary?startDate=2025-01-01&endDate=2025-01-31`);
  console.log(`   GET /api/experiments`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
