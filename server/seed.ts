import bcrypt from 'bcryptjs';
import { db, UserRecord } from './db.js';

export const SEED_PASSWORD = 'Demo123!';

export const SEED_USERS: Omit<UserRecord, 'passwordHash'>[] = [
  {
    id: 'ADMIN',
    name: 'System Admin',
    email: 'admin@novaworks.example',
    role: 'ADMIN',
    specialization: 'Operations & Engineering Leadership',
    skills: JSON.stringify(['Project Management', 'Resource Allocation', 'System Auditing', 'Executive Leadership']),
  },
  {
    id: 'PM01',
    name: 'Ayesha Khan',
    email: 'ayesha@novaworks.example',
    role: 'MANAGER',
    specialization: 'E-Commerce & Web Platforms',
    skills: JSON.stringify(['Agile', 'Scrum', 'E-Commerce', 'Web Architecture', 'Jira']),
  },
  {
    id: 'PM02',
    name: 'Bilal Ahmed',
    email: 'bilal@novaworks.example',
    role: 'MANAGER',
    specialization: 'Mobile & Real-time Apps',
    skills: JSON.stringify(['Mobile PM', 'Sprint Planning', 'Flutter', 'React Native', 'Release Management']),
  },
  {
    id: 'PM03',
    name: 'Hina Malik',
    email: 'hina@novaworks.example',
    role: 'MANAGER',
    specialization: 'AI/ML Solutions & Integrations',
    skills: JSON.stringify(['LLM PM', 'Prompt Engineering', 'Data Pipelines', 'AI QA', 'Model Benchmarking']),
  },
  {
    id: 'DEV01',
    name: 'Ali Raza',
    email: 'ali@novaworks.example',
    role: 'AGENT',
    specialization: 'Frontend Engineering',
    skills: JSON.stringify(['React', 'Next.js', 'Tailwind CSS', 'TypeScript', 'UI/UX Engineering']),
  },
  {
    id: 'DEV02',
    name: 'Hamza Shah',
    email: 'hamza@novaworks.example',
    role: 'AGENT',
    specialization: 'Backend & API Architecture',
    skills: JSON.stringify(['Node.js', 'PostgreSQL', 'REST APIs', 'Express', 'System Design']),
  },
  {
    id: 'DEV03',
    name: 'Sara Noor',
    email: 'sara@novaworks.example',
    role: 'AGENT',
    specialization: 'Mobile UI/UX & Flutter',
    skills: JSON.stringify(['Flutter', 'Dart', 'UI/UX Design', 'Mobile Component Systems']),
  },
  {
    id: 'DEV04',
    name: 'Usman Tariq',
    email: 'usman@novaworks.example',
    role: 'AGENT',
    specialization: 'Mobile Integration & QA',
    skills: JSON.stringify(['Flutter Integration', 'React Native', 'Mobile QA', 'CI/CD Pipelines']),
  },
  {
    id: 'DEV05',
    name: 'Zain Abbas',
    email: 'zain@novaworks.example',
    role: 'AGENT',
    specialization: 'AI Engineer & LangChain',
    skills: JSON.stringify(['Python', 'FastAPI', 'Gemini API', 'Prompt Engineering', 'RAG Architectures']),
  },
  {
    id: 'DEV06',
    name: 'Maryam Asif',
    email: 'maryam@novaworks.example',
    role: 'AGENT',
    specialization: 'AI Evaluation & Document QA',
    skills: JSON.stringify(['Evaluation Frameworks', 'Document Processing', 'NLP Validation', 'QA Testing']),
  },
];

/**
 * Idempotent seed function: upserts users by email/id so running twice produces exactly 10 users.
 */
export async function runSeed(): Promise<{ count: number; users: UserRecord[] }> {
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(SEED_PASSWORD, salt);

  const seeded: UserRecord[] = [];
  for (const user of SEED_USERS) {
    const record: UserRecord = {
      ...user,
      passwordHash,
    };
    db.upsertUser(record);
    seeded.push(record);
  }

  console.log(`[Seed] Seeded ${seeded.length} users successfully (password: ${SEED_PASSWORD})`);
  return { count: seeded.length, users: db.getUsers() };
}
