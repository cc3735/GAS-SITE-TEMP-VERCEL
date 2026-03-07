import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  Globe,
  Database,
  Receipt,
  Megaphone,
  Settings,
  Sparkles,
  CheckCircle2,
  Clock,
  TrendingUp,
  Shield,
  Star,
  Play,
  Users,
  Zap,
  BarChart3,
  Smartphone,
  BookOpen,
} from 'lucide-react';

// ── Data ─────────────────────────────────────────────────────────────

const heroStats = [
  { value: '100+', label: 'Students Learning' },
  { value: '50+', label: 'Businesses Automated' },
  { value: '24/7', label: 'Community Support' },
];

const services = [
  {
    icon: Bot,
    title: 'AI Agents & Chatbots',
    description: 'Intelligent conversational systems powered by NLP and machine learning.',
    features: ['NLP Processing', 'Multi-channel Integration', 'Learning Algorithms'],
    link: '/services#chatbots',
  },
  {
    icon: Globe,
    title: 'Website Automation',
    description: 'Streamline web operations and improve digital presence automatically.',
    features: ['Content Management', 'SEO Optimization', 'Performance Analytics'],
    link: '/services#web',
  },
  {
    icon: Database,
    title: 'CRM Integration',
    description: 'Connect and optimize your customer relationship management systems.',
    features: ['Lead Scoring', 'Pipeline Automation', 'Customer Insights'],
    link: '/services#crm',
  },
  {
    icon: Receipt,
    title: 'Invoice & Billing',
    description: 'Automate invoicing, payments, and financial tracking with precision.',
    features: ['Smart Invoicing', 'Payment Tracking', 'Financial Reports'],
    link: '/services#billing',
  },
  {
    icon: Megaphone,
    title: 'Marketing Automation',
    description: 'Scale your marketing efforts with intelligent automation strategies.',
    features: ['Campaign Management', 'Email Automation', 'Social Media Scheduling'],
    link: '/services#marketing',
  },
  {
    icon: Settings,
    title: 'Process Optimization',
    description: 'Analyze and improve your business processes for maximum efficiency.',
    features: ['Workflow Analysis', 'Process Mining', 'Efficiency Optimization'],
    link: '/services#process',
  },
];

const features = [
  { icon: Clock, title: '24/7 Operation', description: 'Your automations work around the clock, without breaks or downtime.', color: 'from-secondary-50 to-blue-50', border: 'border-secondary-200' },
  { icon: Zap, title: 'Lightning Fast', description: 'Execute workflows at incredible speeds with optimized performance.', color: 'from-secondary-50 to-blue-50', border: 'border-secondary-200' },
  { icon: TrendingUp, title: 'Scalable Solutions', description: 'Grow from startup to enterprise with our flexible infrastructure.', color: 'from-secondary-50 to-blue-50', border: 'border-secondary-200' },
  { icon: BarChart3, title: 'Data-Driven Insights', description: 'Make informed decisions with comprehensive analytics and reporting.', color: 'from-purple-50 to-pink-50', border: 'border-purple-200' },
  { icon: Shield, title: 'Enterprise Security', description: 'Bank-level encryption and compliance with industry standards.', color: 'from-purple-50 to-pink-50', border: 'border-purple-200' },
  { icon: Smartphone, title: 'Mobile Ready', description: 'Access and manage your workflows from any device, anytime.', color: 'from-purple-50 to-pink-50', border: 'border-purple-200' },
];

const impactStats = [
  { value: '85%', prefix: '↑', label: 'Efficiency Increase' },
  { value: '60%', prefix: '↓', label: 'Cost Reduction' },
  { value: '150%', prefix: '↑', label: 'Average ROI' },
  { value: '24/7', prefix: '', label: 'Availability' },
];

const courses = [
  {
    title: 'AI Fundamentals for Business',
    difficulty: 'Beginner',
    difficultyColor: 'bg-sky-100 text-sky-700',
    rating: 4.9,
    students: '2,847',
    duration: '4 weeks',
    topics: ['Machine Learning Basics', 'AI in Business', 'Practical Applications', 'Case Studies'],
  },
  {
    title: 'Advanced Automation Strategies',
    difficulty: 'Advanced',
    difficultyColor: 'bg-purple-100 text-purple-700',
    rating: 4.8,
    students: '1,523',
    duration: '6 weeks',
    topics: ['Workflow Design', 'API Integration', 'Error Handling', 'Performance Optimization'],
  },
  {
    title: 'No-Code Automation Mastery',
    difficulty: 'Intermediate',
    difficultyColor: 'bg-orange-100 text-orange-700',
    rating: 4.7,
    students: '3,201',
    duration: '5 weeks',
    topics: ['Zapier Advanced', 'Bubble Development', 'Workflow Automation', 'Integration Patterns'],
  },
];

const testimonials = [
  {
    name: 'Marcus Thompson',
    company: 'Thompson Logistics',
    role: 'Operations Director',
    content: 'We automated our entire dispatch and routing workflow with AI agents. What used to take a 3-person team 6 hours daily now runs autonomously. We\'ve cut operational costs by 40% and reduced delivery errors to near zero.',
    rating: 5,
  },
  {
    name: 'Sarah Chen',
    company: 'Brightside Marketing',
    role: 'CEO',
    content: 'GAS built us an AI agent that handles client onboarding, generates proposals, and schedules follow-ups automatically. Our team went from managing 15 clients to over 50 without adding headcount.',
    rating: 5,
  },
  {
    name: 'David Okafor',
    company: 'Okafor Legal Services',
    role: 'Managing Partner',
    content: 'The document automation and AI-powered intake system transformed our practice. Client intake that took 45 minutes is now 5 minutes. We\'ve tripled our caseload capacity.',
    rating: 5,
  },
];

// ── Component ────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      {/* ═══ HERO ═══ */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-black pt-32 pb-24 md:pt-40 md:pb-32">
        <div className="section-container text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20 mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-secondary-400 rounded-full" />
            <span className="text-secondary-400 text-sm font-semibold">AI-Powered Business Automation</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-4 animate-slide-up">
            Learn. Build. Automate.
          </h1>
          <p className="text-3xl md:text-4xl font-heading font-bold mb-6 animate-slide-up animation-delay-100">
            <span className="gradient-text-cyan">Your AI & Automation Journey</span>
          </p>

          {/* Subtitle */}
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10 animate-slide-up animation-delay-200">
            Master AI and automation through hands-on learning, connect with like-minded
            innovators, and transform your business with cutting-edge automation services.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up animation-delay-300">
            <Link to="/contact" className="btn-gradient-cyan">
              Free Intro Call
            </Link>
            <Link to="/education" className="btn-outline-white">
              Start Learning
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-0 animate-fade-in animation-delay-400">
            {heroStats.map((stat, i) => (
              <div key={stat.label} className={`text-center px-8 ${i > 0 ? 'md:border-l md:border-slate-700' : ''}`}>
                <p className="text-3xl md:text-4xl font-bold text-secondary-400">{stat.value}</p>
                <p className="text-slate-400 mt-1 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SERVICES ═══ */}
      <section className="section-padding bg-slate-50">
        <div className="section-container">
          {/* Section badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-secondary-100 px-4 py-1.5 rounded-full border border-secondary-200">
              <span className="w-2 h-2 bg-secondary-500 rounded-full" />
              <span className="text-secondary-700 text-sm font-semibold">Our Services</span>
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-center text-slate-900 mb-16">
            Comprehensive Automation Solutions
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Link
                key={service.title}
                to={service.link}
                className="bg-white rounded-2xl p-6 border border-slate-100 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-primary-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <service.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-secondary-600 transition-colors">
                  {service.title}
                </h3>
                <p className="text-slate-600 text-sm mb-4">{service.description}</p>
                <ul className="space-y-1.5">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-secondary-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/services" className="btn-primary">
              View All Services
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES + IMPACT STATS ═══ */}
      <section className="section-padding bg-white">
        <div className="section-container">
          {/* Section badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-primary-50 px-4 py-1.5 rounded-full border border-primary-200">
              <span className="w-2 h-2 bg-primary-500 rounded-full" />
              <span className="text-primary-700 text-sm font-semibold">Why Choose Us</span>
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-center text-slate-900 mb-16">
            Why Choose Our Platform?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`bg-gradient-to-br ${feature.color} rounded-2xl p-6 border ${feature.border} hover:-translate-y-2 hover:shadow-lg transition-all duration-300`}
              >
                <div className="text-4xl mb-4">
                  <feature.icon className="w-10 h-10 text-slate-700" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Impact Stats Banner */}
          <div className="bg-slate-900 rounded-2xl p-8 md:p-12 mt-16 text-center">
            <h3 className="text-2xl md:text-3xl font-heading font-bold text-white mb-10">
              Ready to Transform Your Business?
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {impactStats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl md:text-4xl font-bold text-secondary-400">
                    {stat.prefix} {stat.value}
                  </p>
                  <p className="text-slate-300 mt-2 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ EDUCATION PREVIEW ═══ */}
      <section className="section-padding bg-gradient-to-b from-secondary-50/50 to-white">
        <div className="section-container">
          {/* Section badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-blue-100 px-4 py-1.5 rounded-full border border-blue-200">
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-blue-700 text-sm font-semibold">Educational Hub</span>
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-center text-slate-900 mb-16">
            Master AI & Automation
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {courses.map((course) => (
              <div
                key={course.title}
                className="bg-white rounded-2xl p-6 border border-slate-200 hover:-translate-y-2 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`${course.difficultyColor} px-3 py-1 rounded-full text-xs font-semibold`}>
                    {course.difficulty}
                  </span>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-slate-700 font-medium">{course.rating}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3">{course.title}</h3>

                <div className="flex items-center gap-3 text-sm text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {course.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {course.students}
                  </span>
                </div>

                <ul className="space-y-1.5 mb-6">
                  {course.topics.map((t) => (
                    <li key={t} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-secondary-500 flex-shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register?redirect=/portal/courses"
                  className="block w-full text-center bg-primary-600 text-white font-semibold py-2.5 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>

          {/* Education CTA */}
          <div className="bg-white rounded-2xl p-8 md:p-10 border border-slate-200 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-10 h-10 bg-secondary-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-secondary-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Track Progress & Earn Certifications</h3>
            </div>
            <p className="text-slate-600 mb-6 max-w-lg mx-auto">
              Complete courses and earn industry-recognized certificates to showcase your expertise.
            </p>
            <Link to="/register?redirect=/portal/courses" className="btn-primary">
              Browse All Courses
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="section-padding bg-slate-900 text-white">
        <div className="section-container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Success Stories
            </h2>
            <p className="text-lg text-slate-300">
              See how businesses like yours have transformed with AI automation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-yellow-400"
                    />
                  ))}
                </div>

                <p className="mb-6 text-slate-300">
                  &ldquo;{testimonial.content}&rdquo;
                </p>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500">
                    <Users className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-slate-400">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="section-padding bg-gradient-to-r from-secondary-600 to-primary-600 text-white">
        <div className="section-container text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-6">
            Ready to Automate Your Business?
          </h2>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Schedule a free consultation and discover how AI automation can
            transform your small business operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="btn-primary bg-white text-primary-700 hover:bg-slate-100"
            >
              Schedule Free Consultation
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              to="/services"
              className="btn-outline-white"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
