# Campaign Analytics Frontend

Next.js 14+ frontend application for the Campaign Analytics Dashboard.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── dashboard/        # Dashboard components
│   └── toast/            # Toast notifications
├── contexts/             # React contexts
│   └── theme-context.tsx # Theme provider
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and API clients
│   ├── api/              # API service modules
│   └── utils.ts          # Utility functions
└── types/                # TypeScript type definitions
```

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Axios
- react-hook-form + zod
- Lucide icons
- Recharts (for charts)
