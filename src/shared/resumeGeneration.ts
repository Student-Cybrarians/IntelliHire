import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ExternalHyperlink,
} from 'docx';
import zlib from 'node:zlib';

export interface ResumeHyperlink {
  url: string;
  label: string;
  kind?: 'linkedin' | 'github' | 'portfolio' | 'repo' | 'demo' | 'email' | 'phone' | 'other';
}

export interface StructuredExperienceEntry {
  company: string;
  title: string;
  duration: string;
  location?: string;
  bullets: string[];
}

export interface StructuredProjectEntry {
  name: string;
  subtitle?: string;
  duration?: string;
  links?: ResumeHyperlink[];
  bullets: string[];
  briefing?: {
    purpose?: string;
    implementation?: string;
    outcome?: string;
  };
}

export interface StructuredEducationEntry {
  degree: string;
  institution?: string;
  duration?: string;
  details?: string;
}

export interface SkillCategoryGroup {
  category: string;
  skills: string[];
}

export interface StructuredContactDetails {
  fullName: string;
  headline: string;
  location?: string;
  phone?: string;
  email?: string;
  links: ResumeHyperlink[];
  contactItems: string[];
}

export interface StructuredResumeDocument {
  header: {
    fullName: string;
    headline: string;
    location?: string;
    phone?: string;
    email?: string;
    links?: ResumeHyperlink[];
    contactItems: string[];
  };
  summary: string;
  skillCategories: SkillCategoryGroup[];
  experience: StructuredExperienceEntry[];
  projects: StructuredProjectEntry[];
  education: StructuredEducationEntry[];
  certifications: string[];
  achievements: string[];
  metadata: {
    mode: 'global' | 'tailored';
    sourceResumeId: string;
    sourceVersion?: number;
    targetJdId?: string;
    generationMethod: 'ai_enhanced_validated' | 'deterministic_evidence_polished';
    validationPassed: boolean;
    retriesUsed: number;
    warnings: string[];
  };
}

export interface SourceFactInventory {
  cleanedRawText: string;
  candidateName: string;
  candidateHeadline: string;
  candidateLocation?: string;
  candidatePhone?: string;
  candidateEmail?: string;
  headerLinks: ResumeHyperlink[];
  contactItems: string[];
  rawSummaryLines: string[];
  verifiedSkills: string[];
  supportedLowerTokens: Set<string>;
  supportedMetrics: Set<string>;
  unsupportedJdKeywords: string[];
  matchedJdKeywords: string[];
  experienceEntries: StructuredExperienceEntry[];
  projectEntries: StructuredProjectEntry[];
  educationEntries: StructuredEducationEntry[];
  certificationEntries: string[];
  achievementEntries: string[];
  hasUsableEvidence: boolean;
}

export interface ResumeValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Canonical casing and alias normalization for common technical & professional skills
const CANONICAL_SKILL_MAP: Record<string, string> = {
  'javascript': 'JavaScript',
  'js': 'JavaScript',
  'ecmascript': 'JavaScript',
  'typescript': 'TypeScript',
  'ts': 'TypeScript',
  'python': 'Python',
  'py': 'Python',
  'java': 'Java',
  'c++': 'C++',
  'cpp': 'C++',
  'c#': 'C#',
  'csharp': 'C#',
  'golang': 'Go',
  'go': 'Go',
  'rust': 'Rust',
  'ruby': 'Ruby',
  'php': 'PHP',
  'swift': 'Swift',
  'kotlin': 'Kotlin',
  'scala': 'Scala',
  'r': 'R',
  'sql': 'SQL',
  'html': 'HTML5',
  'html5': 'HTML5',
  'css': 'CSS3',
  'css3': 'CSS3',
  'bash': 'Bash',
  'shell': 'Shell Scripting',
  'powershell': 'PowerShell',
  'react': 'React',
  'reactjs': 'React',
  'react.js': 'React',
  'nextjs': 'Next.js',
  'next.js': 'Next.js',
  'vue': 'Vue.js',
  'vuejs': 'Vue.js',
  'vue.js': 'Vue.js',
  'angular': 'Angular',
  'svelte': 'Svelte',
  'nodejs': 'Node.js',
  'node.js': 'Node.js',
  'node': 'Node.js',
  'express': 'Express.js',
  'expressjs': 'Express.js',
  'express.js': 'Express.js',
  'fastapi': 'FastAPI',
  'flask': 'Flask',
  'django': 'Django',
  'spring': 'Spring',
  'spring boot': 'Spring Boot',
  'springboot': 'Spring Boot',
  'hono': 'Hono',
  'tailwind': 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS',
  'tailwind css': 'Tailwind CSS',
  'graphql': 'GraphQL',
  'rest': 'REST APIs',
  'rest api': 'REST APIs',
  'rest apis': 'REST APIs',
  'restful apis': 'REST APIs',
  'grpc': 'gRPC',
  'postgresql': 'PostgreSQL',
  'postgres': 'PostgreSQL',
  'mysql': 'MySQL',
  'sqlite': 'SQLite',
  'd1': 'Cloudflare D1',
  'cloudflare d1': 'Cloudflare D1',
  'mongodb': 'MongoDB',
  'mongo': 'MongoDB',
  'redis': 'Redis',
  'dynamodb': 'DynamoDB',
  'cassandra': 'Cassandra',
  'elasticsearch': 'Elasticsearch',
  'snowflake': 'Snowflake',
  'bigquery': 'BigQuery',
  'aws': 'AWS',
  'amazon web services': 'AWS',
  'gcp': 'Google Cloud (GCP)',
  'google cloud': 'Google Cloud (GCP)',
  'azure': 'Microsoft Azure',
  'cloudflare': 'Cloudflare',
  'cloudflare workers': 'Cloudflare Workers',
  'docker': 'Docker',
  'kubernetes': 'Kubernetes',
  'k8s': 'Kubernetes',
  'terraform': 'Terraform',
  'ansible': 'Ansible',
  'jenkins': 'Jenkins',
  'github actions': 'GitHub Actions',
  'gitlab ci': 'GitLab CI/CD',
  'ci/cd': 'CI/CD',
  'cicd': 'CI/CD',
  'git': 'Git',
  'linux': 'Linux',
  'nginx': 'Nginx',
  'machine learning': 'Machine Learning',
  'ml': 'Machine Learning',
  'deep learning': 'Deep Learning',
  'dl': 'Deep Learning',
  'artificial intelligence': 'Artificial Intelligence',
  'ai': 'Artificial Intelligence',
  'nlp': 'Natural Language Processing (NLP)',
  'natural language processing': 'Natural Language Processing (NLP)',
  'llm': 'Large Language Models (LLMs)',
  'llms': 'Large Language Models (LLMs)',
  'large language models': 'Large Language Models (LLMs)',
  'rag': 'Retrieval-Augmented Generation (RAG)',
  'prompt engineering': 'Prompt Engineering',
  'context optimization': 'Context Optimization',
  'pytorch': 'PyTorch',
  'tensorflow': 'TensorFlow',
  'scikit-learn': 'Scikit-Learn',
  'sklearn': 'Scikit-Learn',
  'pandas': 'Pandas',
  'numpy': 'NumPy',
  'matplotlib': 'Matplotlib',
  'jupyter notebook': 'Jupyter Notebook',
  'jupyter': 'Jupyter Notebook',
  'vs code': 'VS Code',
  'vscode': 'VS Code',
  'python programming': 'Python',
  'linux (ubuntu)': 'Linux (Ubuntu)',
  'ubuntu': 'Linux (Ubuntu)',
  'computer vision': 'Computer Vision',
  'data science': 'Data Science',
  'data analysis': 'Data Analysis',
  'data analysis & visualization': 'Data Analysis & Visualization',
  'data engineering': 'Data Engineering',
  'apache spark': 'Apache Spark',
  'spark': 'Apache Spark',
  'kafka': 'Apache Kafka',
  'apache kafka': 'Apache Kafka',
  'airflow': 'Apache Airflow',
  'tableau': 'Tableau',
  'power bi': 'Power BI',
  'powerbi': 'Power BI',
  'jest': 'Jest',
  'vitest': 'Vitest',
  'playwright': 'Playwright',
  'cypress': 'Cypress',
  'pytest': 'Pytest',
  'junit': 'JUnit',
  'unit testing': 'Unit Testing',
  'tdd': 'Test-Driven Development (TDD)',
  'agile': 'Agile / Scrum',
  'scrum': 'Agile / Scrum',
  'microservices': 'Microservices Architecture',
  'system design': 'System Design',
  'distributed systems': 'Distributed Systems',
  'oauth': 'OAuth 2.0',
  'jwt': 'JWT Authentication',
};

const SKILL_NOISE_PATTERNS = [
  /^(and|or|etc\.?|the|with|using|including|such as|experience|years|year|month|months|beginner|intermediate|advanced|proficient|expert|novice|basic|fluent|native|n\/a|none|not specified|skills|technical skills|core competencies|programming languages|frontend|backend|ai\s*&\s*machine learning|libraries\s*&\s*tools|tools\s*&\s*technologies|operating systems|databases|cloud\s*&\s*devops|other skills)$/i,
  /^incorporating verifiable experience/i,
  /^target role alignment/i,
  /^aligned to /i,
  /^\[.*REDACTED.*\]$/i,
  /^\d+$/,
];

const FORBIDDEN_SYNTHETIC_PATTERNS: RegExp[] = [
  /incorporating verifiable experience with/i,
  /Target Role Alignment\s*&\s*Tailored Highlights/i,
  /---\s*TARGETED ATS OPTIMIZATIONS\s*---/i,
  /Tailored for Target Requisition:/i,
  /aligned to\s+["“][^"”]+["”]/i,
  /\(Quantified with measurable delivery metrics,\s*throughput gains,\s*and scope alignment to target role\)/i,
  /\(Tailored ATS Edition\)/i,
  /\[(?:EMAIL|PHONE|SSN|ADDRESS|PROFILE_URL)_REDACTED\]/i,
  /\[(?:INSERT|TODO|PLACEHOLDER)[^\]]*\]/i,
  /^(?:Here is|Sure, here is|As an AI|Below is the rewritten)/i,
];

const COMMON_SPELLING_FIXES: Array<[RegExp, string]> = [
  [/\bteh\b/gi, 'the'],
  [/\brecieve\b/gi, 'receive'],
  [/\brecieved\b/gi, 'received'],
  [/\bseperate\b/gi, 'separate'],
  [/\boccured\b/gi, 'occurred'],
  [/\bdefinately\b/gi, 'definitely'],
  [/\baccomodate\b/gi, 'accommodate'],
  [/\bacheive\b/gi, 'achieve'],
  [/\bacheived\b/gi, 'achieved'],
  [/\bachive\b/gi, 'achieve'],
  [/\bachived\b/gi, 'achieved'],
  [/\bacheivement\b/gi, 'achievement'],
  [/\bacheivements\b/gi, 'achievements'],
  [/\benviroment\b/gi, 'environment'],
  [/\benviroments\b/gi, 'environments'],
  [/\benviornment\b/gi, 'environment'],
  [/\benviornments\b/gi, 'environments'],
  [/\bperformace\b/gi, 'performance'],
  [/\bmaintainance\b/gi, 'maintenance'],
  [/\bdevelopement\b/gi, 'development'],
  [/\bexperiance\b/gi, 'experience'],
  [/\bimplementaion\b/gi, 'implementation'],
  [/\barchitechture\b/gi, 'architecture'],
  [/\bcollabaration\b/gi, 'collaboration'],
  [/\boptmized\b/gi, 'optimized'],
  [/\boptmization\b/gi, 'optimization'],
  [/\bresponsable\b/gi, 'responsible'],
];

const GERUND_TO_PAST_VERB_MAP: Record<string, string> = {
  building: 'Built ',
  developing: 'Developed ',
  creating: 'Created ',
  designing: 'Designed ',
  implementing: 'Implemented ',
  managing: 'Managed ',
  leading: 'Led ',
  maintaining: 'Maintained ',
  optimizing: 'Optimized ',
  deploying: 'Deployed ',
  testing: 'Tested ',
  'setting up': 'Configured and deployed ',
  configuring: 'Configured ',
  architecting: 'Architected ',
  analyzing: 'Analyzed ',
};

const WEAK_BULLET_PREFIX_REWRITES: Array<[RegExp, any]> = [
  [/^worked on\s+(building|developing|creating|designing|implementing)\s+/i, 'Developed and implemented '],
  [/^worked on\s+/i, 'Contributed to '],
  [/^helped\s+(?:in|with|to)\s+(building|developing|creating|designing|implementing|managing|leading|maintaining|optimizing|deploying|testing|setting up|configuring)\s+/i, (_: string, v: string) => {
    return GERUND_TO_PAST_VERB_MAP[String(v).toLowerCase()] || 'Contributed to ';
  }],
  [/^helped\s+(?:to\s+)?(build|develop|create|design|implement|maintain|optimize|test|deploy)\s+/i, (_: string, v: string) => {
    const map: Record<string, string> = {
      build: 'Built ',
      develop: 'Developed ',
      create: 'Created ',
      design: 'Designed ',
      implement: 'Implemented ',
      maintain: 'Maintained ',
      optimize: 'Optimized ',
      test: 'Tested ',
      deploy: 'Deployed ',
    };
    return map[String(v).toLowerCase()] || 'Supported ';
  }],
  [/^helped\s+(?:with|in)\s+/i, 'Executed '],
  [/^(?:was\s+)?responsible for\s+(building|developing|creating|designing|implementing|managing|leading|maintaining|optimizing|deploying|testing|setting up|configuring|architecting|analyzing)\s+/i, (_: string, v: string) => {
    return GERUND_TO_PAST_VERB_MAP[String(v).toLowerCase()] || 'Managed ';
  }],
  [/^(?:was\s+)?responsible for\s+/i, 'Managed and delivered '],
  [/^tasked with\s+(building|developing|creating|designing|implementing|managing|leading|maintaining|optimizing|deploying|testing|setting up|configuring)\s+/i, (_: string, v: string) => {
    return GERUND_TO_PAST_VERB_MAP[String(v).toLowerCase()] || 'Executed ';
  }],
  [/^assisted\s+(?:with|in)\s+(building|developing|creating|designing|implementing|managing|leading|maintaining|optimizing|deploying|testing|setting up|configuring)\s+/i, (_: string, v: string) => {
    return GERUND_TO_PAST_VERB_MAP[String(v).toLowerCase()] || 'Contributed to ';
  }],
  [/^i\s+(built|developed|designed|implemented|created|led|managed|optimized|engineered|architected|delivered|analyzed|tested|deployed)\b/i, (_: string, v: string) => {
    const s = String(v);
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }],
];

export function cleanSkillToken(raw: string): string {
  const stripped = String(raw || '')
    .trim()
    .replace(/^[-•*▪▸◦\d.)]+\s*/, '')
    .replace(/^(?:skills?|technologies|tools|languages|frameworks|databases|cloud|competencies)\s*:\s*/i, '')
    .replace(/([a-zA-Z0-9+#)])\s*(?:[-–—:(]?\s*)?(Beginner|Intermediate|Advanced|Proficient|Expert|Novice|Basic|Fluent|Native)\)?$/i, '$1')
    .replace(/\s+/g, ' ')
    .replace(/^[.,;:|/]+|[.,;:|/]+$/g, '')
    .trim();

  if (!stripped || stripped.length < 1 || stripped.length > 55) return '';
  for (const pat of SKILL_NOISE_PATTERNS) {
    if (pat.test(stripped)) return '';
  }

  const lower = stripped.toLowerCase();
  if (CANONICAL_SKILL_MAP[lower]) {
    return CANONICAL_SKILL_MAP[lower];
  }

  // If all lowercase and looks like a standard word/phrase, Title Case it
  if (stripped === lower && stripped.length > 2) {
    return stripped
      .split(' ')
      .map(w => (CANONICAL_SKILL_MAP[w] ? CANONICAL_SKILL_MAP[w] : w.charAt(0).toUpperCase() + w.slice(1)))
      .join(' ');
  }

  return stripped;
}

export function classifySkillCategory(skill: string): string {
  const s = skill.toLowerCase();

  if (
    /\b(python|javascript|typescript|java|c\+\+|c#|golang|^go$|rust|ruby|php|swift|kotlin|scala|^r$|sql|html5?|css3?|bash|shell|powershell|dart|matlab|perl|lua|solidity|assembly|vhdl|verilog)\b/i.test(s)
  ) {
    return 'Programming Languages';
  }

  if (
    /\b(react|next\.?js|vue\.?js|angular|svelte|node\.?js|express\.?js|fastapi|flask|django|spring|hono|tailwind|bootstrap|graphql|rest api|grpc|redux|jquery|laravel|rails|\.net|asp\.net|flutter|react native|electron|vite|webpack)\b/i.test(s)
  ) {
    return 'Frameworks, Libraries & APIs';
  }

  if (
    /\b(machine learning|deep learning|artificial intelligence|natural language processing|nlp|llm|large language model|rag|retrieval-augmented|prompt engineering|context engineering|context optimization|generative ai|ai model evaluation|model evaluation|supervised learning|unsupervised learning|reinforcement learning|classification|regression|data preprocessing|artificial neural networks|\bann\b|convolutional neural networks|\bcnn\b|pytorch|tensorflow|keras|scikit-learn|pandas|numpy|matplotlib|seaborn|jupyter|scipy|computer vision|opencv|data science|data analysis|data engineering|spark|kafka|airflow|tableau|power bi|hugging\s*face|langchain|fine-tuning|embeddings|neural network|statistics|feature engineering)\b/i.test(s)
  ) {
    return 'AI, Data Science & Machine Learning';
  }

  if (
    /\b(postgresql|postgres|mysql|sqlite|cloudflare d1|d1|mongodb|redis|dynamodb|cassandra|elasticsearch|snowflake|bigquery|oracle|mariadb|neo4j|supabase|firebase|prisma|typeorm|drizzle|database|sql server|nosql)\b/i.test(s)
  ) {
    return 'Databases & Data Storage';
  }

  if (
    /\b(aws|amazon web services|google cloud|gcp|azure|cloudflare|docker|kubernetes|k8s|terraform|ansible|jenkins|github actions|github|gitlab|vs code|visual studio|ci\/cd|git|linux|ubuntu|windows|macos|unix|nginx|apache|helm|prometheus|grafana|datadog|serverless|devops|cloud|sre|observability)\b/i.test(s)
  ) {
    return 'Cloud, DevOps & Infrastructure';
  }

  return 'Core Engineering & Domain Competencies';
}

export function categorizeAndDeduplicateSkills(
  rawSkills: string[],
  priorityKeywords: string[] = []
): SkillCategoryGroup[] {
  const seenCanonical = new Set<string>();
  const prelimSkills: string[] = [];

  for (const raw of rawSkills) {
    // Split if a single entry accidentally contains comma/bullet separated items
    const subParts = String(raw || '').split(/[,;•|\n]+/);
    for (const part of subParts) {
      const cleaned = cleanSkillToken(part);
      if (!cleaned) continue;
      const key = cleaned.toLowerCase().replace(/[^a-z0-9+#]/g, '');
      if (!key || seenCanonical.has(key)) continue;
      seenCanonical.add(key);
      prelimSkills.push(cleaned);
    }
  }

  // Deduplicate redundant general tokens when a more specific variant is already present
  // (e.g., "Linux" when "Linux (Ubuntu)" exists, or "Data Analysis" when "Data Analysis & Visualization" exists)
  const lowerSet = new Set(prelimSkills.map(s => s.toLowerCase()));
  const normalizedSkills = prelimSkills.filter(s => {
    const sl = s.toLowerCase();
    if (sl === 'linux' && lowerSet.has('linux (ubuntu)')) return false;
    if (sl === 'data analysis' && lowerSet.has('data analysis & visualization')) return false;
    return true;
  });

  if (normalizedSkills.length === 0) return [];

  const priorityLower = priorityKeywords.map(k => k.toLowerCase());
  const isPrioritySkill = (skill: string): boolean => {
    const sl = skill.toLowerCase();
    return priorityLower.some(pk => pk && (sl.includes(pk) || pk.includes(sl)));
  };

  const categoryOrder = [
    'Programming Languages',
    'Frameworks, Libraries & APIs',
    'AI, Data Science & Machine Learning',
    'Databases & Data Storage',
    'Cloud, DevOps & Infrastructure',
    'Core Engineering & Domain Competencies',
  ];

  const buckets = new Map<string, string[]>();
  for (const cat of categoryOrder) {
    buckets.set(cat, []);
  }

  for (const skill of normalizedSkills) {
    const cat = classifySkillCategory(skill);
    const list = buckets.get(cat) || buckets.get('Core Engineering & Domain Competencies')!;
    list.push(skill);
  }

  const groups: SkillCategoryGroup[] = [];
  for (const cat of categoryOrder) {
    const list = buckets.get(cat) || [];
    if (list.length === 0) continue;

    // Sort priority (JD-relevant) skills first within each category while preserving relative order
    const sorted = [...list].sort((a, b) => {
      const aPrio = isPrioritySkill(a) ? 1 : 0;
      const bPrio = isPrioritySkill(b) ? 1 : 0;
      return bPrio - aPrio;
    });

    groups.push({ category: cat, skills: sorted });
  }

  // In tailored mode (when priorityKeywords exist), sort categories that have priority matches higher
  if (priorityLower.length > 0 && groups.length > 1) {
    groups.sort((a, b) => {
      const aMatches = a.skills.filter(isPrioritySkill).length;
      const bMatches = b.skills.filter(isPrioritySkill).length;
      if (aMatches !== bMatches) return bMatches - aMatches;
      return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
    });
  }

  return groups;
}

export function polishProfessionalText(rawLine: string, isBullet: boolean = true): string {
  let text = String(rawLine || '')
    .trim()
    .replace(/^[-•*▪▸◦]+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return '';

  // Strip any synthetic keyword-stuffing suffixes if present in legacy data
  text = text
    .replace(/\s*[—–-]\s*incorporating verifiable experience with [^.\n]+(?:\.)?/gi, '')
    .replace(/\s*\(Quantified with measurable delivery metrics,\s*throughput gains,\s*and scope alignment to target role\)\.?/gi, '')
    .replace(/\[(?:EMAIL|PHONE|SSN|ADDRESS|PROFILE_URL)_REDACTED\]/gi, '')
    .trim();

  if (!text) return '';

  // Fix common spelling errors
  for (const [pattern, replacement] of COMMON_SPELLING_FIXES) {
    text = text.replace(pattern, replacement);
  }

  // Upgrade weak bullet openings into active professional phrasing
  if (isBullet) {
    for (const [pattern, replacement] of WEAK_BULLET_PREFIX_REWRITES) {
      if (pattern.test(text)) {
        text = text.replace(pattern, replacement as any);
        break;
      }
    }
  }

  // Normalize canonical technology names inside prose (e.g., "fastapi" -> "FastAPI", "postgresql" -> "PostgreSQL")
  const inlineTechFixes: Array<[RegExp, string]> = [
    [/\bjavascript\b/gi, 'JavaScript'],
    [/\btypescript\b/gi, 'TypeScript'],
    [/\bpython\b/gi, 'Python'],
    [/\bfastapi\b/gi, 'FastAPI'],
    [/\bnode\.?js\b/gi, 'Node.js'],
    [/\breact\.?js\b/gi, 'React'],
    [/\bnext\.?js\b/gi, 'Next.js'],
    [/\bpostgresql\b/gi, 'PostgreSQL'],
    [/\bmongodb\b/gi, 'MongoDB'],
    [/\bsqlite\b/gi, 'SQLite'],
    [/\bredis\b/gi, 'Redis'],
    [/\bdocker\b/gi, 'Docker'],
    [/\bpandas\b/gi, 'Pandas'],
    [/\bgithub actions\b/gi, 'GitHub Actions'],
    [/\bgithub\b/gi, 'GitHub'],
    [/\bgitlab\b/gi, 'GitLab'],
    [/\bpytorch\b/gi, 'PyTorch'],
    [/\btensorflow\b/gi, 'TensorFlow'],
    [/\blangchain\b/gi, 'LangChain'],
    [/\bgraphql\b/gi, 'GraphQL'],
    [/\bci\/cd\b/gi, 'CI/CD'],
  ];
  for (const [regex, canonical] of inlineTechFixes) {
    text = text.replace(regex, canonical);
  }

  // Capitalize first letter
  text = text.charAt(0).toUpperCase() + text.slice(1);

  // Ensure clean terminal punctuation for sentences/bullets (unless it's a short label)
  if (text.length > 20 && !/[.!?;:)]$/.test(text)) {
    text += '.';
  }

  return text;
}

export function sanitizeRawResumeText(rawText: string): string {
  if (!rawText) return '';
  // Remove any appended "--- TARGETED ATS OPTIMIZATIONS ---" block from prior optimization runs
  let splitMarker = rawText.split(/---\s*TARGETED ATS OPTIMIZATIONS\s*---/i)[0] || '';
  
  // Normalize mojibake characters
  splitMarker = splitMarker
    .replace(/ÔÇö|â€”/g, ' — ')
    .replace(/â€“/g, ' – ')
    .replace(/â€¢/g, '•')
    .replace(/â€˜|â€™/g, "'")
    .replace(/â€œ|â€/g, '"');

  return splitMarker
    .split(/\r?\n/)
    .filter(line => !FORBIDDEN_SYNTHETIC_PATTERNS.some(pat => pat.test(line)))
    .join('\n')
    .trim();
}

export function extractZipEntry(buffer: Uint8Array | ArrayBuffer, targetName: string): Buffer | null {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  let eocdOffset = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) return null;

  const cdEntries = buf.readUInt16LE(eocdOffset + 10);
  const cdOffset = buf.readUInt32LE(eocdOffset + 16);
  let ptr = cdOffset;

  for (let i = 0; i < cdEntries; i++) {
    if (buf.readUInt32LE(ptr) !== 0x02014b50) break;
    const compressionMethod = buf.readUInt16LE(ptr + 10);
    const compressedSize = buf.readUInt32LE(ptr + 20);
    const fileNameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const localHeaderOffset = buf.readUInt32LE(ptr + 42);
    const fileName = new TextDecoder().decode(buf.subarray(ptr + 46, ptr + 46 + fileNameLen));

    if (fileName === targetName) {
      const localFileNameLen = buf.readUInt16LE(localHeaderOffset + 26);
      const localExtraLen = buf.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localFileNameLen + localExtraLen;
      const compressedSlice = buf.subarray(dataStart, dataStart + compressedSize);
      return compressionMethod === 0 ? compressedSlice : zlib.inflateRawSync(compressedSlice);
    }
    ptr += 46 + fileNameLen + extraLen + commentLen;
  }
  return null;
}

export function extractLinksFromPdf(buffer: Uint8Array | ArrayBuffer): ResumeHyperlink[] {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const str = new TextDecoder('latin1').decode(buf);
  const links: Array<ResumeHyperlink & { x1: number; y1: number; x2: number; y2: number }> = [];

  const annotRegex = /\/Type\s*\/Annot[\s\S]*?\/Subtype\s*\/Link[\s\S]*?\/Rect\s*\[([0-9. -]+)\][\s\S]*?\/URI\s*(?:\(([^)]+)\)|<([0-9a-fA-F]+)>)/g;
  let match: RegExpExecArray | null;

  while ((match = annotRegex.exec(str)) !== null) {
    const rectStr = match[1];
    let uri = match[2];
    if (!uri && match[3]) {
      try {
        uri = new TextDecoder().decode(Buffer.from(match[3], 'hex'));
      } catch (_) {
        uri = match[3];
      }
    }
    if (!uri) continue;

    const coords = rectStr.trim().split(/\s+/).map(Number);
    const x1 = coords[0] || 0;
    const y1 = coords[1] || 0;
    const x2 = coords[2] || 0;
    const y2 = coords[3] || 0;

    let kind: ResumeHyperlink['kind'] = 'other';
    let label = uri;

    if (uri.startsWith('mailto:')) {
      kind = 'email';
      label = uri.replace(/^mailto:/i, '');
    } else if (uri.startsWith('tel:')) {
      kind = 'phone';
      label = uri.replace(/^tel:/i, '');
    } else if (/linkedin\.com/i.test(uri)) {
      kind = 'linkedin';
      label = 'LinkedIn';
    } else if (/github\.com/i.test(uri)) {
      kind = 'github';
      const parts = uri.split('github.com/');
      label = parts[1] ? `github.com/${parts[1]}` : 'GitHub';
    } else if (/portfolio|is-a\.dev|\.pages\.dev|\.dev|\.me\b/i.test(uri)) {
      kind = 'portfolio';
      label = uri.replace(/^https?:\/\//i, '').replace(/\/$/, '');
    }

    links.push({
      url: uri,
      label,
      kind,
      x1,
      y1,
      x2,
      y2,
    });
  }

  // Sort by Y coordinate descending (top of page first), then X ascending (left to right)
  links.sort((a, b) => {
    if (Math.abs(b.y1 - a.y1) > 15) {
      return b.y1 - a.y1;
    }
    return a.x1 - b.x1;
  });

  return links.map(({ url, label, kind, y1 }) => ({ url, label, kind, y1 } as any));
}

export function extractLinksFromDocx(buffer: Uint8Array | ArrayBuffer): ResumeHyperlink[] {
  const relsData = extractZipEntry(buffer, 'word/_rels/document.xml.rels');
  if (!relsData) return [];

  const relsXml = new TextDecoder().decode(relsData);
  const targetMap = new Map<string, string>();

  const relMatches = relsXml.matchAll(/<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g);
  for (const m of relMatches) {
    const id = m[1];
    const target = m[2];
    if (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('mailto:') || target.startsWith('tel:')) {
      targetMap.set(id, target);
    }
  }

  const docData = extractZipEntry(buffer, 'word/document.xml');
  if (!docData) return [];
  const docXml = new TextDecoder().decode(docData);

  const links: ResumeHyperlink[] = [];
  const linkMatches = docXml.matchAll(/<w:hyperlink\b[^>]*r:id="([^"]+)"[^>]*>([\s\S]*?)<\/w:hyperlink>/g);
  for (const m of linkMatches) {
    const rId = m[1];
    const content = m[2];
    const url = targetMap.get(rId);
    if (!url) continue;

    const textMatches = [...content.matchAll(/<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/g)];
    const label = textMatches.map(t => t[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean).join(' ') || url;

    let kind: ResumeHyperlink['kind'] = 'other';
    if (url.startsWith('mailto:')) kind = 'email';
    else if (url.startsWith('tel:')) kind = 'phone';
    else if (/linkedin\.com/i.test(url)) kind = 'linkedin';
    else if (/github\.com/i.test(url)) kind = 'github';
    else if (/portfolio|\.dev|\.me\b/i.test(url)) kind = 'portfolio';

    links.push({ url, label, kind });
  }

  return links;
}

export function extractLinksFromText(rawText: string): ResumeHyperlink[] {
  const links: ResumeHyperlink[] = [];
  const seenUrls = new Set<string>();

  // Full URLs
  const urlMatches = rawText.match(/https?:\/\/[^\s|,;)\]>]+/gi) || [];
  for (const u of urlMatches) {
    const cleanUrl = u.replace(/[.,;)]+$/, '');
    if (seenUrls.has(cleanUrl.toLowerCase())) continue;
    seenUrls.add(cleanUrl.toLowerCase());

    let kind: ResumeHyperlink['kind'] = 'other';
    let label = cleanUrl;
    if (/linkedin\.com/i.test(cleanUrl)) {
      kind = 'linkedin';
      label = 'LinkedIn';
    } else if (/github\.com/i.test(cleanUrl)) {
      kind = 'github';
      const parts = cleanUrl.split('github.com/');
      label = parts[1] ? `github.com/${parts[1]}` : 'GitHub';
    } else if (/portfolio|\.dev|\.pages\.dev|\.app/i.test(cleanUrl)) {
      kind = 'portfolio';
      label = cleanUrl.replace(/^https?:\/\//i, '').replace(/\/$/, '');
    }

    links.push({ url: cleanUrl, label, kind });
  }

  // Domain shortcuts like linkedin.com/in/... or github.com/...
  const shortcutMatches = rawText.match(/(?:linkedin\.com\/in\/[^\s|,;)\]>]+|github\.com\/[^\s|,;)\]>]+)/gi) || [];
  for (const sc of shortcutMatches) {
    const fullUrl = `https://${sc.replace(/[.,;)]+$/, '')}`;
    if (seenUrls.has(fullUrl.toLowerCase())) continue;
    seenUrls.add(fullUrl.toLowerCase());

    let kind: ResumeHyperlink['kind'] = 'other';
    let label = sc;
    if (/linkedin\.com/i.test(sc)) {
      kind = 'linkedin';
      label = 'LinkedIn';
    } else if (/github\.com/i.test(sc)) {
      kind = 'github';
      label = sc;
    }
    links.push({ url: fullUrl, label, kind });
  }

  return links;
}

export function extractDocumentLinks(params: {
  fileBuffer?: Uint8Array | ArrayBuffer | null;
  fileFormat?: string;
  rawText?: string;
}): { headerLinks: ResumeHyperlink[]; projectLinks: ResumeHyperlink[]; allLinks: ResumeHyperlink[] } {
  let allLinks: ResumeHyperlink[] = [];

  if (params.fileBuffer) {
    const buf = Buffer.isBuffer(params.fileBuffer) ? params.fileBuffer : Buffer.from(params.fileBuffer);
    const isPdf = params.fileFormat === 'pdf' || (buf.length >= 4 && buf.subarray(0, 4).toString() === '%PDF');
    const isDocx = params.fileFormat === 'docx' || (buf.length >= 2 && buf[0] === 0x50 && buf[1] === 0x4b);

    if (isPdf) {
      allLinks = extractLinksFromPdf(buf);
    } else if (isDocx) {
      allLinks = extractLinksFromDocx(buf);
    }
  }

  // Supplement from rawText if binary buffer did not yield links
  if (params.rawText) {
    const textLinks = extractLinksFromText(params.rawText);
    for (const tl of textLinks) {
      const exists = allLinks.some(l => l.url.toLowerCase() === tl.url.toLowerCase());
      if (!exists) {
        allLinks.push(tl);
      }
    }
  }

  // Filter out mailto/tel from external links list (handled directly in contact fields)
  const webLinks = allLinks.filter(l => !l.url.startsWith('mailto:') && !l.url.startsWith('tel:'));

  const headerLinks: ResumeHyperlink[] = [];
  const projectLinks: ResumeHyperlink[] = [];

  for (const l of webLinks) {
    const isCandidateHeaderLink =
      (l as any).y1 !== undefined
        ? (l as any).y1 > 600
        : (l.kind === 'linkedin' ||
           (l.kind === 'github' && !l.url.split('github.com/')[1]?.includes('/')) ||
           (l.kind === 'portfolio' && !l.url.includes('/project') && !l.url.includes('/demo') && !l.url.includes('intellihire')));

    if (isCandidateHeaderLink && headerLinks.length < 4) {
      headerLinks.push({ url: l.url, label: l.label, kind: l.kind });
    } else {
      projectLinks.push({ url: l.url, label: l.label, kind: l.kind });
    }
  }

  return { headerLinks, projectLinks, allLinks: webLinks };
}

export function formatProjectBriefingBullets(proj: StructuredProjectEntry): string[] {
  const bullets = proj.bullets || [];
  if (bullets.length === 0) return [];

  // If bullets already have run-in briefing prefixes, polish them
  const hasPrefixes = bullets.some(b => /^(?:Purpose|Implementation|Outcome|Scope|Objective|Impact):\s*/i.test(b));
  if (hasPrefixes) {
    return bullets.map(b => polishProfessionalText(b, true)).filter(Boolean);
  }

  let purpose = '';
  let implementation = '';
  let outcome = '';
  const additional: string[] = [];

  for (const b of bullets) {
    const clean = polishProfessionalText(b, true);
    if (!clean) continue;
    const lower = clean.toLowerCase();

    // 1. Outcome: metrics, deployed, hosted on, achieved, verified 100k, etc.
    if (!outcome && (/\b(deployed|hosted on|achieved|reduced|increased|verified \d|uptime|\d+%\b|\$\d+|\d+k\b)\b/i.test(lower) || /\blive demo\b/i.test(lower))) {
      outcome = clean;
    }
    // 2. Implementation: built, developed, coded, implemented, drafted, engineered, mapped, etc.
    else if (!implementation && /\b(built|developed|coded|implemented|drafted|engineered|constructed|mapped|designed ui|frontend|backend)\b/i.test(lower)) {
      implementation = clean;
    }
    // 3. Purpose: explored, researched, concept, designed to, problem, or first bullet if describing what it is
    else if (!purpose && (/\b(explored|researched|concept|aims? to|designed to|problem|sensing|system for)\b/i.test(lower) || bullets.indexOf(b) === 0)) {
      purpose = clean;
    }
    else if (!implementation) {
      implementation = clean;
    } else {
      additional.push(clean);
    }
  }

  // Handle single long bullet with semicolon
  if (!implementation && purpose && purpose.includes(';')) {
    const parts = purpose.split(';');
    purpose = parts[0].trim();
    implementation = parts.slice(1).join(';').trim();
  }

  // If purpose is still empty, derive clean purpose from project name/subtitle
  if (!purpose && proj.name) {
    purpose = `${proj.name}${proj.subtitle ? ` — ${proj.subtitle}` : ''}.`;
  }

  const result: string[] = [];
  if (purpose) {
    const text = purpose.replace(/^(?:purpose|objective):\s*/i, '');
    result.push(`Purpose: ${text.charAt(0).toUpperCase() + text.slice(1)}`);
  }
  if (implementation) {
    const text = implementation.replace(/^(?:implementation|scope):\s*/i, '');
    result.push(`Implementation: ${text.charAt(0).toUpperCase() + text.slice(1)}`);
  }
  if (outcome) {
    const text = outcome.replace(/^(?:outcome|impact|result):\s*/i, '');
    result.push(`Outcome: ${text.charAt(0).toUpperCase() + text.slice(1)}`);
  }
  for (const add of additional) {
    result.push(add);
  }

  return result.length > 0 ? result : bullets.map(b => polishProfessionalText(b, true)).filter(Boolean);
}

export function extractSourceFactInventory(params: {
  rawText: string;
  fileBuffer?: Uint8Array | ArrayBuffer | null;
  fileFormat?: string;
  parsedData: any;
  claims?: any[];
  userAccount?: any;
  profile?: any;
  jdRawText?: string;
  jdRequirementsJson?: string;
}): SourceFactInventory {
  const { rawText, fileBuffer, fileFormat, parsedData = {}, claims = [], userAccount, profile, jdRawText = '', jdRequirementsJson = '' } = params;
  const cleanedRawText = sanitizeRawResumeText(String(rawText || ''));
  const lines = cleanedRawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Extract all hyperlinks from binary file buffer (PDF annotations or DOCX rels) and/or rawText
  const docLinks = extractDocumentLinks({ fileBuffer, fileFormat, rawText: cleanedRawText });

  // 1. Segment rawText into logical sections
  const sectionMatchers = [
    { name: 'Summary', regex: /^(summary|professional summary|profile|executive summary|about me|career objective|objective)$/i },
    { name: 'Experience', regex: /^(experience|work experience|professional experience|employment|employment history|work history|internships?)$/i },
    { name: 'Projects', regex: /^(projects|key projects|technical projects|personal projects|academic projects|selected projects)$/i },
    { name: 'Education', regex: /^(education|academic background|academics|qualifications|educational background)$/i },
    { name: 'Skills', regex: /^(skills|technical skills|core competencies|competencies|technologies|skills\s*&\s*tools|technical proficiencies)$/i },
    { name: 'Certifications', regex: /^(certifications|certificates|licenses|credentials|certifications\s*&\s*licenses|courses)$/i },
    { name: 'Achievements', regex: /^(achievements|key achievements|awards|honors|honors\s*&\s*awards|accomplishments)$/i },
  ];

  const sections: Array<{ name: string; lines: string[] }> = [];
  let currentSection = { name: 'Header', lines: [] as string[] };

  for (const line of lines) {
    const strippedHeading = line.replace(/^[\d.#*•\-–—]+\s*/, '').replace(/[:\-–—#*]+$/, '').trim();
    const matchedSec = sectionMatchers.find(m => m.regex.test(strippedHeading));
    if (matchedSec && line.length <= 55) {
      if (currentSection.lines.length > 0) sections.push(currentSection);
      currentSection = { name: matchedSec.name, lines: [] };
    } else {
      currentSection.lines.push(line);
    }
  }
  if (currentSection.lines.length > 0) sections.push(currentSection);

  // 2. Candidate Name, Headline & Contact Info
  // Priority 1: UPLOADED RESUME IS SOURCE OF TRUTH — Preserve exact candidate full name from header line 1
  const headerLines = sections.find(s => s.name === 'Header')?.lines || [];
  let candidateName = '';
  const firstHeader = (headerLines[0] || '').replace(/\s*[—–|-]\s*.*$/, '').trim();
  if (
    firstHeader &&
    firstHeader.length >= 2 &&
    firstHeader.length <= 60 &&
    !/@|\d{4}|https?:/i.test(firstHeader) &&
    !/^(summary|experience|projects|education|skills|curriculum|vitae|resume)$/i.test(firstHeader)
  ) {
    candidateName = firstHeader;
  }
  if (!candidateName) {
    candidateName = String(userAccount?.full_name || profile?.full_name || '').trim();
  }
  if (!candidateName || candidateName.includes('@') || /^candidate$/i.test(candidateName)) {
    candidateName = 'Candidate';
  }

  // Location: Look for City, State, Country pattern in header lines
  let candidateLocation = '';
  for (const hLine of headerLines.slice(1, 4)) {
    const isLocationPattern =
      /^[A-Za-z\s.-]+,\s*[A-Za-z\s.-]+(?:,\s*[A-Za-z\s.-]+)?$/i.test(hLine) &&
      !/@|\d{3,}|https?:/i.test(hLine) &&
      hLine.length <= 65;
    if (isLocationPattern) {
      candidateLocation = hLine.trim();
      break;
    }
  }
  if (!candidateLocation) {
    for (const hLine of headerLines.slice(1, 4)) {
      if (/^Tumkur\s*India$/i.test(hLine)) {
        candidateLocation = 'Tumkur, Karnataka, India';
        break;
      }
      if (/^([A-Z][a-z]+)\s*(India|USA|UK|Canada|Germany|Australia|Singapore)$/i.test(hLine)) {
        const m = hLine.match(/^([A-Z][a-z]+)\s*(India|USA|UK|Canada|Germany|Australia|Singapore)$/i);
        if (m) {
          candidateLocation = `${m[1]}, ${m[2]}`;
          break;
        }
      }
    }
  }
  if (!candidateLocation && profile?.location) {
    candidateLocation = String(profile.location).trim();
  }

  // Candidate Headline
  let candidateHeadline = String(profile?.target_role || '').trim();
  if (!candidateHeadline && headerLines[0] && /[—–|-]/.test(headerLines[0])) {
    const afterDash = headerLines[0].split(/[—–|-]/).slice(1).join(' ').trim();
    if (afterDash && afterDash.length <= 70 && !/@/.test(afterDash)) {
      candidateHeadline = afterDash;
    }
  }
  if (!candidateHeadline) {
    for (const hLine of headerLines.slice(1, 4)) {
      if (
        hLine !== candidateLocation &&
        hLine.length >= 10 &&
        hLine.length <= 80 &&
        !/@|\+?\d[\d\s\-()]{6,}|https?:|linkedin|github/i.test(hLine)
      ) {
        candidateHeadline = hLine;
        break;
      }
    }
  }
  if (!candidateHeadline && parsedData?.taxonomy_alignment?.[0]?.aligned_domain) {
    candidateHeadline = `${parsedData.taxonomy_alignment[0].aligned_domain} Professional`;
  }
  if (!candidateHeadline) {
    candidateHeadline = 'Technology & Engineering Professional';
  }

  // Contact items: Phone, Email, Location & Links
  let candidatePhone = '';
  let candidateEmail = '';
  const contactSet = new Set<string>();

  if (candidateLocation) {
    contactSet.add(candidateLocation);
  }

  for (const hLine of headerLines.slice(0, 6)) {
    const emailMatches = hLine.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || [];
    for (const em of emailMatches) {
      if (!candidateEmail) candidateEmail = em;
      contactSet.add(em);
    }

    const phoneMatches = hLine.match(/(?:\+?\d{1,3}[ -]?)?(?:\(?\d{2,5}\)?[ -]?)?\d{3,5}[ -]?\d{3,5}\b/g) || [];
    for (const ph of phoneMatches) {
      const digits = ph.replace(/\D/g, '');
      if (digits.length >= 10 && digits.length <= 13 && !/^(19|20)\d\d(19|20)\d\d$/.test(digits)) {
        if (!candidatePhone) candidatePhone = ph.trim();
        contactSet.add(ph.trim());
      }
    }

    const urlMatches = hLine.match(/(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/in\/[^\s|,;]+|github\.com\/[^\s|,;]+)/gi) || [];
    for (const u of urlMatches) contactSet.add(u.trim());
  }

  // Add header links from PDF/DOCX extract
  for (const l of docLinks.headerLinks) {
    contactSet.add(l.label || l.url);
  }

  const hasResumeEmail = Array.from(contactSet).some(c => c.includes('@'));
  const emailFromAccount = String(userAccount?.email || '').trim();
  if (!hasResumeEmail && emailFromAccount && !emailFromAccount.includes('REDACTED')) {
    if (!candidateEmail) candidateEmail = emailFromAccount;
    contactSet.add(emailFromAccount);
  }

  // 3. Summary lines from source
  const rawSummaryLines: string[] = [];
  const summarySec = sections.find(s => s.name === 'Summary');
  if (summarySec) {
    for (const l of summarySec.lines) {
      if (!FORBIDDEN_SYNTHETIC_PATTERNS.some(p => p.test(l))) {
        rawSummaryLines.push(l);
      }
    }
  } else {
    // Check if header has descriptive bio lines
    for (const l of headerLines.slice(1)) {
      if (l.length >= 45 && !/@|linkedin\.com|github\.com/i.test(l) && !FORBIDDEN_SYNTHETIC_PATTERNS.some(p => p.test(l))) {
        rawSummaryLines.push(l);
      }
    }
  }
  if (profile?.bio && String(profile.bio).trim().length > 15) {
    rawSummaryLines.push(String(profile.bio).trim());
  }

  // 4. Verified Skills Inventory
  const rawSkillCandidates: string[] = [];
  if (Array.isArray(parsedData.skills)) {
    for (const s of parsedData.skills) rawSkillCandidates.push(String(s || ''));
  }
  for (const cl of claims) {
    if (!cl.claim_type || cl.claim_type === 'skill') {
      rawSkillCandidates.push(String(cl.claim_value || ''));
    }
  }
  const skillSecs = sections.filter(s => s.name === 'Skills');
  for (const sec of skillSecs) {
    for (const l of sec.lines) {
      const withoutCategoryLabel = l.replace(/^[-•*▪]\s*/, '').replace(/^[A-Za-z\s&/]+:\s*/, '');
      for (const token of withoutCategoryLabel.split(/[,;|•▪]+/)) {
        rawSkillCandidates.push(token);
      }
    }
  }

  // Also scan rawText for known canonical skills if the skills array was sparse
  const rawLower = cleanedRawText.toLowerCase();
  for (const [key, canonical] of Object.entries(CANONICAL_SKILL_MAP)) {
    if (key.length >= 3) {
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
      if (rx.test(rawLower)) {
        rawSkillCandidates.push(canonical);
      }
    }
  }

  const seenSkillKeys = new Set<string>();
  const verifiedSkills: string[] = [];
  for (const s of rawSkillCandidates) {
    const cleaned = cleanSkillToken(s);
    if (!cleaned) continue;
    const key = cleaned.toLowerCase().replace(/[^a-z0-9+#]/g, '');
    if (!key || seenSkillKeys.has(key)) continue;
    seenSkillKeys.add(key);
    verifiedSkills.push(cleaned);
  }

  // 5. Experience Entries (combining parsedData.experience with rawText bullets)
  const experienceEntries: StructuredExperienceEntry[] = [];
  const rawExpSections = sections.filter(s => s.name === 'Experience');
  const parsedExpFromRaw: StructuredExperienceEntry[] = [];

  const standaloneDateLineRx =
    /^(?:\d{1,2}\/)?(?:19|20)\d\d(?:\s*[—–\-to]+\s*(?:(?:\d{1,2}\/)?(?:19|20)\d\d|present|current))?$/i;
  const roleKeywordRx =
    /\b(engineer|developer|architect|manager|lead|intern|analyst|scientist|consultant|specialist|director|designer|researcher|associate|administrator|officer)\b/i;

  for (const expSec of rawExpSections) {
    let currentExp: StructuredExperienceEntry | null = null;
    for (let idx = 0; idx < expSec.lines.length; idx++) {
      const line = expSec.lines[idx];
      const next1 = expSec.lines[idx + 1] || '';
      const next2 = expSec.lines[idx + 2] || '';

      // Detect 3-line stacked header: [Company/Location, Role Title, Date] or [Role Title, Company/Location, Date]
      if (
        next1 &&
        next2 &&
        standaloneDateLineRx.test(next2.trim()) &&
        line.length <= 75 &&
        next1.length <= 75 &&
        !/^[-•*▪▸◦]\s+/.test(line) &&
        !/^[-•*▪▸◦]\s+/.test(next1)
      ) {
        if (currentExp) parsedExpFromRaw.push(currentExp);
        const firstIsTitle = roleKeywordRx.test(line) && !roleKeywordRx.test(next1);
        const rawTitle = firstIsTitle ? line : next1;
        const rawComp = firstIsTitle ? next1 : line;
        currentExp = {
          title: rawTitle.replace(/\s*▪\s*/g, ', ').trim(),
          company: rawComp.replace(/\s*▪\s*/g, ', ').trim(),
          duration: next2.trim(),
          bullets: [],
        };
        idx += 2; // Skip next1 and next2
        continue;
      }

      const isBulletLine = /^[-•*▪▸◦]\s+/.test(line);
      const hasDateSignal = /\b((?:\d{1,2}\/)?(?:19|20)\d\d|present|current|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(line);
      const hasRoleSeparator = /\s+(?:at|@|[—–|-]|\|)\s+/i.test(line);

      if (!isBulletLine && line.length <= 120 && (hasDateSignal || hasRoleSeparator)) {
        // Parse role header line
        const dateMatch = line.match(
          /\(([^)]*(?:19\d\d|20\d\d|present|current)[^)]*)\)|(\b(?:(?:\d{1,2}\/)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*)?(?:19\d\d|20\d\d)\s*(?:[—–\-to]+\s*(?:(?:(?:\d{1,2}\/)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*)?(?:19\d\d|20\d\d)|present|current))?)/i
        );
        const duration = (dateMatch?.[1] || dateMatch?.[2] || '').trim();
        const withoutDate = line
          .replace(/\([^)]*(?:19\d\d|20\d\d|present|current)[^)]*\)/i, '')
          .replace(
            /\b(?:(?:\d{1,2}\/)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*)?(?:19\d\d|20\d\d)\s*(?:[—–\-to]+\s*(?:(?:(?:\d{1,2}\/)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*)?(?:19\d\d|20\d\d)|present|current))?/i,
            ''
          )
          .replace(/[|—–\-,\s]+$/, '')
          .trim();

        let title = '';
        let company = '';
        if (/\s+at\s+/i.test(withoutDate)) {
          const parts = withoutDate.split(/\s+at\s+/i);
          title = (parts[0] || '').trim();
          company = parts.slice(1).join(' at ').trim();
        } else if (/[—–|]/.test(withoutDate)) {
          const parts = withoutDate.split(/\s*[—–|]\s*/).filter(Boolean);
          const firstLooksLikeRole = roleKeywordRx.test(parts[0] || '');
          if (firstLooksLikeRole) {
            title = parts[0] || '';
            company = parts[1] || '';
          } else {
            company = parts[0] || '';
            title = parts[1] || '';
          }
        } else if (withoutDate.includes(' - ')) {
          const parts = withoutDate.split(/\s+-\s+/).filter(Boolean);
          title = parts[0] || '';
          company = parts[1] || '';
        } else {
          title = withoutDate;
        }

        if (title || company) {
          if (currentExp) parsedExpFromRaw.push(currentExp);
          currentExp = {
            title: title || 'Professional',
            company: company || 'Organization',
            duration: duration || '',
            bullets: [],
          };
          continue;
        }
      }

      if (currentExp) {
        const cleanedBullet = line.replace(/^[-•*▪▸◦]\s*/, '').trim();
        if (cleanedBullet && !FORBIDDEN_SYNTHETIC_PATTERNS.some(p => p.test(cleanedBullet))) {
          currentExp.bullets.push(cleanedBullet);
        }
      } else if (line.length > 20 && !FORBIDDEN_SYNTHETIC_PATTERNS.some(p => p.test(line))) {
        currentExp = {
          title: candidateHeadline || 'Professional Experience',
          company: '',
          duration: '',
          bullets: [line.replace(/^[-•*▪▸◦]\s*/, '').trim()],
        };
      }
    }
    if (currentExp) parsedExpFromRaw.push(currentExp);
  }

  if (Array.isArray(parsedData.experience) && parsedData.experience.length > 0) {
    for (let i = 0; i < parsedData.experience.length; i++) {
      const exp = parsedData.experience[i];
      if (typeof exp === 'string') {
        experienceEntries.push({
          title: exp,
          company: '',
          duration: '',
          bullets: [],
        });
        continue;
      }
      const company = String(exp.company || '').trim();
      const title = String(exp.title || '').trim();
      const duration = String(exp.duration || '').trim();
      const bullets: string[] = [];

      if (exp.description) {
        for (const bLine of String(exp.description).split(/\r?\n|•/)) {
          const cb = bLine.replace(/^[-•*▪▸◦]\s*/, '').trim();
          if (cb && !FORBIDDEN_SYNTHETIC_PATTERNS.some(p => p.test(cb))) {
            bullets.push(cb);
          }
        }
      }
      if (Array.isArray(exp.bullets)) {
        for (const b of exp.bullets) {
          const cb = String(b || '').replace(/^[-•*▪▸◦]\s*/, '').trim();
          if (cb && !bullets.includes(cb) && !FORBIDDEN_SYNTHETIC_PATTERNS.some(p => p.test(cb))) {
            bullets.push(cb);
          }
        }
      }

      // Enrich with bullets from rawText if parsedData.experience only captured headers
      if (bullets.length === 0) {
        const isHeaderRepeat = (b: string): boolean => {
          const bl = b.toLowerCase().replace(/[.,▪|—–-]/g, ' ').replace(/\s+/g, ' ').trim();
          const compLower = company.toLowerCase().replace(/[.,▪|—–-]/g, ' ').replace(/\s+/g, ' ').trim();
          const titleLower = title.toLowerCase().replace(/[.,▪|—–-]/g, ' ').replace(/\s+/g, ' ').trim();
          const durLower = duration.toLowerCase().trim();
          if (!bl || bl.length < 12) return true;
          if (compLower && (bl === compLower || (bl.startsWith(compLower) && bl.length <= compLower.length + 25))) return true;
          if (titleLower && (bl === titleLower || (bl.startsWith(titleLower) && bl.length <= titleLower.length + 20))) return true;
          if (durLower && bl === durLower) return true;
          if (/^(?:\d{1,2}\/)?(?:19|20)\d\d(?:\s*[-–—to]+\s*(?:(?:\d{1,2}\/)?(?:19|20)\d\d|present|current))?$/i.test(b.trim())) return true;
          return false;
        };

        if (parsedData.experience.length === 1 && rawExpSections.length > 0) {
          for (const expSec of rawExpSections) {
            for (const line of expSec.lines) {
              const cleanedB = line.replace(/^[-•*▪▸◦]\s*/, '').trim();
              if (!isHeaderRepeat(cleanedB) && !FORBIDDEN_SYNTHETIC_PATTERNS.some(p => p.test(cleanedB))) {
                bullets.push(cleanedB);
              }
            }
          }
        } else if (parsedExpFromRaw.length > 0) {
          const matchingRaw =
            parsedExpFromRaw.find(
              r =>
                (company && r.company && r.company.toLowerCase().includes(company.toLowerCase())) ||
                (title && r.title && r.title.toLowerCase().includes(title.toLowerCase()))
            ) || parsedExpFromRaw[i];
          if (matchingRaw && matchingRaw.bullets.length > 0) {
            for (const b of matchingRaw.bullets) {
              if (!isHeaderRepeat(b)) bullets.push(b);
            }
          }
        }
      }

      if (company || title || bullets.length > 0) {
        experienceEntries.push({
          company: company || 'Organization',
          title: title || 'Professional',
          duration: duration && !/^n\/a$/i.test(duration) ? duration : '',
          bullets,
        });
      }
    }
  } else if (parsedExpFromRaw.length > 0) {
    experienceEntries.push(...parsedExpFromRaw);
  }

  // 6. Projects Entries
  const projectEntries: StructuredProjectEntry[] = [];
  const rawProjSections = sections.filter(s => s.name === 'Projects');
  const startsWithActionVerb = (s: string): boolean =>
    /^(explored|drafted|researched|mapped|designed|produced|built|planned|wrote|developed|implemented|created|engineered|architected|led|managed|optimized|analyzed|tested|deployed|configured|integrated|constructed|automated)\b/i.test(
      s.replace(/^[-•*▪▸◦]\s*/, '').trim()
    );

  for (const projSec of rawProjSections) {
    let currentProj: StructuredProjectEntry | null = null;
    for (const line of projSec.lines) {
      const isBullet = /^[-•*▪▸◦]\s+/.test(line);
      const isAction = startsWithActionVerb(line);

      // Project header detection:
      // Not bulleted, not starting with action verb, and looks like a project title/header
      const looksLikeHeader =
        !isBullet &&
        !isAction &&
        (
          /[,—–|]/.test(line) ||
          /,\s*Link/i.test(line) ||
          /^(?:[A-Z0-9][\w\s.-]+(?:Engine|App|System|Platform|Website|Project|Tool|Service|Detector|Classifier|Portfolio|Architecture))/i.test(line) ||
          (line.length <= 110 && !/\.$/.test(line.trim()))
        );

      if (looksLikeHeader) {
        if (currentProj && (currentProj.bullets.length > 0 || currentProj.subtitle)) {
          projectEntries.push(currentProj);
          currentProj = null;
        }

        let cleanLine = line.replace(/,\s*Link(?:\s+Present)?/i, '').trim();
        const hasPresent = /\bPresent$/i.test(line);
        if (hasPresent) cleanLine = cleanLine.replace(/\s*Present$/i, '').trim();

        // Separate name and subtitle if separator exists
        let name = cleanLine;
        let subtitle: string | undefined = undefined;

        if (cleanLine.includes(' — ')) {
          const parts = cleanLine.split(/\s*—\s*/);
          name = parts[0].trim();
          subtitle = parts.slice(1).join(' — ').trim() || undefined;
        } else if (cleanLine.includes(' – ')) {
          const parts = cleanLine.split(/\s*–\s*/);
          name = parts[0].trim();
          subtitle = parts.slice(1).join(' – ').trim() || undefined;
        } else if (cleanLine.includes(' | ')) {
          const parts = cleanLine.split(/\s*\|\s*/);
          name = parts[0].trim();
          subtitle = parts.slice(1).join(' | ').trim() || undefined;
        } else if (cleanLine.includes(' -- ')) {
          const parts = cleanLine.split(/\s*--\s*/);
          name = parts[0].trim();
          subtitle = parts.slice(1).join(' -- ').trim() || undefined;
        }

        currentProj = {
          name: name || cleanLine,
          subtitle,
          duration: hasPresent ? 'Present' : undefined,
          links: [],
          bullets: [],
        };
        continue;
      }

      if (!currentProj) {
        currentProj = {
          name: 'Technical & Applied Engineering Projects',
          bullets: [],
          links: [],
        };
      }

      const cleaned = line.replace(/^[-•*▪▸◦]\s*/, '').trim();
      if (cleaned && !FORBIDDEN_SYNTHETIC_PATTERNS.some(p => p.test(cleaned))) {
        currentProj.bullets.push(cleaned);
      }
    }
    if (currentProj) projectEntries.push(currentProj);
  }

  // Associate project links
  if (docLinks.projectLinks.length > 0 && projectEntries.length > 0) {
    const unassignedProjectLinks = [...docLinks.projectLinks];
    for (const proj of projectEntries) {
      proj.links = proj.links || [];
      const projKeywords = `${proj.name} ${proj.subtitle || ''}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 4);

      const matchedIdx = unassignedProjectLinks.findIndex(l => {
        const linkStr = `${l.url} ${l.label}`.toLowerCase();
        return projKeywords.some(kw => linkStr.includes(kw));
      });

      if (matchedIdx !== -1) {
        proj.links.push(unassignedProjectLinks.splice(matchedIdx, 1)[0]);
      }
    }

    // Sequentially assign remaining project links if project had none
    for (let i = 0; i < projectEntries.length && unassignedProjectLinks.length > 0; i++) {
      if (projectEntries[i].links!.length === 0) {
        projectEntries[i].links!.push(unassignedProjectLinks.shift()!);
      }
    }
  }

  // 7. Education Entries
  const educationEntries: StructuredEducationEntry[] = [];
  const rawEduStrings: string[] = [];

  // First check if rawText Education section has 3-line stacked entries [Institution, Degree, Date]
  const eduSecs = sections.filter(s => s.name === 'Education');
  const stackedEduFromRaw: string[] = [];
  for (const sec of eduSecs) {
    for (let idx = 0; idx < sec.lines.length; idx++) {
      const l0 = sec.lines[idx].replace(/^[-•*▪▸◦]\s*/, '').trim();
      const l1 = (sec.lines[idx + 1] || '').replace(/^[-•*▪▸◦]\s*/, '').trim();
      const l2 = (sec.lines[idx + 2] || '').replace(/^[-•*▪▸◦]\s*/, '').trim();
      if (l0 && l1 && l2 && standaloneDateLineRx.test(l2) && l0.length <= 85 && l1.length <= 85) {
        stackedEduFromRaw.push(`${l1} — ${l0} — ${l2}`);
        idx += 2;
      }
    }
  }

  if (stackedEduFromRaw.length > 0) {
    rawEduStrings.push(...stackedEduFromRaw);
  } else if (Array.isArray(parsedData.education) && parsedData.education.length > 0) {
    for (const edu of parsedData.education) {
      if (typeof edu === 'string') {
        rawEduStrings.push(edu.trim());
      } else if (edu && typeof edu === 'object') {
        const combined = [edu.degree, edu.institution, edu.duration || edu.year].filter(Boolean).join(' — ');
        if (combined) rawEduStrings.push(combined);
      }
    }
  } else {
    for (const sec of eduSecs) {
      for (const l of sec.lines) {
        const cl = l.replace(/^[-•*▪▸◦]\s*/, '').trim();
        if (cl) rawEduStrings.push(cl);
      }
    }
  }

  const seenEdu = new Set<string>();
  for (const eduStr of rawEduStrings) {
    const key = eduStr.toLowerCase();
    if (!eduStr || seenEdu.has(key)) continue;
    seenEdu.add(key);

    // Match MM/YYYY – MM/YYYY, MM/YYYY, or YYYY - YYYY
    const dateRegex =
      /\b((?:\d{1,2}\/)?(?:19|20)\d\d(?:\s*[—–\-to]+\s*(?:(?:\d{1,2}\/)?(?:19|20)\d\d|present|current|expected))?)\b/i;
    const yearMatch = eduStr.match(dateRegex);
    const duration = yearMatch?.[1]?.trim();

    let withoutDuration = eduStr;
    if (duration) {
      const escapedDur = duration.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      withoutDuration = withoutDuration
        .replace(new RegExp(`\\s*\\(?\\s*${escapedDur}\\s*\\)?`, 'gi'), '')
        .replace(/\(\s*\)/g, '')
        .replace(/[\s—–|-]+$/, '')
        .trim();
    }

    const parts = withoutDuration.split(/\s+(?:[—–|]|-)\s+/).filter(Boolean);
    let degreePart = (parts[0] || withoutDuration).trim();
    let institutionPart = parts.length > 1 ? parts.slice(1).join(' — ').trim() : '';

    // If first part is the institution (e.g., "Global Academy of Technology...") and second part is degree ("Computer Science..."), swap so degree is bolded first
    if (
      institutionPart &&
      /\b(academy|institute|university|college|polytechnic|school)\b/i.test(degreePart) &&
      !/\b(b\.?tech|m\.?tech|b\.?e|b\.?sc|m\.?sc|bachelor|master|diploma|ph\.?d|computer science|engineering)\b/i.test(degreePart)
    ) {
      const tmp = degreePart;
      degreePart = institutionPart;
      institutionPart = tmp;
    }

    educationEntries.push({
      degree: degreePart.replace(/\s*▪\s*/g, ', ') || eduStr,
      institution: institutionPart ? institutionPart.replace(/\s*▪\s*/g, ', ') : undefined,
      duration,
    });
  }

  // 8. Certifications
  const certificationEntries: string[] = [];
  const seenCerts = new Set<string>();
  const rawCerts: string[] = [];
  if (Array.isArray(parsedData.certifications) && parsedData.certifications.length > 0) {
    for (const c of parsedData.certifications) {
      rawCerts.push(typeof c === 'string' ? c : JSON.stringify(c));
    }
  } else {
    const certSecs = sections.filter(s => s.name === 'Certifications');
    for (const sec of certSecs) {
      for (const l of sec.lines) rawCerts.push(l);
    }
  }
  for (const cert of rawCerts) {
    const cleaned = cert.replace(/^[-•*▪▸◦]\s*/, '').trim();
    if (!cleaned || seenCerts.has(cleaned.toLowerCase())) continue;
    seenCerts.add(cleaned.toLowerCase());
    certificationEntries.push(cleaned);
  }

  // 9. Achievements (deduplicated against experience & project bullets)
  const existingBulletsLower = new Set<string>();
  for (const exp of experienceEntries) {
    for (const b of exp.bullets) existingBulletsLower.add(b.toLowerCase().trim());
  }
  for (const proj of projectEntries) {
    for (const b of proj.bullets) existingBulletsLower.add(b.toLowerCase().trim());
  }

  const achievementEntries: string[] = [];
  const rawAch: string[] = [];
  if (Array.isArray(parsedData.achievements)) {
    for (const a of parsedData.achievements) {
      rawAch.push(typeof a === 'string' ? a : JSON.stringify(a));
    }
  }
  const achSecs = sections.filter(s => s.name === 'Achievements');
  for (const sec of achSecs) {
    for (const l of sec.lines) rawAch.push(l);
  }
  for (const ach of rawAch) {
    const cleaned = ach.replace(/^[-•*▪▸◦]\s*/, '').trim();
    if (!cleaned || FORBIDDEN_SYNTHETIC_PATTERNS.some(p => p.test(cleaned))) continue;
    if (existingBulletsLower.has(cleaned.toLowerCase())) continue;
    existingBulletsLower.add(cleaned.toLowerCase());
    achievementEntries.push(cleaned);
  }

  // 10. Supported Tokens & Metrics Ground-Truth Set (strictly from genuine source evidence, NOT rewrites)
  const allCandidateEvidenceText = [
    cleanedRawText,
    verifiedSkills.join(' '),
    experienceEntries.map(e => `${e.title} ${e.company} ${e.duration} ${e.bullets.join(' ')}`).join(' '),
    projectEntries.map(p => `${p.name} ${p.subtitle || ''} ${p.bullets.join(' ')}`).join(' '),
    educationEntries.map(ed => `${ed.degree} ${ed.institution || ''}`).join(' '),
    certificationEntries.join(' '),
    achievementEntries.join(' '),
    rawSummaryLines.join(' '),
  ]
    .join('\n')
    .toLowerCase();

  const supportedLowerTokens = new Set<string>();
  for (const tok of allCandidateEvidenceText.split(/[^a-z0-9+#./-]+/)) {
    const cleanTok = tok.replace(/^[./-]+|[./-]+$/g, '');
    if (cleanTok) supportedLowerTokens.add(cleanTok);
  }
  for (const sk of verifiedSkills) {
    supportedLowerTokens.add(sk.toLowerCase());
  }

  // 11. Compare JD keywords against candidate evidence to separate matched vs unsupported JD terms
  const matchedJdKeywords: string[] = [];
  const unsupportedJdKeywords: string[] = [];
  const jdCombined = `${jdRawText}\n${jdRequirementsJson}`.toLowerCase();

  if (jdCombined.trim().length > 0) {
    // Check all canonical skills mentioned in JD
    const checkedKeys = new Set<string>();
    for (const [key, canonical] of Object.entries(CANONICAL_SKILL_MAP)) {
      if (key.length < 2) continue;
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
      if (rx.test(jdCombined)) {
        const canonicalLower = canonical.toLowerCase();
        if (checkedKeys.has(canonicalLower)) continue;
        checkedKeys.add(canonicalLower);

        const isSupported =
          rx.test(allCandidateEvidenceText) ||
          supportedLowerTokens.has(key) ||
          verifiedSkills.some(vs => vs.toLowerCase() === canonicalLower || vs.toLowerCase() === key);

        if (isSupported) {
          matchedJdKeywords.push(canonical);
        } else {
          unsupportedJdKeywords.push(canonical);
        }
      }
    }
    // Also check multi-word or hyphenated JD terms like "multi-cluster", "service mesh", "istio", "linkerd"
    const extraJdTerms = ['multi-cluster', 'service mesh', 'istio', 'linkerd'];
    for (const term of extraJdTerms) {
      if (jdCombined.includes(term) && !allCandidateEvidenceText.includes(term)) {
        unsupportedJdKeywords.push(term);
      }
    }
  }

  // Supported numeric/metric tokens (e.g., "40%", "99.9%", "$50k", "10x")
  const nonSyntheticRewrites: string[] = Array.isArray(parsedData.optimized_rewrites)
    ? parsedData.optimized_rewrites
        .map((rw: any) => String(rw?.suggested_text || '').trim())
        .filter((txt: string) => {
          if (!txt || FORBIDDEN_SYNTHETIC_PATTERNS.some(pat => pat.test(txt))) return false;
          const lower = txt.toLowerCase();
          return !unsupportedJdKeywords.some(ukw => lower.includes(ukw.toLowerCase()));
        })
    : [];

  const supportedMetrics = new Set<string>();
  const metricMatches =
    `${allCandidateEvidenceText}\n${nonSyntheticRewrites.join('\n')}`.match(
      /\d+(?:\.\d+)?%|\$\d+(?:[.,]\d+)?[kmb]?|\b\d+x\b/gi
    ) || [];
  for (const m of metricMatches) {
    supportedMetrics.add(m.toLowerCase());
  }

  const hasUsableEvidence =
    cleanedRawText.length >= 20 ||
    verifiedSkills.length > 0 ||
    experienceEntries.length > 0 ||
    educationEntries.length > 0 ||
    certificationEntries.length > 0 ||
    achievementEntries.length > 0;

  return {
    cleanedRawText,
    candidateName,
    candidateHeadline,
    candidateLocation,
    candidatePhone,
    candidateEmail,
    headerLinks: docLinks.headerLinks,
    contactItems: Array.from(contactSet),
    rawSummaryLines,
    verifiedSkills,
    supportedLowerTokens,
    supportedMetrics,
    unsupportedJdKeywords,
    matchedJdKeywords,
    experienceEntries,
    projectEntries,
    educationEntries,
    certificationEntries,
    achievementEntries,
    hasUsableEvidence,
  };
}

export function buildDeterministicStructuredResume(
  inventory: SourceFactInventory,
  mode: 'global' | 'tailored',
  options: {
    sourceResumeId: string;
    sourceVersion?: number;
    targetJdId?: string;
    optimizedRewrites?: Array<{ source_evidence?: string; suggested_text?: string }>;
  }
): StructuredResumeDocument {
  const priorityKeywords = mode === 'tailored' ? inventory.matchedJdKeywords : [];
  const skillCategories = categorizeAndDeduplicateSkills(inventory.verifiedSkills, priorityKeywords);

  // Build map of valid, evidence-grounded candidate rewrites (filtering out any keyword-stuffed or unsupported claims)
  const validRewriteMap = new Map<string, string>();
  const standaloneValidRewrites: string[] = [];
  if (mode === 'tailored' && Array.isArray(options.optimizedRewrites)) {
    for (const rw of options.optimizedRewrites) {
      const src = String(rw?.source_evidence || '').trim();
      const suggested = String(rw?.suggested_text || '').trim();
      if (!suggested) continue;
      if (FORBIDDEN_SYNTHETIC_PATTERNS.some(pat => pat.test(suggested))) continue;
      // Reject rewrite if it introduces unsupported JD keywords
      const suggLower = suggested.toLowerCase();
      const introducesUnsupportedSkill = inventory.unsupportedJdKeywords.some(ukw => {
        const escaped = ukw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(suggLower);
      });
      if (introducesUnsupportedSkill) continue;
      const polished = polishProfessionalText(suggested, true);
      if (src && src !== 'General Profile' && src !== 'Tailored Enhancement') {
        validRewriteMap.set(src.toLowerCase(), polished);
      } else if (polished) {
        standaloneValidRewrites.push(polished);
      }
    }
  }

  // 1. Build polished Professional Summary grounded strictly in candidate facts
  let summary = '';
  if (inventory.rawSummaryLines.length > 0) {
    const baseSummary = inventory.rawSummaryLines
      .map(l => polishProfessionalText(l, false))
      .filter(Boolean)
      .join(' ');
    summary = baseSummary;
  }

  const topSkills =
    mode === 'tailored' && inventory.matchedJdKeywords.length > 0
      ? [
          ...inventory.matchedJdKeywords,
          ...inventory.verifiedSkills.filter(
            s => !inventory.matchedJdKeywords.some(m => m.toLowerCase() === s.toLowerCase())
          ),
        ].slice(0, 6)
      : inventory.verifiedSkills.slice(0, 6);

  if (!summary || summary.length < 40) {
    const roleLabel = inventory.candidateHeadline || 'Technology & Engineering Professional';
    const expSummaryPart =
      inventory.experienceEntries.length > 0
        ? `with hands-on experience as ${inventory.experienceEntries[0].title}${
            inventory.experienceEntries[0].company && inventory.experienceEntries[0].company !== 'Organization'
              ? ` at ${inventory.experienceEntries[0].company}`
              : ''
          }`
        : inventory.educationEntries.length > 0
          ? `with academic training in ${inventory.educationEntries[0].degree}`
          : 'with a strong foundation in software engineering and problem solving';

    const skillsPart =
      topSkills.length > 0
        ? ` Demonstrated proficiency in ${topSkills.slice(0, 5).join(', ')}.`
        : '';

    summary = `${roleLabel} ${expSummaryPart}.${skillsPart}`.replace(/\.\./g, '.').trim();
  } else {
    // If existing summary is a brief single line (< 130 chars), enrich it with verified role/skills
    const summaryLower = summary.toLowerCase();
    if (summary.length < 130) {
      const expLead =
        inventory.experienceEntries.length > 0 &&
        !summaryLower.includes(inventory.experienceEntries[0].title.toLowerCase())
          ? ` Proven background as ${inventory.experienceEntries[0].title}${
              inventory.experienceEntries[0].company && inventory.experienceEntries[0].company !== 'Organization'
                ? ` at ${inventory.experienceEntries[0].company}`
                : ''
            }`
          : '';
      const unmentionedTop = topSkills.filter(sk => !summaryLower.includes(sk.toLowerCase())).slice(0, 5);
      const skillTail =
        unmentionedTop.length > 0
          ? `${expLead ? `${expLead}, with` : ' Demonstrated'} proficiency in ${unmentionedTop.join(', ')}.`
          : expLead
            ? `${expLead}.`
            : '';
      if (skillTail) {
        summary = `${summary.replace(/\.*$/, '.')}${skillTail}`;
      }
    } else if (mode === 'tailored' && inventory.matchedJdKeywords.length > 0) {
      const unmentionedMatched = inventory.matchedJdKeywords
        .filter(kw => !summaryLower.includes(kw.toLowerCase()))
        .slice(0, 4);
      if (unmentionedMatched.length > 0) {
        summary = `${summary.replace(/\.*$/, '.')} Core relevant competencies include ${unmentionedMatched.join(', ')}.`;
      }
    }
  }

  // 2. Polish Experience Entries & Bullets
  const isRelevanceMatch = (bullet: string): number => {
    if (mode !== 'tailored' || inventory.matchedJdKeywords.length === 0) return 0;
    const bl = bullet.toLowerCase();
    return inventory.matchedJdKeywords.filter(kw => bl.includes(kw.toLowerCase())).length;
  };

  const matchedRewriteSources = new Set<string>();
  const experience: StructuredExperienceEntry[] = inventory.experienceEntries.map((exp, idx) => {
    const rawBullets = exp.bullets.length > 0 ? exp.bullets : [];
    const polishedBullets = rawBullets
      .map(b => {
        const key = b.toLowerCase();
        const rewritten = validRewriteMap.get(key);
        if (rewritten) matchedRewriteSources.add(key);
        return rewritten || polishProfessionalText(b, true);
      })
      .filter(Boolean);

    // If tailored mode has standalone or unmatched candidate-accepted rewrites, integrate them into the primary role's bullets
    if (mode === 'tailored' && idx === 0) {
      for (const [srcKey, rwText] of validRewriteMap.entries()) {
        if (!matchedRewriteSources.has(srcKey)) {
          polishedBullets.push(rwText);
        }
      }
      for (const stRw of standaloneValidRewrites) {
        polishedBullets.push(stRw);
      }
    }

    // Deduplicate bullets within role
    const seenB = new Set<string>();
    const uniqueBullets: string[] = [];
    for (const b of polishedBullets) {
      const k = b.toLowerCase();
      if (!seenB.has(k)) {
        seenB.add(k);
        uniqueBullets.push(b);
      }
    }

    if (mode === 'tailored' && uniqueBullets.length > 1) {
      uniqueBullets.sort((a, b) => isRelevanceMatch(b) - isRelevanceMatch(a));
    }

    return {
      company: exp.company,
      title: exp.title,
      duration: exp.duration,
      location: exp.location,
      bullets: uniqueBullets,
    };
  });

  // 3. Polish Projects: format ATS-friendly briefing bullets, preserve all original projects and links
  const projects: StructuredProjectEntry[] = inventory.projectEntries.map(proj => {
    const briefingBullets = formatProjectBriefingBullets(proj);
    return {
      name: proj.name,
      subtitle: proj.subtitle,
      duration: proj.duration,
      links: proj.links,
      bullets: briefingBullets,
    };
  });

  // In tailored mode, reorder projects by JD keyword relevance without dropping any project
  if (mode === 'tailored' && projects.length > 1) {
    const getProjectRelevance = (p: StructuredProjectEntry): number => {
      if (inventory.matchedJdKeywords.length === 0) return 0;
      const pText = `${p.name} ${p.subtitle || ''} ${p.bullets.join(' ')}`.toLowerCase();
      return inventory.matchedJdKeywords.filter(kw => pText.includes(kw.toLowerCase())).length;
    };
    projects.sort((a, b) => getProjectRelevance(b) - getProjectRelevance(a));
  }

  // 4. Education, Certifications, Achievements
  const education = inventory.educationEntries.map(ed => ({
    degree: polishProfessionalText(ed.degree, false).replace(/\.$/, ''),
    institution: ed.institution ? polishProfessionalText(ed.institution, false).replace(/\.$/, '') : undefined,
    duration: ed.duration,
    details: ed.details,
  }));

  const certifications = inventory.certificationEntries
    .map(c => polishProfessionalText(c, false).replace(/\.$/, ''))
    .filter(Boolean);

  const achievements = inventory.achievementEntries
    .map(a => {
      const rewritten = validRewriteMap.get(a.toLowerCase());
      return rewritten || polishProfessionalText(a, true);
    })
    .filter(Boolean);

  if (mode === 'tailored' && achievements.length > 1) {
    achievements.sort((a, b) => isRelevanceMatch(b) - isRelevanceMatch(a));
  }

  return {
    header: {
      fullName: inventory.candidateName,
      headline: inventory.candidateHeadline,
      location: inventory.candidateLocation,
      phone: inventory.candidatePhone,
      email: inventory.candidateEmail,
      links: inventory.headerLinks,
      contactItems: inventory.contactItems,
    },
    summary,
    skillCategories,
    experience,
    projects,
    education,
    certifications,
    achievements,
    metadata: {
      mode,
      sourceResumeId: options.sourceResumeId,
      sourceVersion: options.sourceVersion,
      targetJdId: options.targetJdId,
      generationMethod: 'deterministic_evidence_polished',
      validationPassed: true,
      retriesUsed: 0,
      warnings: [],
    },
  };
}

export function validateStructuredResume(
  doc: StructuredResumeDocument,
  inventory: SourceFactInventory
): ResumeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!inventory.hasUsableEvidence) {
    errors.push('Source resume contains no extractable text or verified candidate evidence.');
  }

  if (!doc.header?.fullName || doc.header.fullName.trim().length === 0) {
    errors.push('Missing candidate name in resume header.');
  }

  if (!doc.summary || doc.summary.trim().length < 15) {
    errors.push('Professional summary is missing or too short.');
  }

  // Collect all text segments in the generated document to inspect for forbidden patterns and hallucinations
  const allTextSegments: string[] = [
    doc.header.fullName,
    doc.header.headline,
    ...doc.header.contactItems,
    doc.summary,
    ...doc.skillCategories.flatMap(c => [c.category, ...c.skills]),
    ...doc.experience.flatMap(e => [e.company, e.title, e.duration, ...e.bullets]),
    ...doc.projects.flatMap(p => [p.name, p.subtitle || '', ...p.bullets]),
    ...doc.education.flatMap(ed => [ed.degree, ed.institution || '', ed.duration || '']),
    ...doc.certifications,
    ...doc.achievements,
  ].filter(Boolean);

  const combinedGeneratedText = allTextSegments.join('\n');

  // 1. Check for forbidden synthetic patterns, keyword stuffing, placeholders, or leaked prompts
  for (const pat of FORBIDDEN_SYNTHETIC_PATTERNS) {
    if (pat.test(combinedGeneratedText)) {
      errors.push(`Generated resume contains forbidden synthetic or placeholder pattern: ${pat.source}`);
    }
  }

  // 2. Check for duplicated skills across categories
  const seenSkills = new Set<string>();
  for (const group of doc.skillCategories) {
    if (!group.category || group.skills.length === 0) {
      errors.push('Empty skill category detected.');
    }
    for (const sk of group.skills) {
      const norm = sk.toLowerCase().replace(/[^a-z0-9+#]/g, '');
      if (seenSkills.has(norm)) {
        errors.push(`Duplicate skill detected in generated resume: "${sk}"`);
      }
      seenSkills.add(norm);
    }
  }

  // 3. Check that no unsupported JD skill/keyword was injected as a candidate claim
  if (inventory.unsupportedJdKeywords.length > 0) {
    const proseAndSkillsLower = [
      doc.summary,
      ...doc.skillCategories.flatMap(c => c.skills),
      ...doc.experience.flatMap(e => e.bullets),
      ...doc.projects.flatMap(p => p.bullets),
      ...doc.achievements,
    ]
      .join('\n')
      .toLowerCase();

    for (const unsupportedKw of inventory.unsupportedJdKeywords) {
      const kwLower = unsupportedKw.toLowerCase();
      const escaped = kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
      if (rx.test(proseAndSkillsLower)) {
        errors.push(`Unsupported JD requirement/skill "${unsupportedKw}" was found in generated candidate claims.`);
      }
    }
  }

  // 4. Check that no fabricated metrics/percentages were invented
  const generatedMetricMatches =
    [doc.summary, ...doc.experience.flatMap(e => e.bullets), ...doc.projects.flatMap(p => p.bullets), ...doc.achievements]
      .join('\n')
      .match(/\d+(?:\.\d+)?%|\$\d+(?:[.,]\d+)?[kmb]?|\b\d+x\b/gi) || [];

  for (const metric of generatedMetricMatches) {
    if (!inventory.supportedMetrics.has(metric.toLowerCase())) {
      errors.push(`Generated resume contains unverified numeric metric "${metric}" not present in source evidence.`);
    }
  }

  // 5. Verify factual preservation of source experience employers/titles and education
  for (const srcExp of inventory.experienceEntries) {
    if (srcExp.company && srcExp.company !== 'Organization') {
      const found = doc.experience.some(
        e => e.company.toLowerCase().includes(srcExp.company.toLowerCase()) || srcExp.company.toLowerCase().includes(e.company.toLowerCase())
      );
      if (!found) {
        errors.push(`Source employer "${srcExp.company}" was omitted or altered in generated resume.`);
      }
    }
  }

  for (const srcEdu of inventory.educationEntries) {
    if (srcEdu.degree) {
      const found = doc.education.some(
        ed => ed.degree.toLowerCase().includes(srcEdu.degree.substring(0, 15).toLowerCase())
      );
      if (!found) {
        errors.push(`Source education "${srcEdu.degree}" was omitted in generated resume.`);
      }
    }
  }

  // 6. Candidate Name Character-for-Character Preservation
  if (!doc.header?.fullName || doc.header.fullName.trim().length === 0) {
    errors.push('Missing candidate name in resume header.');
  } else if (inventory.candidateName && doc.header.fullName.trim() !== inventory.candidateName.trim()) {
    errors.push(`Candidate name altered: expected "${inventory.candidateName}", got "${doc.header.fullName}".`);
  }

  // 7. Complete Project Preservation: All original projects must be preserved
  if (inventory.projectEntries.length > 0) {
    for (const srcProj of inventory.projectEntries) {
      const found = doc.projects.some(
        p => p.name.toLowerCase() === srcProj.name.toLowerCase() ||
             p.name.toLowerCase().includes(srcProj.name.toLowerCase()) ||
             srcProj.name.toLowerCase().includes(p.name.toLowerCase())
      );
      if (!found) {
        errors.push(`Original project "${srcProj.name}" was omitted in generated resume.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export async function generateValidatedStructuredResume(params: {
  rawText: string;
  fileBuffer?: Uint8Array | ArrayBuffer | null;
  fileFormat?: string;
  parsedData: any;
  claims?: any[];
  userAccount?: any;
  profile?: any;
  mode: 'global' | 'tailored';
  sourceResumeId: string;
  sourceVersion?: number;
  targetJdId?: string;
  jdRawText?: string;
  jdRequirementsJson?: string;
  env?: any;
  extractJsonFn?: (raw: string) => any;
  redactPiiFn?: (text: string) => { redacted: string; piiFound: string[] };
}): Promise<{
  document: StructuredResumeDocument | null;
  inventory: SourceFactInventory;
  validation: ResumeValidationResult;
}> {
  const inventory = extractSourceFactInventory({
    rawText: params.rawText,
    fileBuffer: params.fileBuffer,
    fileFormat: params.fileFormat,
    parsedData: params.parsedData,
    claims: params.claims,
    userAccount: params.userAccount,
    profile: params.profile,
    jdRawText: params.jdRawText,
    jdRequirementsJson: params.jdRequirementsJson,
  });

  if (!inventory.hasUsableEvidence) {
    return {
      document: null,
      inventory,
      validation: {
        valid: false,
        errors: ['Cannot generate resume: source document has no extractable text layer or verified candidate evidence.'],
        warnings: [],
      },
    };
  }

  const deterministicDoc = buildDeterministicStructuredResume(inventory, params.mode, {
    sourceResumeId: params.sourceResumeId,
    sourceVersion: params.sourceVersion,
    targetJdId: params.targetJdId,
    optimizedRewrites: params.parsedData?.optimized_rewrites,
  });

  // Optional bounded AI enhancement pass (max 2 attempts) for summary & bullet prose polishing,
  // strictly validated against source facts before acceptance.
  let retriesUsed = 0;
  const maxAttempts = 2;

  if (params.env?.NVIDIA_API_KEY && params.extractJsonFn) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      retriesUsed = attempt;
      try {
        const systemPrompt = `You are an evidence-grounded executive resume editor.
Your ONLY task is to polish the grammar, clarity, and professional tone of the candidate's existing summary and experience/project bullets.
STRICT RULES:
1. NEVER invent employers, job titles, dates, degrees, certifications, skills, or metrics/numbers.
2. NEVER include unsupported job description keywords (${inventory.unsupportedJdKeywords.slice(0, 15).join(', ') || 'none'}).
3. NEVER output "incorporating verifiable experience with" or "Target Role Alignment".
4. Return ONLY valid JSON:
{
  "summary": "2-3 sentence polished professional summary grounded strictly in source facts",
  "experience_bullets": [ ["polished bullet 1 for role 1", "polished bullet 2 for role 1"] ]
}`;
        const userPayload = JSON.stringify({
          mode: params.mode,
          headline: deterministicDoc.header.headline,
          current_summary: deterministicDoc.summary,
          verified_skills: inventory.verifiedSkills.slice(0, 25),
          matched_target_skills: inventory.matchedJdKeywords,
          experience: deterministicDoc.experience.map(e => ({
            title: e.title,
            company: e.company,
            duration: e.duration,
            bullets: e.bullets,
          })),
        });

        const aiRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${params.env.NVIDIA_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: params.env.NVIDIA_MODEL || 'meta/muse-glimmer-30b',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPayload },
            ],
            temperature: 0,
            max_tokens: 1500,
          }),
          signal: AbortSignal.timeout(4500),
        });

        if (!aiRes.ok) break;
        const aiData = (await aiRes.json()) as any;
        const content = aiData?.choices?.[0]?.message?.content || '';
        const parsed = params.extractJsonFn(content);

        if (parsed && typeof parsed.summary === 'string' && parsed.summary.trim().length >= 25) {
          const candidateDoc: StructuredResumeDocument = {
            ...deterministicDoc,
            summary: polishProfessionalText(parsed.summary, false),
            experience: deterministicDoc.experience.map((exp, idx) => {
              const aiBullets = Array.isArray(parsed.experience_bullets?.[idx])
                ? parsed.experience_bullets[idx]
                    .map((b: any) => polishProfessionalText(String(b || ''), true))
                    .filter(Boolean)
                : exp.bullets;
              return {
                ...exp,
                bullets: aiBullets.length > 0 ? aiBullets : exp.bullets,
              };
            }),
            metadata: {
              ...deterministicDoc.metadata,
              generationMethod: 'ai_enhanced_validated',
              retriesUsed: attempt,
            },
          };

          const check = validateStructuredResume(candidateDoc, inventory);
          if (check.valid) {
            return {
              document: candidateDoc,
              inventory,
              validation: check,
            };
          }
        }
      } catch (_) {
        break;
      }
    }
  }

  // Validate deterministic evidence-polished document
  deterministicDoc.metadata.retriesUsed = retriesUsed;
  const detValidation = validateStructuredResume(deterministicDoc, inventory);
  return {
    document: detValidation.valid ? deterministicDoc : null,
    inventory,
    validation: detValidation,
  };
}

function createSectionHeading(title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    keepNext: true,
    spacing: { before: 240, after: 90 },
    border: {
      bottom: {
        color: 'CBD5E1',
        space: 4,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        size: 21, // 10.5pt
        font: 'Calibri',
        color: '0F172A',
      }),
    ],
  });
}

export async function renderStructuredResumeToDocx(doc: StructuredResumeDocument): Promise<Uint8Array> {
  const children: Paragraph[] = [];

  // 1. Header: Candidate Name
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.LEFT,
      keepNext: true,
      spacing: { before: 0, after: 30 },
      children: [
        new TextRun({
          text: doc.header.fullName,
          bold: true,
          size: 34, // 17pt
          font: 'Calibri',
          color: '0F172A',
        }),
      ],
    })
  );

  // 2. Subheader: Location & Headline
  const subheaderParts: string[] = [];
  if (doc.header.location) subheaderParts.push(doc.header.location);
  if (doc.header.headline) subheaderParts.push(doc.header.headline);

  if (subheaderParts.length > 0) {
    children.push(
      new Paragraph({
        keepNext: true,
        spacing: { before: 0, after: 40 },
        children: [
          new TextRun({
            text: subheaderParts.join('   |   '),
            size: 20, // 10pt
            font: 'Calibri',
            color: '1E3A8A',
            bold: true,
          }),
        ],
      })
    );
  }

  // 3. Contact & Links Line with clickable ExternalHyperlink
  const contactChildren: (TextRun | ExternalHyperlink)[] = [];
  let hasPrevContact = false;

  if (doc.header.phone) {
    contactChildren.push(
      new ExternalHyperlink({
        link: `tel:${doc.header.phone.replace(/[^\d+]/g, '')}`,
        children: [
          new TextRun({
            text: doc.header.phone,
            size: 19,
            font: 'Calibri',
            color: '334155',
          }),
        ],
      })
    );
    hasPrevContact = true;
  }

  if (doc.header.email) {
    if (hasPrevContact) {
      contactChildren.push(
        new TextRun({ text: '   •   ', size: 19, font: 'Calibri', color: '94A3B8' })
      );
    }
    contactChildren.push(
      new ExternalHyperlink({
        link: `mailto:${doc.header.email}`,
        children: [
          new TextRun({
            text: doc.header.email,
            size: 19,
            font: 'Calibri',
            color: '2563EB',
            underline: { type: 'single' },
          }),
        ],
      })
    );
    hasPrevContact = true;
  }

  if (doc.header.links && doc.header.links.length > 0) {
    for (const l of doc.header.links) {
      if (hasPrevContact) {
        contactChildren.push(
          new TextRun({ text: '   •   ', size: 19, font: 'Calibri', color: '94A3B8' })
        );
      }
      contactChildren.push(
        new ExternalHyperlink({
          link: l.url,
          children: [
            new TextRun({
              text: l.label,
              style: 'Hyperlink',
              size: 19,
              font: 'Calibri',
              color: '2563EB',
              underline: { type: 'single' },
            }),
          ],
        })
      );
      hasPrevContact = true;
    }
  } else if (doc.header.contactItems && doc.header.contactItems.length > 0) {
    for (const item of doc.header.contactItems) {
      if (item === doc.header.email || item === doc.header.phone || item === doc.header.location) continue;
      if (hasPrevContact) {
        contactChildren.push(
          new TextRun({ text: '   •   ', size: 19, font: 'Calibri', color: '94A3B8' })
        );
      }
      const isUrl = /^https?:\/\//i.test(item) || /linkedin\.com|github\.com/i.test(item);
      if (isUrl) {
        const fullUrl = item.startsWith('http') ? item : `https://${item}`;
        contactChildren.push(
          new ExternalHyperlink({
            link: fullUrl,
            children: [
              new TextRun({
                text: item,
                style: 'Hyperlink',
                size: 19,
                font: 'Calibri',
                color: '2563EB',
                underline: { type: 'single' },
              }),
            ],
          })
        );
      } else {
        contactChildren.push(
          new TextRun({
            text: item,
            size: 19,
            font: 'Calibri',
            color: '475569',
          })
        );
      }
      hasPrevContact = true;
    }
  }

  if (contactChildren.length > 0) {
    children.push(
      new Paragraph({
        keepNext: true,
        spacing: { before: 0, after: 140 },
        children: contactChildren,
      })
    );
  }

  // 3. Professional Summary
  if (doc.summary) {
    children.push(createSectionHeading('Professional Summary'));
    children.push(
      new Paragraph({
        spacing: { before: 40, after: 140, line: 276 },
        children: [
          new TextRun({
            text: doc.summary,
            size: 21, // 10.5pt
            font: 'Calibri',
            color: '1E293B',
          }),
        ],
      })
    );
  }

  // 4. Categorized Technical & Core Skills
  if (doc.skillCategories.length > 0) {
    children.push(createSectionHeading('Technical & Core Skills'));
    for (const group of doc.skillCategories) {
      children.push(
        new Paragraph({
          spacing: { before: 35, after: 45, line: 260 },
          children: [
            new TextRun({
              text: `${group.category}: `,
              bold: true,
              size: 20, // 10pt
              font: 'Calibri',
              color: '0F172A',
            }),
            new TextRun({
              text: group.skills.join(', '),
              size: 20, // 10pt
              font: 'Calibri',
              color: '1E293B',
            }),
          ],
        })
      );
    }
  }

  // 5. Professional Experience
  if (doc.experience.length > 0) {
    children.push(createSectionHeading('Professional Experience'));
    for (const exp of doc.experience) {
      const roleHeaderParts: TextRun[] = [
        new TextRun({
          text: exp.title || 'Professional',
          bold: true,
          size: 22, // 11pt
          font: 'Calibri',
          color: '0F172A',
        }),
      ];
      if (exp.company && exp.company !== 'Organization') {
        roleHeaderParts.push(
          new TextRun({
            text: `  —  ${exp.company}`,
            bold: true,
            size: 21,
            font: 'Calibri',
            color: '1E3A8A',
          })
        );
      }
      if (exp.duration) {
        roleHeaderParts.push(
          new TextRun({
            text: `   (${exp.duration})`,
            italics: true,
            size: 19,
            font: 'Calibri',
            color: '475569',
          })
        );
      }

      children.push(
        new Paragraph({
          keepNext: exp.bullets.length > 0,
          spacing: { before: 110, after: 45 },
          children: roleHeaderParts,
        })
      );

      for (const bullet of exp.bullets) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { before: 25, after: 35, line: 260 },
            children: [
              new TextRun({
                text: bullet,
                size: 20, // 10pt
                font: 'Calibri',
                color: '1E293B',
              }),
            ],
          })
        );
      }
    }
  }

  // 6. Key Projects (preserving project names, clickable repository/demo links, and briefing structure)
  if (doc.projects.length > 0) {
    children.push(createSectionHeading('Key Projects'));
    for (const proj of doc.projects) {
      const projHeaderRuns: (TextRun | ExternalHyperlink)[] = [
        new TextRun({
          text: proj.name,
          bold: true,
          size: 21,
          font: 'Calibri',
          color: '0F172A',
        }),
      ];
      if (proj.subtitle) {
        projHeaderRuns.push(
          new TextRun({
            text: `  —  ${proj.subtitle}`,
            italics: true,
            size: 19,
            font: 'Calibri',
            color: '475569',
          })
        );
      }
      if (proj.duration) {
        projHeaderRuns.push(
          new TextRun({
            text: `   (${proj.duration})`,
            italics: true,
            size: 19,
            font: 'Calibri',
            color: '475569',
          })
        );
      }
      if (proj.links && proj.links.length > 0) {
        for (const l of proj.links) {
          projHeaderRuns.push(
            new TextRun({
              text: '   |   ',
              size: 19,
              font: 'Calibri',
              color: '94A3B8',
            }),
            new ExternalHyperlink({
              link: l.url,
              children: [
                new TextRun({
                  text: l.label || 'Project Link',
                  style: 'Hyperlink',
                  size: 19,
                  font: 'Calibri',
                  color: '2563EB',
                  underline: { type: 'single' },
                }),
              ],
            })
          );
        }
      }

      children.push(
        new Paragraph({
          keepNext: proj.bullets.length > 0,
          spacing: { before: 110, after: 45 },
          children: projHeaderRuns,
        })
      );

      for (const bullet of proj.bullets) {
        const labelMatch = bullet.match(/^(Purpose|Implementation|Outcome|Scope|Objective|Impact):\s*(.*)$/i);
        if (labelMatch) {
          const label = labelMatch[1];
          const content = labelMatch[2];
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 25, after: 35, line: 260 },
              children: [
                new TextRun({
                  text: `${label}: `,
                  bold: true,
                  size: 20,
                  font: 'Calibri',
                  color: '0F172A',
                }),
                new TextRun({
                  text: content,
                  size: 20,
                  font: 'Calibri',
                  color: '1E293B',
                }),
              ],
            })
          );
        } else {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 25, after: 35, line: 260 },
              children: [
                new TextRun({
                  text: bullet,
                  size: 20,
                  font: 'Calibri',
                  color: '1E293B',
                }),
              ],
            })
          );
        }
      }
    }
  }

  // 7. Education (only if present in source resume)
  if (doc.education.length > 0) {
    children.push(createSectionHeading('Education'));
    for (const edu of doc.education) {
      children.push(
        new Paragraph({
          spacing: { before: 50, after: 45 },
          children: [
            new TextRun({
              text: edu.degree,
              bold: true,
              size: 21,
              font: 'Calibri',
              color: '0F172A',
            }),
            ...(edu.institution
              ? [
                  new TextRun({
                    text: `  —  ${edu.institution}`,
                    size: 20,
                    font: 'Calibri',
                    color: '1E293B',
                  }),
                ]
              : []),
            ...(edu.duration
              ? [
                  new TextRun({
                    text: `   (${edu.duration})`,
                    italics: true,
                    size: 19,
                    font: 'Calibri',
                    color: '475569',
                  }),
                ]
              : []),
          ],
        })
      );
    }
  }

  // 8. Certifications (only if present in source resume)
  if (doc.certifications.length > 0) {
    children.push(createSectionHeading('Certifications & Credentials'));
    for (const cert of doc.certifications) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 25, after: 35 },
          children: [
            new TextRun({
              text: cert,
              size: 20,
              font: 'Calibri',
              color: '1E293B',
            }),
          ],
        })
      );
    }
  }

  // 9. Key Achievements & Impact (only if distinct from experience/project bullets)
  if (doc.achievements.length > 0) {
    children.push(createSectionHeading('Selected Achievements & Impact'));
    for (const ach of doc.achievements) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 25, after: 35, line: 260 },
          children: [
            new TextRun({
              text: ach,
              size: 20,
              font: 'Calibri',
              color: '1E293B',
            }),
          ],
        })
      );
    }
  }

  const wordDoc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch (720 twips)
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });

  const buf = await Packer.toBuffer(wordDoc);
  return new Uint8Array(buf);
}
