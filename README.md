# Campaign Analytics Platform

A full-stack multi-tenant campaign analytics and A/B testing platform built with Next.js, NestJS, TypeScript, and PostgreSQL.

## 🚀 Features

- **Multi-Tenant Architecture**: Complete data isolation per tenant via API key authentication
- **Event Ingestion**: High-throughput event ingestion API with rate limiting
- **Real-Time Analytics**: Aggregated metrics with variant-level breakdown
- **A/B Testing**: Experiment management with variant tracking
- **Interactive Dashboard**: Responsive UI with sorting, filtering, pagination, and bulk actions
- **Dark Mode**: Theme toggle with localStorage persistence
- **Toast Notifications**: User-friendly success/error notifications
- **Comprehensive Testing**: Unit tests for backend services and E2E tests for API flows

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Docker** and Docker Compose
- **Git**

## 🛠️ Local Setup Instructions

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd campaign_analytics
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp env.example .env
```

The `.env` file contains:
```env
POSTGRES_USER=waltzai
POSTGRES_PASSWORD=waltzai_password
POSTGRES_DB=campaign_analytics
POSTGRES_PORT=5432
DATABASE_URL=postgresql://waltzai:waltzai_password@localhost:5432/campaign_analytics?schema=public

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

PORT=3000
NODE_ENV=development
```

### 3. Start Infrastructure Services

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port `5432`
- Redis on port `6379`

Verify services are running:
```bash
docker-compose ps
```

### 4. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database with test tenant and sample data
npm run prisma:seed

# Start development server
npm run start:dev
```

The backend API will be available at `http://localhost:3000/api`

**Note**: The seed script creates a test tenant with API key: `test-api-key-12345`

### 5. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000` (Next.js default port is 3000, but you may need to use 3001 if backend is using 3000)

### 6. Verify Installation

1. **Backend Health Check**: Visit `http://localhost:3000/api/health`
2. **Swagger Documentation**: Visit `http://localhost:3000/api`
3. **Frontend Dashboard**: Visit `http://localhost:3000` (or `http://localhost:3001`)

## 📚 API Documentation

### Swagger UI

Interactive API documentation is available at:
```
http://localhost:3000/api
```

**Using Swagger UI:**
1. Click the "Authorize" button at the top
2. Enter your API key: `test-api-key-12345`
3. Click "Authorize" to authenticate
4. Explore available endpoints

### API Endpoints

#### Events
- `POST /api/events` - Ingest campaign events
  - **Headers**: `X-API-Key: <your-api-key>`
  - **Body**: 
    ```json
    {
      "userId": "user_123",
      "eventType": "PAGE_VIEW" | "CLICK" | "CONVERSION",
      "properties": {
        "experimentId": "exp_1",
        "variant": "A"
      },
      "timestamp": "2025-01-15T10:00:00Z" // optional
    }
    ```

#### Analytics
- `GET /api/analytics/summary` - Get aggregated metrics
  - **Query Params**: 
    - `startDate` (optional): ISO date string
    - `endDate` (optional): ISO date string
    - `experimentId` (optional): Experiment UUID
  - **Response**:
    ```json
    {
      "totalEvents": 1523,
      "uniqueUsers": 412,
      "variants": {
        "A": {
          "events": 801,
          "users": 215,
          "conversions": 45,
          "conversionRate": 0.209
        },
        "B": {
          "events": 722,
          "users": 197,
          "conversions": 52,
          "conversionRate": 0.264
        }
      }
    }
    ```

#### Experiments
- `POST /api/experiments` - Create A/B test configuration
- `GET /api/experiments` - List all experiments for tenant
- `GET /api/experiments/:id` - Get experiment details
- `PATCH /api/experiments/:id` - Update experiment (status, etc.)

#### Health
- `GET /api/health` - Health check endpoint

### Authentication

All API endpoints (except `/health`) require authentication via API key:

```
X-API-Key: <your-api-key>
```

## 🏗️ Architecture Decisions and Trade-offs

### 1. Multi-Tenancy Strategy

**Decision**: API Key-based tenant isolation at the application layer

**Rationale**:
- **Pros**: 
  - Simple to implement and understand
  - No database schema changes per tenant
  - Easy tenant onboarding
  - Works well for SaaS model
- **Cons**: 
  - Requires tenant filtering on every query (performance overhead)
  - Risk of data leakage if filtering is missed
  - Not suitable for extreme scale (billions of tenants)

**Trade-off**: Chose application-level isolation over database-level (row-level security) for simplicity and faster development. For production, consider adding database-level RLS policies as a defense-in-depth measure.

### 2. Database Schema Design

**Decision**: Single database with tenant isolation via `tenantId` foreign keys

**Indexes Strategy**:
- Composite indexes on `(tenantId, timestamp)` for time-range queries
- Composite indexes on `(tenantId, experimentId, timestamp)` for experiment-specific queries
- Index on `(tenantId, userId)` for user-level queries

**Trade-off**: 
- **Pros**: Simple queries, easy to maintain, good for most use cases
- **Cons**: All tenants share the same database, potential for cross-tenant queries if not careful

**Alternative Considered**: Database-per-tenant
- **Pros**: Complete isolation, easier scaling per tenant
- **Cons**: Complex migrations, harder to maintain, expensive for many tenants

### 3. Event Storage

**Decision**: Store all events in a single `events` table with JSON properties

**Rationale**:
- Flexible schema allows different event types without migrations
- Easy to add new event properties
- PostgreSQL JSON support is performant

**Trade-off**:
- **Pros**: Schema flexibility, easier to evolve
- **Cons**: Harder to query specific properties, no type safety at DB level

**Alternative**: Event sourcing with separate tables per event type
- **Pros**: Type safety, better query performance
- **Cons**: Schema changes required for new event types, more complex

### 4. Analytics Aggregation

**Decision**: Real-time aggregation on-demand (not pre-aggregated)

**Rationale**:
- Current implementation calculates metrics on each request
- Simple to implement and understand
- Always accurate (no staleness)

**Trade-off**:
- **Pros**: Real-time accuracy, no pre-aggregation complexity
- **Cons**: Performance degrades with large datasets, repeated calculations

**Alternative**: Materialized views or pre-aggregated tables
- **Pros**: Fast queries, scales better
- **Cons**: Staleness, complexity in maintaining aggregates

### 5. Frontend State Management

**Decision**: React Context API for theme and toast notifications

**Rationale**:
- Simple state management needs (theme, toasts)
- No need for complex state management library
- Built-in React solution

**Trade-off**:
- **Pros**: Simple, no additional dependencies, lightweight
- **Cons**: Not suitable for complex global state, potential performance issues with frequent updates

**Alternative**: Redux/Zustand
- **Pros**: Better for complex state, better performance patterns
- **Cons**: Additional complexity and dependencies for simple use cases

### 6. API Client Architecture

**Decision**: Axios with interceptors for authentication and error handling

**Rationale**:
- Centralized error handling
- Automatic token injection
- Request/response transformation

**Trade-off**:
- **Pros**: Clean separation of concerns, reusable
- **Cons**: Additional dependency, slightly larger bundle

### 7. Testing Strategy

**Decision**: 
- Unit tests for business logic (analytics aggregation)
- E2E tests for critical flows (event ingestion)
- Frontend component tests for UI interactions

**Rationale**:
- Unit tests catch logic errors quickly
- E2E tests verify end-to-end integration
- Component tests ensure UI works correctly

**Trade-off**: Balancing test coverage vs. development speed
- Focused on critical paths rather than 100% coverage
- Trade-off: Some edge cases may not be covered, but development velocity is maintained

## 📈 Scaling Considerations (10x Traffic)

### Current Bottlenecks

1. **Analytics Aggregation**: In-memory aggregation of all events
2. **Database Queries**: No connection pooling optimization
3. **Event Ingestion**: Synchronous processing
4. **Frontend**: Client-side data fetching and processing

### Scaling Strategy for 10x Traffic

#### 1. Database Optimization

**Immediate Actions:**
- **Connection Pooling**: Configure Prisma connection pool
  ```typescript
  // prisma.service.ts
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
      pool: {
        min: 2,
        max: 20,
      }
    }
  }
  ```

- **Read Replicas**: Separate read and write operations
  - Use read replicas for analytics queries
  - Primary database for writes only

- **Partitioning**: Partition events table by date
  ```sql
  -- Partition events by month
  CREATE TABLE events_2025_01 PARTITION OF events
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
  ```

- **Index Optimization**: Add covering indexes for common queries
  ```sql
  CREATE INDEX idx_events_analytics_covering 
  ON events(tenant_id, experiment_id, timestamp) 
  INCLUDE (event_type, variant, user_id);
  ```

#### 2. Caching Layer

**Implementation:**
- **Redis Cache**: Cache analytics summaries
  ```typescript
  // Cache key: `analytics:${tenantId}:${experimentId}:${startDate}:${endDate}`
  // TTL: 5 minutes
  ```
  
- **Cache Invalidation**: Invalidate on new events
  - Use Redis pub/sub for cache invalidation
  - Invalidate relevant cache keys when events are created

**Impact**: Reduces database load by 80-90% for analytics queries

#### 3. Event Ingestion Optimization

**Asynchronous Processing:**
- **Message Queue**: Use RabbitMQ or AWS SQS
  ```
  Client → API → Queue → Worker → Database
  ```
  
- **Batch Processing**: Process events in batches
  - Collect events for 100ms or 1000 events (whichever comes first)
  - Bulk insert to database

- **Event Batching API**: New endpoint for bulk ingestion
  ```typescript
  POST /api/events/batch
  Body: { events: [...] }
  ```

**Impact**: Handle 10x more events per second

#### 4. Analytics Pre-Aggregation

**Materialized Views or Aggregation Tables:**
```sql
CREATE MATERIALIZED VIEW analytics_summary AS
SELECT 
  tenant_id,
  experiment_id,
  variant,
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as events,
  COUNT(DISTINCT user_id) as users,
  COUNT(*) FILTER (WHERE event_type = 'CONVERSION') as conversions
FROM events
GROUP BY tenant_id, experiment_id, variant, hour;

-- Refresh every 5 minutes
REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_summary;
```

**Background Jobs:**
- Use Bull or similar for scheduled aggregation jobs
- Run every 5 minutes to update materialized views

**Impact**: Analytics queries become O(1) instead of O(n)

#### 5. API Rate Limiting Enhancement

**Current**: 10 req/sec per tenant (global)

**Improved**:
- **Per-endpoint limits**: Different limits for different endpoints
  - Events: 100 req/sec
  - Analytics: 10 req/sec
  - Experiments: 5 req/sec

- **Distributed Rate Limiting**: Use Redis for distributed rate limiting
  ```typescript
  // Redis-based rate limiter
  const key = `ratelimit:${tenantId}:${endpoint}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60);
  if (count > limit) throw new ThrottlerException();
  ```

#### 6. Frontend Optimization

**Current**: Client-side filtering, sorting, pagination

**Optimizations**:
- **Server-side Pagination**: Move pagination to backend
- **Virtual Scrolling**: For large datasets
- **Query Optimization**: Use React Query for caching and background refetching
- **Code Splitting**: Lazy load components
- **CDN**: Serve static assets via CDN

#### 7. Database Scaling

**Horizontal Scaling:**
- **Sharding**: Shard by tenant_id
  ```
  Tenant 1-1000 → Database 1
  Tenant 1001-2000 → Database 2
  ```

- **Read Replicas**: 3-5 read replicas for analytics queries
- **Connection Pooling**: PgBouncer for connection pooling

**Vertical Scaling:**
- Increase database instance size
- Use SSD storage
- Optimize PostgreSQL configuration

#### 8. Monitoring and Observability

**Essential Metrics:**
- Event ingestion rate
- Analytics query latency
- Database connection pool usage
- Cache hit rate
- Error rates by endpoint

**Tools:**
- **APM**: New Relic, Datadog, or Prometheus + Grafana
- **Logging**: Structured logging with correlation IDs
- **Alerting**: Set up alerts for:
  - High error rates
  - Slow queries (>1s)
  - Database connection pool exhaustion

#### 9. Load Testing

**Before Scaling:**
```bash
# Use k6 or Artillery for load testing
artillery quick --count 1000 --num 10 \
  http://localhost:3000/api/events
```

**Target Metrics:**
- 10,000 events/second ingestion
- <100ms analytics query latency (p95)
- <50ms API response time (p95)

### Implementation Priority

1. **Phase 1 (Week 1)**: Caching layer + connection pooling
2. **Phase 2 (Week 2)**: Event batching + message queue
3. **Phase 3 (Week 3)**: Pre-aggregation + materialized views
4. **Phase 4 (Week 4)**: Read replicas + sharding strategy

### Cost Considerations

**Current (Small Scale)**:
- Single PostgreSQL instance: ~$50/month
- Single Redis instance: ~$20/month
- Application servers: ~$100/month

**10x Scale (Estimated)**:
- Database (with replicas): ~$500/month
- Redis cluster: ~$200/month
- Application servers (load balanced): ~$500/month
- Message queue: ~$100/month
- **Total**: ~$1,300/month

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 📁 Project Structure

```
campaign_analytics/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── analytics/      # Analytics aggregation logic
│   │   ├── events/         # Event ingestion
│   │   ├── experiments/    # A/B test management
│   │   ├── common/         # Guards, decorators, filters
│   │   └── prisma/         # Database service
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── migrations/     # Database migrations
│   └── test/               # E2E tests
├── frontend/                # Next.js dashboard
│   ├── app/                # Next.js App Router
│   ├── components/         # React components
│   ├── contexts/           # React contexts
│   ├── lib/                # Utilities and API client
│   └── hooks/              # Custom React hooks
├── docker-compose.yml       # Infrastructure services
└── README.md               # This file
```

## 🔐 Security Considerations

1. **API Key Security**: Rotate API keys regularly, use strong keys
2. **Input Validation**: All inputs validated via class-validator
3. **SQL Injection**: Prisma ORM prevents SQL injection
4. **Rate Limiting**: Prevents abuse (10 req/sec per tenant)
5. **CORS**: Configured for production domains only
6. **Environment Variables**: Never commit `.env` files

## 🚀 Deployment

### Production Checklist

- [ ] Set strong `POSTGRES_PASSWORD`
- [ ] Set strong `JWT_SECRET`
- [ ] Configure production database
- [ ] Set up Redis cluster
- [ ] Configure CORS for production domains
- [ ] Set up monitoring and alerting
- [ ] Configure CDN for frontend
- [ ] Set up CI/CD pipeline
- [ ] Enable database backups
- [ ] Configure SSL/TLS certificates

## 📝 License

MIT

## 👥 Contributors

Built for Waltz AI Full Stack Developer Screening Challenge

---

For questions or issues, please open an issue in the repository.
