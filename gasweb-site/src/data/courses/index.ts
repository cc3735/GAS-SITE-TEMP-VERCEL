import type { FullCourse } from '../courseContent';

const loaders: Record<string, () => Promise<FullCourse>> = {
  'intro-ai-ml': () => import('./intro-ai-ml').then((m) => m.introAiMl),
  'cybersecurity-fundamentals': () => import('./cybersecurity-fundamentals').then((m) => m.cybersecurityFundamentals),
  'cloud-computing-basics': () => import('./cloud-computing-basics').then((m) => m.cloudComputingBasics),
  'network-fundamentals': () => import('./network-fundamentals').then((m) => m.networkFundamentals),
  'it-support-foundations': () => import('./it-support-foundations').then((m) => m.itSupportFoundations),
  'advanced-ai-automation': () => import('./advanced-ai-automation').then((m) => m.advancedAiAutomation),
  'enterprise-cloud-architecture': () => import('./enterprise-cloud-architecture').then((m) => m.enterpriseCloudArchitecture),
  'advanced-cybersecurity': () => import('./advanced-cybersecurity').then((m) => m.advancedCybersecurity),
  'ai-agent-development': () => import('./ai-agent-development').then((m) => m.aiAgentDevelopment),
  'n8n-zapier-mastery': () => import('./n8n-zapier-mastery').then((m) => m.n8nZapierMastery),
  'azure-cloud-admin': () => import('./azure-cloud-admin').then((m) => m.azureCloudAdmin),
};

export async function loadCourse(courseId: string): Promise<FullCourse | null> {
  const loader = loaders[courseId];
  if (!loader) return null;
  return loader();
}
