# CourseFlow - Next Steps

Get CourseFlow up and running with these step-by-step instructions.

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd business-apps/CourseFlow
npm install
```

### Step 2: Environment Setup

Create a `.env.local` file in the CourseFlow directory:

```bash
# Copy example and edit
cp env.example .env.local
```

Add your Supabase credentials:

```env
# Required - Get these from your Supabase project dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3004
```

**Where to find these values:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon public** key

### Step 3: Database Setup

The CourseFlow schema should already be applied via the migration `supabase/migrations/20251227000001_create_courseflow_schema.sql`.

If not, run this SQL in Supabase SQL Editor:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'courseflow_%';
```

If tables are missing, apply the migration from `supabase/migrations/20251227000001_create_courseflow_schema.sql`.

### Step 4: Create Supabase Storage Bucket

1. Go to Supabase Dashboard → **Storage**
2. Click **New Bucket**
3. Name: `courseflow`
4. Make it **Public** (for file uploads to work)
5. Click **Create bucket**

### Step 5: Run the Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:3004**

---

## 🧪 Testing the Application

### Test 1: Authentication

1. Open http://localhost:3004
2. Click **Sign Up** 
3. Create an account with email/password
4. Verify you're redirected to the dashboard
5. Test **Sign Out** from the user menu
6. Test **Sign In** with your credentials

### Test 2: Create a Course (Instructor Flow)

1. Click **Create Course** in the sidebar
2. Fill in:
   - Title: "Introduction to Web Development"
   - Description: "Learn HTML, CSS, and JavaScript"
   - Visibility: **Private**
3. Click **Create Course**
4. Verify you see the course detail page
5. Note the **Enrollment Code** shown

### Test 3: Course Settings

1. From course detail, click **Settings**
2. Test changing:
   - Title
   - Description
   - Visibility (Public/Private/Unlisted)
3. Click **Save Changes**
4. Verify changes persist

### Test 4: Create an Assignment

1. From course detail, click **Assignments** tab
2. Click **Create Assignment**
3. Fill in:
   - Title: "Week 1: HTML Basics"
   - Instructions: Use markdown! Try `**bold**` and lists
   - Points: 100
   - Due Date: Pick a date in the future
   - Submission Type: File Upload
4. Click **Publish** (or Save as Draft)
5. Verify assignment appears in the list

### Test 5: Create a Discussion

1. From course detail, click **Discussions** tab
2. Click **New Discussion**
3. Fill in:
   - Title: "Introduce Yourself"
   - Message: "Welcome everyone! Share your background."
4. Click **Post Discussion**
5. Open the discussion and **Reply** to it
6. Test nested replies (reply to a reply)

### Test 6: Schedule a Live Session

1. From course detail, click **Live Sessions** tab
2. Click **Schedule Session**
3. Fill in:
   - Title: "Live Q&A Session"
   - YouTube URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ` (any valid YouTube URL)
   - Date/Time: Pick a future time
4. Click **Create Session**
5. Verify the embedded YouTube player works

### Test 7: Student Enrollment

1. **Sign out** and create a **new account** (student)
2. Go to **Browse Courses** in sidebar
3. If your course is public, click **Enroll Now**
4. If private, go to `/courses/enroll` and enter the enrollment code
5. Verify you can access the course as a student

### Test 8: Student Submission

1. As a student, open a published assignment
2. Click **Submit Assignment**
3. Enter text or upload a file
4. Click **Submit**
5. Verify submission appears on the assignment page

### Test 9: Instructor Grading

1. **Sign in as the instructor** (original account)
2. Open the assignment → **Submissions** tab
3. Click **Review** on a submission
4. Enter:
   - Grade: 85
   - Feedback: "Great work! Consider adding more examples."
5. Click **Return to Student**
6. Sign in as student and verify they see the grade/feedback

### Test 10: Mobile Responsiveness

1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test various screen sizes:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1440px)
4. Verify sidebar collapses to hamburger menu on mobile

---

## 📋 Feature Checklist

### Authentication
- [ ] Sign up with email/password
- [ ] Sign in
- [ ] Sign out
- [ ] Protected routes redirect to login

### Dashboard
- [ ] Shows teaching courses
- [ ] Shows enrolled courses
- [ ] Shows upcoming assignments
- [ ] Shows upcoming live sessions

### Courses
- [ ] Create new course
- [ ] Edit course settings
- [ ] Archive/delete course
- [ ] View course detail tabs (Overview, Assignments, Discussions, Sessions, Students)
- [ ] Enrollment code generation
- [ ] Copy enrollment link

### Assignments
- [ ] Create assignment with markdown instructions
- [ ] Edit assignment
- [ ] Delete assignment
- [ ] Set due dates
- [ ] Configure late submissions
- [ ] Configure resubmissions
- [ ] Publish/draft status

### Submissions
- [ ] Submit text response
- [ ] Upload files
- [ ] View submission history
- [ ] Late submission detection

### Grading
- [ ] View all submissions
- [ ] Enter numeric grade
- [ ] Provide markdown feedback
- [ ] Return to student
- [ ] Late penalty display

### Discussions
- [ ] Create discussion
- [ ] Reply to discussion
- [ ] Nested replies (3 levels)
- [ ] Pin/unpin (instructor)
- [ ] Lock/unlock (instructor)
- [ ] Delete discussion

### Live Sessions
- [ ] Create session with YouTube URL
- [ ] Embedded video player
- [ ] Status management (scheduled → live → completed)
- [ ] Session scheduling

### Enrollment
- [ ] Browse public courses
- [ ] Enroll via code
- [ ] Direct enrollment (public courses)
- [ ] Max enrollment limits

### User Profile
- [ ] View profile stats
- [ ] Update profile name
- [ ] Change password

---

## 🐛 Troubleshooting

### "Invalid API key" error
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct in `.env.local`
- Restart the dev server after changing env vars

### "relation does not exist" error
- The database schema hasn't been applied
- Run the migration SQL from `supabase/migrations/20251227000001_create_courseflow_schema.sql`

### File upload fails
- Create the `courseflow` storage bucket in Supabase
- Make sure it's set to **Public**

### Styles look broken
- Run `npm install` to ensure Tailwind is installed
- Check that `tailwind.config.js` exists and has correct content paths

### "Module not found" errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

### Authentication not persisting
- Check browser cookies are enabled
- Verify Supabase URL is correct (https, not http)

---

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

---

## 📁 Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Supabase client configuration |
| `src/contexts/AuthContext.tsx` | Authentication state management |
| `src/components/DashboardLayout.tsx` | Main layout with navigation |
| `src/types/database.ts` | TypeScript types for all tables |
| `src/app/globals.css` | Global styles and Tailwind config |

---

## 🚢 Deployment (Vercel)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

The app will be available at `your-project.vercel.app`

---

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Check Supabase logs in the dashboard
3. Review the troubleshooting section above

---

Happy Teaching! 🎓

