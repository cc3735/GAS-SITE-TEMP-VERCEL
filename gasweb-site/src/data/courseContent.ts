// ── Course Content Types & Shared Catalog ────────────────────────────

export interface CourseLesson {
  id: string;
  title: string;
  objectives: string[];
  content: string; // markdown-formatted educational content
  keyTakeaways: string[];
  estimatedMinutes: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  lessons: CourseLesson[];
  quiz: QuizQuestion[];
}

export interface FullCourse {
  id: string;
  modules: CourseModule[];
  learningOutcomes: string[];
  instructorName: string;
  instructorBio: string;
}

// ── Catalog Types ────────────────────────────────────────────────────

export interface CatalogCourse {
  id: string;
  title: string;
  description: string;
  category: 'ai' | 'security' | 'cloud';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  certPrep: string;
  coursePrice: number;
  assessmentPrice: number;
  duration: string;
  topics: string[];
}

// ── Shared Catalog ───────────────────────────────────────────────────

export const CATALOG: CatalogCourse[] = [
  // ── Free Courses ──
  {
    id: 'intro-ai-ml',
    title: 'Introduction to AI & Machine Learning',
    description: 'Learn the fundamentals of artificial intelligence and machine learning. Understand how AI is transforming business operations and discover practical applications you can implement today.',
    category: 'ai',
    difficulty: 'Beginner',
    certPrep: 'Google AI Essentials',
    coursePrice: 0,
    assessmentPrice: 19,
    duration: '4 weeks',
    topics: ['Machine Learning Basics', 'AI in Business', 'Practical Applications', 'Prompt Engineering'],
  },
  {
    id: 'cybersecurity-fundamentals',
    title: 'Cybersecurity Fundamentals',
    description: 'Build a solid foundation in cybersecurity concepts, threats, and defense strategies. Learn to identify vulnerabilities and implement security best practices.',
    category: 'security',
    difficulty: 'Beginner',
    certPrep: 'CompTIA Security+',
    coursePrice: 0,
    assessmentPrice: 29,
    duration: '6 weeks',
    topics: ['Threat Landscape', 'Network Security', 'Cryptography Basics', 'Risk Management'],
  },
  {
    id: 'cloud-computing-basics',
    title: 'Cloud Computing Basics',
    description: 'Understand cloud infrastructure, services, and deployment models. Get hands-on experience with major cloud platforms and learn to design scalable solutions.',
    category: 'cloud',
    difficulty: 'Beginner',
    certPrep: 'AWS Cloud Practitioner',
    coursePrice: 0,
    assessmentPrice: 19,
    duration: '4 weeks',
    topics: ['Cloud Models (IaaS/PaaS/SaaS)', 'AWS Core Services', 'Cloud Security', 'Cost Optimization'],
  },
  {
    id: 'network-fundamentals',
    title: 'Network Fundamentals',
    description: 'Master networking concepts from the ground up. Learn about protocols, topologies, routing, and troubleshooting techniques essential for any IT career.',
    category: 'cloud',
    difficulty: 'Beginner',
    certPrep: 'CompTIA Network+',
    coursePrice: 0,
    assessmentPrice: 29,
    duration: '5 weeks',
    topics: ['TCP/IP & OSI Model', 'Routing & Switching', 'Wireless Networks', 'Network Troubleshooting'],
  },
  {
    id: 'it-support-foundations',
    title: 'IT Support Foundations',
    description: 'Develop essential IT support skills including hardware, software, operating systems, and customer service. The perfect starting point for an IT career.',
    category: 'cloud',
    difficulty: 'Beginner',
    certPrep: 'CompTIA A+',
    coursePrice: 0,
    assessmentPrice: 29,
    duration: '6 weeks',
    topics: ['Hardware & Software', 'Operating Systems', 'Networking Basics', 'Troubleshooting Methodology'],
  },
  // ── Paid Courses ──
  {
    id: 'advanced-ai-automation',
    title: 'Advanced AI & Automation Engineering',
    description: 'Deep dive into building production-grade AI systems and automation pipelines. Design intelligent workflows, integrate LLMs, and deploy scalable AI solutions.',
    category: 'ai',
    difficulty: 'Advanced',
    certPrep: 'AWS Machine Learning Specialty',
    coursePrice: 79,
    assessmentPrice: 39,
    duration: '8 weeks',
    topics: ['LLM Integration', 'AI Pipeline Architecture', 'Model Deployment', 'MLOps & Monitoring'],
  },
  {
    id: 'enterprise-cloud-architecture',
    title: 'Enterprise Cloud Architecture',
    description: 'Design and implement enterprise-grade cloud solutions. Learn high availability patterns, multi-region deployments, and infrastructure as code.',
    category: 'cloud',
    difficulty: 'Advanced',
    certPrep: 'AWS Solutions Architect Associate',
    coursePrice: 99,
    assessmentPrice: 49,
    duration: '10 weeks',
    topics: ['Architecture Patterns', 'High Availability', 'Infrastructure as Code', 'Cost Management'],
  },
  {
    id: 'advanced-cybersecurity',
    title: 'Advanced Cybersecurity Operations',
    description: 'Master advanced security operations including threat hunting, incident response, security architecture, and compliance frameworks.',
    category: 'security',
    difficulty: 'Advanced',
    certPrep: 'CompTIA CySA+ / CISSP',
    coursePrice: 99,
    assessmentPrice: 49,
    duration: '10 weeks',
    topics: ['Threat Hunting', 'Incident Response', 'Security Architecture', 'Compliance & Governance'],
  },
  {
    id: 'ai-agent-development',
    title: 'AI Agent Development & Deployment',
    description: 'Build autonomous AI agents that can reason, plan, and execute tasks. Learn agent frameworks, tool integration, and production deployment strategies.',
    category: 'ai',
    difficulty: 'Advanced',
    certPrep: 'Google Professional ML Engineer',
    coursePrice: 79,
    assessmentPrice: 39,
    duration: '8 weeks',
    topics: ['Agent Frameworks', 'Tool Use & Function Calling', 'Multi-Agent Systems', 'Production Deployment'],
  },
  {
    id: 'n8n-zapier-mastery',
    title: 'N8N & Zapier Automation Mastery',
    description: 'Become an expert in no-code/low-code automation platforms. Build complex workflows, integrate APIs, and automate business processes at scale.',
    category: 'ai',
    difficulty: 'Intermediate',
    certPrep: 'HubSpot Automation',
    coursePrice: 49,
    assessmentPrice: 29,
    duration: '6 weeks',
    topics: ['N8N Advanced Workflows', 'Zapier Multi-Step Zaps', 'API Integration', 'Error Handling & Monitoring'],
  },
  {
    id: 'azure-cloud-admin',
    title: 'Azure Cloud Administration',
    description: 'Master Microsoft Azure administration including identity management, virtual networks, storage, and compute resources.',
    category: 'cloud',
    difficulty: 'Intermediate',
    certPrep: 'Microsoft AZ-104',
    coursePrice: 99,
    assessmentPrice: 49,
    duration: '8 weeks',
    topics: ['Azure AD & Identity', 'Virtual Networks', 'Storage & Compute', 'Monitoring & Governance'],
  },
];

// ── Lookup helpers ───────────────────────────────────────────────────

export const CATALOG_MAP: Record<string, CatalogCourse> = Object.fromEntries(
  CATALOG.map((c) => [c.id, c])
);

export const CATEGORY_COLORS: Record<string, string> = {
  ai: 'bg-blue-50 text-blue-700 border-blue-200',
  security: 'bg-red-50 text-red-700 border-red-200',
  cloud: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'bg-sky-100 text-sky-700',
  Intermediate: 'bg-orange-100 text-orange-700',
  Advanced: 'bg-purple-100 text-purple-700',
};

export const CATEGORY_GRADIENT: Record<string, string> = {
  ai: 'from-blue-500 to-indigo-600',
  security: 'from-red-500 to-rose-600',
  cloud: 'from-emerald-500 to-teal-600',
};

export const CATEGORIES = [
  { key: 'all', label: 'All Courses' },
  { key: 'ai', label: 'AI & Automation' },
  { key: 'security', label: 'Cybersecurity' },
  { key: 'cloud', label: 'Cloud & IT' },
] as const;

export const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const;

export const PRO_PRICE = 29;
