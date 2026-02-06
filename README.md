<<<<<<< HEAD
# TeacherRatingTM
Anonymous teacher rating platform built with Next.js 14, Supabase, and NextAuth. Students can rate and comment without accounts; admins manage teachers, moderation, analytics, and weekly leaderboards. Mobile‑first UI with search, filters, and stats.
=======
# RateMyTeacher - Anonymous Teacher Rating Platform

A production-ready Next.js application for anonymous teacher ratings and reviews. Students can rate teachers, leave comments, and view weekly leaderboards without creating an account.

## Features

### Public Features
- **Browse Teachers**: View all active teachers with search and filter
- **Teacher Profiles**: Detailed pages with ratings, comments, and statistics
- **5-Star Rating System**: Anonymous rating submission (1 rating per teacher per device)
- **Anonymous Comments**: Submit comments with moderation
- **Weekly Leaderboards**: Top 10 and Bottom 10 rated teachers (auto-reset weekly)
- **Responsive Design**: Mobile-first, works on all devices

### Admin Features
- **Secure Login**: Email/password authentication with NextAuth.js
- **Teacher Management**: Full CRUD operations for teacher profiles
- **Comment Moderation**: Approve/reject/delete comments
- **Analytics Dashboard**: Platform stats and trends
- **Leaderboard Management**: View historical weekly rankings

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **Auth**: NextAuth.js (admin only)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Vercel account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd teacher-rating-platform
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file based on `.env.local.example`:
```bash
cp .env.local.example .env.local
```

4. Fill in your environment variables:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Cron (optional)
CRON_SECRET=your-cron-secret
```

### Database Setup

1. Create a new Supabase project
2. Run the SQL schema in `lib/supabase/schema.sql` in the Supabase SQL editor
3. Create an admin user:
```sql
INSERT INTO users (email, password_hash, role)
VALUES ('admin@example.com', '$2a$10$...', 'admin');
-- Use bcrypt to hash your password
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
```

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Supabase Configuration

1. Enable Row Level Security (RLS) on all tables
2. Configure authentication policies (included in schema.sql)
3. Set up storage bucket for teacher images (optional)

### Cron Job Setup

The weekly leaderboard update is configured in `vercel.json`. To enable:

1. Set `CRON_SECRET` environment variable
2. Vercel will automatically run the cron job every Monday at midnight

## Project Structure

```
teacher-rating-platform/
├── app/                    # Next.js App Router
│   ├── (public)/          # Public routes group
│   │   ├── teachers/      # Teacher list and detail pages
│   │   ├── leaderboard/   # Weekly leaderboard
│   │   └── search/        # Search page
│   ├── admin/             # Admin routes
│   │   ├── login/         # Admin login
│   │   ├── dashboard/     # Admin dashboard
│   │   ├── teachers/      # Teacher management
│   │   ├── moderation/    # Comment moderation
│   │   └── analytics/     # Analytics dashboard
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # UI components
│   ├── public/           # Public page components
│   └── admin/            # Admin components
├── lib/                  # Utility functions
│   ├── supabase/         # Supabase clients
│   ├── auth/             # Auth configuration
│   ├── types/            # TypeScript types
│   └── utils/            # Helper functions
├── middleware.ts         # Route protection
├── tailwind.config.ts    # Tailwind configuration
└── package.json
```

## API Routes

### Public Endpoints
- `GET /api/teachers` - List all active teachers
- `GET /api/teachers/[id]` - Get teacher with stats
- `POST /api/ratings` - Submit rating
- `GET /api/ratings?teacher_id=` - Get/check ratings
- `POST /api/comments` - Submit comment
- `GET /api/comments?teacher_id=` - Get approved comments
- `GET /api/leaderboard` - Current week leaderboard

### Admin Endpoints (Auth Required)
- `POST /api/teachers` - Create teacher
- `PUT /api/teachers/[id]` - Update teacher
- `DELETE /api/teachers/[id]` - Delete teacher
- `GET /api/admin/stats` - Platform analytics
- `GET /api/admin/comments/pending` - Pending moderation
- `PUT /api/comments/[id]` - Approve/flag comment
- `DELETE /api/comments/[id]` - Delete comment

### Cron Endpoints
- `GET /api/cron/update-leaderboard` - Weekly leaderboard update

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes (admin ops) |
| `NEXTAUTH_SECRET` | NextAuth secret key | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `CRON_SECRET` | Cron endpoint protection | No |

## Security

- Row Level Security (RLS) enabled on all tables
- SQL injection protection via parameterized queries
- XSS protection via input sanitization
- CSRF protection via NextAuth
- Rate limiting: 1 rating per teacher per anonymous ID

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open a GitHub issue.

---

Built with Next.js, Supabase, and Tailwind CSS.
>>>>>>> 631dcf7 (Initial commit)
