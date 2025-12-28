# CourseFlow - Lightweight Learning Management System

> A simple, focused LMS for instructor-student collaboration. No enterprise bloat, just seamless teaching and learning.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC)](https://tailwindcss.com/)

---

## 🎯 Overview

CourseFlow is a lightweight Learning Management System designed for:
- **Small classes and bootcamps**
- **Independent educators**
- **Internal training programs**
- **Developer-friendly** course delivery

### Design Philosophy: KISS (Keep It Simple)

We intentionally avoid enterprise complexity. CourseFlow focuses on the **core collaboration loop** between instructors and students:

✅ **What CourseFlow Does:**
- Course creation and management
- Student enrollment (public, private, or link-based)
- Assignment creation, submission, and grading
- Threaded discussions with Markdown support
- Live session integration (YouTube Live)
- File uploads and sharing

❌ **What CourseFlow Does NOT Do:**
- LTI/SCORM compliance
- Proctoring or plagiarism detection
- Complex rubrics or peer review
- Native video streaming
- Mobile apps
- Enterprise SSO

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project (database already configured)

### Installation

```bash
# Navigate to CourseFlow directory
cd business-apps/CourseFlow

# Install dependencies
npm install

# Set up environment variables
# Create .env.local with:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Run development server
npm run dev
```

The app will be available at `http://localhost:3004`

---

## 📁 Project Structure

```
CourseFlow/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Landing page
│   │   ├── layout.tsx          # Root layout
│   │   ├── globals.css         # Global styles
│   │   ├── auth/               # Authentication pages
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── callback/
│   │   ├── dashboard/          # Main dashboard
│   │   ├── courses/            # Course management
│   │   │   ├── page.tsx        # Course list
│   │   │   ├── new/            # Create course
│   │   │   └── [id]/           # Course detail
│   │   ├── assignments/        # Assignment views
│   │   ├── discussions/        # Discussion boards
│   │   └── live-sessions/      # Live session management
│   ├── components/
│   │   └── DashboardLayout.tsx # Authenticated layout
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication state
│   ├── lib/
│   │   └── supabase.ts         # Supabase client
│   └── types/
│       └── database.ts         # TypeScript types
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 🗃️ Database Schema

CourseFlow uses Supabase (PostgreSQL) with the following tables:

| Table | Purpose |
|-------|---------|
| `courseflow_courses` | Course information and settings |
| `courseflow_enrollments` | Student-course relationships |
| `courseflow_assignments` | Assignment definitions |
| `courseflow_submissions` | Student submissions |
| `courseflow_feedback` | Instructor feedback and grades |
| `courseflow_discussions` | Discussion threads |
| `courseflow_discussion_posts` | Discussion replies |
| `courseflow_live_sessions` | YouTube Live session info |
| `courseflow_files` | File upload metadata |

All tables have Row Level Security (RLS) policies for secure multi-user access.

---

## 👥 User Roles

### Instructor
- Create and manage courses
- Create assignments and grade submissions
- Moderate discussions
- Schedule live sessions
- View student enrollments

### Student
- Enroll in courses (public or via code)
- Submit assignments
- Participate in discussions
- View grades and feedback
- Watch live sessions

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Frontend** | Next.js 14 (App Router) | Server components, great DX |
| **Styling** | Tailwind CSS | Utility-first, fast development |
| **Language** | TypeScript | Type safety, better tooling |
| **Database** | Supabase (PostgreSQL) | Managed, RLS, real-time |
| **Auth** | Supabase Auth | Built-in, OAuth support |
| **Storage** | Supabase Storage | S3-compatible, integrated |
| **Live Video** | YouTube Live (embedded) | No infrastructure needed |

---

## 🔐 Authentication

CourseFlow uses Supabase Auth with:
- Email/password sign up
- Google OAuth
- Magic links (coming soon)

Session management is handled automatically with HTTP-only cookies.

---

## 📱 Core Features

### Courses
- Create courses with title, description, cover image
- Visibility options: Public, Private, Unlisted
- Enrollment codes for private courses
- Archive/restore courses

### Assignments
- Markdown instructions
- File or text submission types
- Due dates with late submission options
- Resubmission settings
- Draft/Published/Scheduled status

### Discussions
- Threaded replies (3 levels deep)
- Markdown support
- Pin and lock threads
- Instructor moderation

### Live Sessions
- YouTube Live integration
- Scheduled or live now status
- Embedded player in course
- Recorded session archive

### Grading
- Numeric grades
- Text feedback (Markdown)
- Return to student workflow
- Grade visibility control

---

## 🚧 Development Phases

### Phase 0: Foundation ✅
- Project setup
- Database schema
- Authentication
- Base layout

### Phase 1: Core Teaching Loop (In Progress)
- Course CRUD
- Enrollment system
- Assignment workflow
- Submission & grading

### Phase 2: Live Learning
- YouTube Live integration
- Session scheduling
- Embedded player

### Phase 3: Discussions & Polish
- Discussion boards
- Threaded replies
- UI refinement
- Mobile responsiveness

---

## 🔧 Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3004
```

---

## 📝 Scripts

```bash
# Development
npm run dev          # Start dev server on port 3004

# Build
npm run build        # Production build
npm run start        # Start production server

# Code quality
npm run lint         # ESLint
```

---

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript strictly
3. Follow Tailwind conventions
4. Write meaningful commit messages

---

## 📄 License

This project is part of the AI-Operating platform. All rights reserved.

---

## 📞 Support

- **Documentation**: `/docs`
- **Issues**: GitHub Issues
- **Email**: support@gasweb.info

---

Built with ❤️ for educators who value simplicity

