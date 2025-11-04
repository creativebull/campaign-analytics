# Campaign Analytics Backend

NestJS backend API for multi-tenant campaign analytics platform.

## Setup

### Prerequisites

- Node.js 18+
- Docker and Docker Compose (for PostgreSQL)
- npm or yarn

### Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Start Docker services (from project root):
```bash
docker-compose up -d
```

3. Generate Prisma client:
```bash
npm run prisma:generate
```

4. Run database migrations:
```bash
npm run prisma:migrate
```

5. Seed test tenant with API key:
```bash
npm run prisma:seed
```

6. Start development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000/api`

## API Key Setup

After running the seed script, you'll get a test API key. Use it in all API requests:

**Header:**
```
X-API-Key: test-api-key-12345
```

### Example cURL Request:

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-api-key-12345" \
  -d '{
    "userId": "user_123",
    "eventType": "PAGE_VIEW",
    "properties": {
      "experimentId": "exp_1",
      "variant": "A"
    }
  }'
```

### Creating New Tenants/API Keys:

You can create new tenants via Prisma Studio:
```bash
npm run prisma:studio
```

Or manually insert into the database.

## API Documentation

Swagger documentation is available at:
```
http://localhost:3000/api
```

In Swagger UI, click "Authorize" and enter your API key.

## API Endpoints

### Events
- `POST /api/events` - Ingest campaign events

### Analytics
- `GET /api/analytics/summary` - Get aggregated metrics

### Experiments
- `POST /api/experiments` - Create A/B test configuration
- `GET /api/experiments` - List all experiments
- `GET /api/experiments/:id` - Get experiment details

### Health
- `GET /api/health` - Health check endpoint

## Features

- ✅ Multi-tenant data isolation
- ✅ Rate limiting (10 req/sec)
- ✅ Input validation with class-validator
- ✅ Global exception handling
- ✅ Health checks
- ✅ Swagger documentation
- ✅ API key authentication
