# FastMeet

A Next.js 14 application for temporary 10-minute meeting rooms.

## Setup

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Set up environment variables:
Create a `.env` file with:
```
DATABASE_URL="your-database-url"
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_KEY="your-pusher-key"
PUSHER_SECRET="your-pusher-secret"
PUSHER_CLUSTER="your-pusher-cluster"
NEXT_PUBLIC_PUSHER_KEY="your-pusher-key"
NEXT_PUBLIC_PUSHER_CLUSTER="your-pusher-cluster"
```

3. Set up Prisma:
```bash
yarn prisma:generate
yarn prisma:migrate
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

