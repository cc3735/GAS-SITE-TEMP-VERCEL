'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Users, Video, MessageSquare, FileText, CheckCircle } from 'lucide-react'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L2c+PC9zdmc+')] opacity-20"></div>
        <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary-400" />
              <span className="text-2xl font-bold text-white">CourseFlow</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="text-slate-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/auth/signup" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Simple Learning,{' '}
              <span className="text-primary-400">Powerful Results</span>
            </h1>
            <p className="mt-6 text-xl text-slate-300 leading-relaxed">
              A lightweight LMS focused on what matters: teaching and learning. 
              No enterprise bloat, just seamless instructor-student collaboration.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/auth/signup" className="btn-primary text-lg px-8 py-3">
                Start Teaching Today
              </Link>
              <Link href="#features" className="btn bg-white/10 text-white hover:bg-white/20 text-lg px-8 py-3">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Everything You Need to Teach
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Built for small classes, bootcamps, and independent educators who want simplicity without compromise.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Course Management"
              description="Create courses in seconds. Control visibility, manage enrollments with links or invites."
            />
            <FeatureCard
              icon={<Video className="h-6 w-6" />}
              title="Live Sessions"
              description="Host live classes via YouTube Live. Embed streams directly in your course pages."
            />
            <FeatureCard
              icon={<MessageSquare className="h-6 w-6" />}
              title="Discussions"
              description="Threaded discussions with Markdown support. Pin important topics, moderate easily."
            />
            <FeatureCard
              icon={<FileText className="h-6 w-6" />}
              title="Assignments"
              description="Create assignments with due dates, accept file or text submissions, provide feedback."
            />
            <FeatureCard
              icon={<CheckCircle className="h-6 w-6" />}
              title="Grading"
              description="Simple numeric grades with text feedback. Clear submission status for students."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="File Sharing"
              description="Upload documents, PDFs, images. Share materials with your class effortlessly."
            />
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                KISS Philosophy
              </h2>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                CourseFlow embraces the Keep It Simple philosophy. We intentionally avoid enterprise complexity 
                like SCORM, LTI, accreditation tracking, and proctoring. Instead, we focus on the core 
                collaboration loop between instructors and students.
              </p>
              <ul className="mt-8 space-y-4">
                <PhilosophyItem text="No enterprise bloat or unnecessary features" />
                <PhilosophyItem text="Web-first, developer-friendly design" />
                <PhilosophyItem text="Modular and extensible by default" />
                <PhilosophyItem text="Perfect for small classes and bootcamps" />
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 p-1">
                <div className="w-full h-full rounded-xl bg-white flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary-600 to-accent-600">
                      KISS
                    </div>
                    <div className="mt-4 text-slate-600 font-medium">
                      Keep It Simple, Stupid
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to Simplify Your Teaching?
          </h2>
          <p className="mt-6 text-xl text-primary-100">
            Join instructors who choose simplicity. Create your first course in minutes.
          </p>
          <div className="mt-10">
            <Link href="/auth/signup" className="btn bg-white text-primary-700 hover:bg-primary-50 text-lg px-8 py-3">
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary-400" />
              <span className="text-xl font-bold text-white">CourseFlow</span>
            </div>
            <p className="text-slate-400 text-sm">
              A lightweight LMS for modern educators
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl border border-slate-200 bg-white hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-slate-600">{description}</p>
    </div>
  )
}

function PhilosophyItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3">
      <CheckCircle className="h-5 w-5 text-primary-600 flex-shrink-0" />
      <span className="text-slate-700">{text}</span>
    </li>
  )
}

