// Service to interact with the Groq Cloud API for academic guidance and mentoring.

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODELS_URL = 'https://api.groq.com/openai/v1/models';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const KNOWN_GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'llama-3.2-3b-preview',
  'llama-3.2-1b-preview',
  'qwen-2.5-32b',
  'gemma2-9b-it',
  'deepseek-r1-distill-llama-70b'
];

let cachedWorkingGroqModel: string | null = null;

export async function resolveActiveGroqModel(apiKey: string): Promise<string[]> {
  const customModel = typeof window !== 'undefined'
    ? (localStorage.getItem('ascendant_groq_model') || localStorage.getItem('gradence_groq_model'))
    : null;

  try {
    const res = await fetch(GROQ_MODELS_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const rawIds: string[] = (data.data || []).map((m: any) => m.id);
      
      const chatIds = rawIds.filter(id =>
        !id.includes('whisper') &&
        !id.includes('guard') &&
        !id.includes('embed') &&
        !id.includes('orpheus')
      );

      if (chatIds.length > 0) {
        const sorted = [...chatIds].sort((a, b) => {
          const aIdx = KNOWN_GROQ_MODELS.indexOf(a);
          const bIdx = KNOWN_GROQ_MODELS.indexOf(b);
          if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
          if (aIdx !== -1) return -1;
          if (bIdx !== -1) return 1;
          return 0;
        });

        if (customModel && sorted.includes(customModel)) {
          return [customModel, ...sorted.filter(m => m !== customModel)];
        }
        if (cachedWorkingGroqModel && sorted.includes(cachedWorkingGroqModel)) {
          return [cachedWorkingGroqModel, ...sorted.filter(m => m !== cachedWorkingGroqModel)];
        }
        return sorted;
      }
    } else if (res.status === 401) {
      throw new Error('Invalid Groq API Key. Please verify your key at console.groq.com/keys');
    }
  } catch (err: any) {
    if (err.message && err.message.includes('Invalid Groq API Key')) {
      throw err;
    }
    console.warn('Could not query dynamic Groq model list, falling back to known models:', err);
  }

  const fallbackList = customModel ? [customModel, ...KNOWN_GROQ_MODELS.filter(m => m !== customModel)] : KNOWN_GROQ_MODELS;
  if (cachedWorkingGroqModel && fallbackList.includes(cachedWorkingGroqModel)) {
    return [cachedWorkingGroqModel, ...fallbackList.filter(m => m !== cachedWorkingGroqModel)];
  }
  return fallbackList;
}

export async function testGroqConnection(apiKey: string): Promise<{
  success: boolean;
  message: string;
  models?: string[];
  activeModel?: string;
}> {
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GROQ_API_KEY') {
    return { success: false, message: 'Please enter a valid API key first.' };
  }
  const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '');

  if (cleanKey.startsWith('sk-or-')) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'Authorization': `Bearer ${cleanKey}` }
      });
      if (res.ok) {
        return { success: true, message: 'Connected successfully to OpenRouter!', activeModel: 'meta-llama/llama-3.3-70b-instruct' };
      }
    } catch {}
  }

  if (cleanKey.startsWith('sk-') && !cleanKey.startsWith('sk-or-')) {
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${cleanKey}` }
      });
      if (res.ok) {
        return { success: true, message: 'Connected successfully to OpenAI!', activeModel: 'gpt-4o-mini' };
      }
    } catch {}
  }

  try {
    const res = await fetch(GROQ_MODELS_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cleanKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.status === 401) {
      return { success: false, message: 'Invalid Groq API Key (HTTP 401). Please verify at console.groq.com/keys.' };
    }

    if (res.ok) {
      const data = await res.json();
      const rawIds: string[] = (data.data || []).map((m: any) => m.id);
      const chatIds = rawIds.filter(id =>
        !id.includes('whisper') &&
        !id.includes('guard') &&
        !id.includes('embed') &&
        !id.includes('orpheus')
      );

      const candidate = chatIds[0] || 'llama-3.3-70b-versatile';
      const pingRes = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanKey}`
        },
        body: JSON.stringify({
          model: candidate,
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 5
        })
      });

      if (pingRes.ok) {
        cachedWorkingGroqModel = candidate;
        return {
          success: true,
          message: `Connection Verified! Active model: ${candidate}`,
          models: chatIds,
          activeModel: candidate
        };
      } else {
        return {
          success: true,
          message: `Key valid! Found ${chatIds.length} models. Auto-routing enabled.`,
          models: chatIds,
          activeModel: candidate
        };
      }
    }

    return { success: false, message: `Could not verify key (HTTP ${res.status}).` };
  } catch (e: any) {
    return { success: false, message: `Network error connecting to Groq: ${e.message || String(e)}` };
  }
}

export async function askGroq(
  messages: ChatMessage[],
  apiKey: string | null
): Promise<string> {
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GROQ_API_KEY') {
    return simulateResponse(messages);
  }

  const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '');

  if (cleanKey.startsWith('sk-or-')) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanKey}`,
          'HTTP-Referer': 'https://ascendant.app',
          'X-Title': 'ASCENDANT Academic Companion'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct',
          messages: messages.filter(m => !m.content.startsWith('[System Connection Error]')),
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0]?.message?.content || 'No response generated from OpenRouter.';
      }
    } catch (e) {
      console.error('OpenRouter connection error:', e);
    }
  }

  if (cleanKey.startsWith('sk-') && !cleanKey.startsWith('sk-or-')) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages.filter(m => !m.content.startsWith('[System Connection Error]')),
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0]?.message?.content || 'No response generated from OpenAI.';
      }
    } catch (e) {
      console.error('OpenAI connection error:', e);
    }
  }

  if (cleanKey.startsWith('xai-')) {
    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: messages.filter(m => !m.content.startsWith('[System Connection Error]')),
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0]?.message?.content || 'No response generated from Grok.';
      }
    } catch (e) {
      console.error('xAI Grok connection error:', e);
    }
  }

  const sanitizedMessages = messages
    .filter(m => m.content && m.content.trim() !== '' && !m.content.startsWith('[System Connection Error]'))
    .map(m => ({
      role: m.role,
      content: m.content.trim()
    }));

  let modelsToTry: string[] = KNOWN_GROQ_MODELS;
  try {
    modelsToTry = await resolveActiveGroqModel(cleanKey);
  } catch (authErr: any) {
    return `[System Connection Error]: ${authErr.message || String(authErr)}. Falling back to simulation:\n\n${simulateResponse(messages)}`;
  }

  let lastErrorDetail = '';
  const attemptedModels: string[] = [];

  for (const model of modelsToTry) {
    attemptedModels.push(model);
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model,
          messages: sanitizedMessages,
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        if (content) {
          cachedWorkingGroqModel = model;
          return content;
        }
      }

      const errBody = await response.text();
      console.warn(`Groq API (${model}) [HTTP ${response.status}]:`, errBody);

      let parsedMsg = `Status ${response.status}`;
      try {
        const parsed = JSON.parse(errBody);
        if (parsed?.error?.message) {
          parsedMsg = `${parsed.error.message} (HTTP ${response.status})`;
        }
      } catch {}
      lastErrorDetail = `${model}: ${parsedMsg}`;

      if (response.status === 404 && cachedWorkingGroqModel === model) {
        cachedWorkingGroqModel = null;
      }

      if (response.status === 401) {
        break;
      }
    } catch (err: any) {
      console.warn(`Groq fetch failed for ${model}:`, err);
      lastErrorDetail = `${model}: ${err?.message || String(err)}`;
    }
  }

  return `[System Connection Error]: ${lastErrorDetail}. (Attempted models: ${attemptedModels.slice(0, 4).join(', ')}). Falling back to simulation:\n\n${simulateResponse(messages)}`;
}

export const calculateHeuristicScore = (text: string): number => {
  const cleanText = text.toLowerCase().trim();
  if (!cleanText) return 0;
  if (cleanText.length < 3) return 0;

  // Detect project intent
  const isProjectIdea = /build|create|develop|make|design|project|app|application|website|system|tool|platform|how to/i.test(cleanText);

  let score = 45; // Generous baseline score for any valid input

  // Technology keyword lists
  const frontend = ['react', 'vue', 'angular', 'next.js', 'svelte', 'html', 'css', 'tailwind', 'bootstrap', 'javascript', 'typescript'];
  const backend = ['node', 'express', 'django', 'spring boot', 'laravel', 'fastapi', 'flask', 'nest.js', 'go', 'golang', 'python', 'java', 'c++', 'c#', 'ruby', 'rust', 'php'];
  const database = ['sql', 'nosql', 'postgresql', 'mongodb', 'mysql', 'redis', 'sqlite', 'oracle', 'firebase', 'supabase', 'prisma', 'sequelize'];
  const devops = ['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'ci/cd', 'github actions', 'jenkins', 'terraform', 'vercel', 'netlify', 'heroku'];
  const concepts = ['rest api', 'graphql', 'grpc', 'websocket', 'microservices', 'system design', 'authentication', 'security', 'oauth', 'jwt', 'mvc'];

  let matchedCategories = 0;
  let frontendMatches = 0;
  let backendMatches = 0;
  let dbMatches = 0;
  let devopsMatches = 0;
  let conceptMatches = 0;

  frontend.forEach(kw => { if (cleanText.includes(kw)) frontendMatches++; });
  backend.forEach(kw => { if (cleanText.includes(kw)) backendMatches++; });
  database.forEach(kw => { if (cleanText.includes(kw)) dbMatches++; });
  devops.forEach(kw => { if (cleanText.includes(kw)) devopsMatches++; });
  concepts.forEach(kw => { if (cleanText.includes(kw)) conceptMatches++; });

  if (frontendMatches > 0) { score += Math.min(10, frontendMatches * 3); matchedCategories++; }
  if (backendMatches > 0) { score += Math.min(10, backendMatches * 3); matchedCategories++; }
  if (dbMatches > 0) { score += Math.min(10, dbMatches * 3); matchedCategories++; }
  if (devopsMatches > 0) { score += Math.min(12, devopsMatches * 4); matchedCategories++; }
  if (conceptMatches > 0) { score += Math.min(10, conceptMatches * 3); matchedCategories++; }

  if (isProjectIdea) {
    score += 15; // Project context bonus
    if (cleanText.length > 40) score += 10;
  } else {
    // Resume context: bonus for fullstack capabilities
    if (matchedCategories >= 3) score += 10;
  }

  // Length bonus
  score += Math.min(15, Math.floor(cleanText.length / 30));

  return Math.min(99, Math.max(20, score));
};

export const extractScore = (text: string): number => {
  const scoreRegexes = [
    /SCORE:\s*(\d+)/i,
    /Score:\s*(\d+)/i,
    /score\s+is\s+(\d+)/i,
    /(\d+)\s*\/\s*100/
  ];

  for (const regex of scoreRegexes) {
    const match = text.match(regex);
    if (match) {
      const val = parseInt(match[1], 10);
      if (!isNaN(val) && val >= 0 && val <= 100) {
        return val;
      }
    }
  }
  return 75; // Default fallback score if not found
};

function simulateResponse(messages: ChatMessage[]): string {
  const lastMessage = messages[messages.length - 1].content;
  const lastMessageLower = lastMessage.toLowerCase();

  if (lastMessageLower.includes('placementtab:')) {
    const tabMatch = lastMessage.match(/PlacementTab:\s*(\w+)/i);
    const tab = tabMatch ? tabMatch[1].toLowerCase() : 'skills';

    const inputMatch = lastMessage.match(/Input:\s*([\s\S]*?)(?:\nUniversity:|\.?\s*University:|$)/i);
    const inputText = inputMatch ? inputMatch[1] : '';
    const cleanInput = inputText.trim();
    const inputLower = cleanInput.toLowerCase();
    const score = calculateHeuristicScore(cleanInput);

    if (tab === 'project') {
      let topic = "Custom Project";
      if (inputLower.includes('decentralized') || inputLower.includes('defi') || inputLower.includes('blockchain') || inputLower.includes('crypto')) {
        topic = "Web3 / Decentralized Application";
      } else if (inputLower.includes('chat') || inputLower.includes('ai') || inputLower.includes('agent') || inputLower.includes('llm') || inputLower.includes('gpt')) {
        topic = "AI-Powered Intelligence Application";
      } else if (inputLower.includes('ecommerce') || inputLower.includes('shop') || inputLower.includes('store') || inputLower.includes('payment')) {
        topic = "E-Commerce / Transactional Platform";
      } else if (inputLower.includes('social') || inputLower.includes('network') || inputLower.includes('peer') || inputLower.includes('connect')) {
        topic = "Social Collaboration Workspace";
      } else if (inputLower.includes('task') || inputLower.includes('todo') || inputLower.includes('manage') || inputLower.includes('planner')) {
        topic = "Productivity / Task Management Tool";
      } else if (inputLower.includes('portfolio') || inputLower.includes('resume') || inputLower.includes('placement')) {
        topic = "Career / Portfolio Operating System";
      } else {
        const cleanWords = cleanInput.replace(/how to|develop|build|create|make|design|an|a|the|app|project|application|system/gi, '').trim();
        if (cleanWords.length > 3) {
          topic = cleanWords.split(' ').slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + " Application";
        }
      }

      const suggestedStack: string[] = [];
      if (inputLower.includes('python') || inputLower.includes('django') || inputLower.includes('fastapi') || inputLower.includes('ai')) {
        suggestedStack.push('**Backend:** FastAPI / Python with Uvicorn');
      } else if (inputLower.includes('java') || inputLower.includes('spring')) {
        suggestedStack.push('**Backend:** Java Spring Boot');
      } else {
        suggestedStack.push('**Backend:** Node.js (Express.js or NestJS) with TypeScript');
      }

      if (inputLower.includes('next') || inputLower.includes('next.js')) {
        suggestedStack.push('**Frontend:** Next.js (React 19) with Tailwind CSS');
      } else if (inputLower.includes('vue')) {
        suggestedStack.push('**Frontend:** Vue.js with Vite');
      } else {
        suggestedStack.push('**Frontend:** React 19 with Vite & Tailwind CSS');
      }

      if (inputLower.includes('mongodb') || inputLower.includes('nosql')) {
        suggestedStack.push('**Database:** MongoDB (NoSQL) or Supabase');
      } else {
        suggestedStack.push('**Database:** PostgreSQL (Relational) with Prisma ORM');
      }

      if (inputLower.includes('aws') || inputLower.includes('cloud')) {
        suggestedStack.push('**Deployment:** AWS (ECS/Fargate) with Docker');
      } else {
        suggestedStack.push('**Deployment:** Vercel (Frontend) + Render/Railway (Backend) with Docker');
      }

      return `### 🛠️ Project Development Guide: ${topic}

Here is the dynamic roadmap to build and implement your project:

**1. Recommended Tech Stack:**
* ${suggestedStack.join('\n* ')}

**2. Key Architecture Steps:**
* **Phase 1 (Database & API Setup):** Initialize database schemas with proper relations. Implement secure RESTful endpoints for user authentication and core business logic.
* **Phase 2 (Frontend Integration):** Build out the UI using modern, responsive components. Connect endpoints using custom hooks and state management (Zustand or Redux).
* **Phase 3 (Optimization & Containerization):** Add Redis/local-caching for frequent queries, write unit tests for critical handlers, and containerize the build using Docker.

**3. Placement Impact Analysis:**
* **Recruiter Appeal:** Demonstrates complete full-stack ownership and architectural capability.
* **Resume Tip:** Quantify performance optimizations (e.g., "Reduced response latency by 35% using database indexing and caching").

SCORE: ${score}`;

    } else if (tab === 'resume') {
      const missing: string[] = [];
      const suggestions: string[] = [];

      const hasMetrics = /\d+%/i.test(cleanInput) || /ms\b|seconds\b|queries\b|users\b/i.test(cleanInput) || /\d+\s*x\b/i.test(cleanInput);
      const hasDevops = /docker|kubernetes|aws|gcp|azure|ci\/cd|github actions/i.test(inputLower);
      const hasDB = /sql|postgres|mongo|mysql|redis|sqlite|database/i.test(inputLower);

      if (!hasMetrics) {
        missing.push('* **Quantifiable Impact Metrics:** Project accomplishments lack numerical metrics (e.g. latency reduced by X%, active users count, scale metrics).');
        suggestions.push('- Rewrite key impact bullet points to show quantified outcomes, e.g. "Optimized API load time by 30% through index optimization".');
      }
      if (!hasDevops) {
        missing.push('* **Deployment/DevOps details:** Resume points do not show how projects were deployed or containerized.');
        suggestions.push('- Mention Docker containerization or CI/CD pipelines (e.g. GitHub Actions) to prove production readiness.');
      }
      if (!hasDB) {
        missing.push('* **Database Optimization:** No mention of query tuning, migrations, or indexing.');
        suggestions.push('- Include specific details on schema design, transactional integrity, or caching.');
      }

      if (missing.length === 0) {
        missing.push('* **Formatting & Phrasing:** Technical phrasing is strong. Ensure standard action-oriented verbs start every bullet point.');
        suggestions.push('- Start each resume point with strong action verbs (e.g., "Spearheaded", "Engineered", "Optimized").');
        suggestions.push('- Keep bullets concise, focusing on **Situation -> Task -> Action -> Result** format.');
      }

      const formattedSuggestions = suggestions.map((s, idx) => `${idx + 1}. ${s.replace(/^-\s*/, '')}`).join('\n');

      return `### 📊 Resume Audit Feedback
**Placement Readiness Score: ${score}/100**

**Identified Structural Gaps:**
${missing.join('\n')}

**Actionable Revisions:**
${formattedSuggestions}

SCORE: ${score}`;

    } else {
      const matchingRoles: string[] = [];
      const missingComplementary: string[] = [];

      const hasReact = /react|next|vue|angular|svelte/i.test(inputLower);
      const hasNode = /node|express|nest|spring|django|fastapi|laravel/i.test(inputLower);
      const hasSQL = /sql|postgres|mongo|mysql|database/i.test(inputLower);
      const hasDevops = /docker|kubernetes|aws|gcp|azure|ci\/cd/i.test(inputLower);

      if (hasReact && hasNode) {
        matchingRoles.push('Full Stack Web Developer (Tier-1 Placement Aligned)');
      } else if (hasReact) {
        matchingRoles.push('Frontend Engineer (React Developer)');
        missingComplementary.push('* **Backend API Engineering:** Learn Node.js/Express or Python FastAPI to become full-stack capable.');
      } else if (hasNode) {
        matchingRoles.push('Backend Engineer / API Developer');
        missingComplementary.push('* **Modern UI Frameworks:** Add React 19 or Next.js to complete the full-stack loop.');
      } else {
        matchingRoles.push('General Software Developer Apprentice');
        missingComplementary.push('* **Core Technical Stack:** Choose a target domain (Web development or Mobile dev) and learn its primary stack (e.g. React & Node.js).');
      }

      if (!hasSQL) {
        missingComplementary.push('* **Data Persistence:** Learn relational database systems (PostgreSQL/MySQL) and ORMs (Prisma).');
      }
      if (!hasDevops) {
        missingComplementary.push('* **Cloud & DevOps:** Gain basic familiarity with Docker containerization and cloud hosting services.');
      }

      if (missingComplementary.length === 0) {
        missingComplementary.push('* **System Design Concepts:** Study design patterns, caching structures (Redis), and microservices to prepare for advanced interviews.');
      }

      return `### 🎯 Skills Alignment Feedback

**Aligned Career Paths:**
* **Primary Target:** ${matchingRoles[0] || 'Software Engineer'}
* **Sector Relevance:** Highly compatible with modern product-based SaaS companies and tech consulting firms.

**Complementary Skills to Learn:**
${missingComplementary.slice(0, 3).join('\n')}

SCORE: ${score}`;
    }
  }

  if (lastMessageLower.includes('resume') || lastMessageLower.includes('portfolio') || lastMessageLower.includes('readiness')) {
    return `### 📊 Placement Readiness Feedback
**Score: 78/100**

**What is Missing:**
* **Cloud Infrastructure:** No Docker containerization or cloud services (AWS/GCP) listed.
* **Impact Metrics:** Project descriptions lack quantifiable improvements.

**Action Plan:**
1. Containerize your applications using Docker.
2. Quantify achievements (e.g., "reduced query latency by 25%").`;
  }

  if (lastMessage.includes('roadmap') || lastMessage.includes('career') || lastMessage.includes('higher studies')) {
    return `### 🗺️ Custom Career Roadmap: Full-Stack Cloud Architect
Based on your academic profile, here is your path to becoming a Senior Engineer:

#### Phase 1: Language Mastery & Algorithms (Months 1-2)
* **Action:** Deep dive into JavaScript/TypeScript (closures, event loop, promises) and Python fundamentals.
* **Milestone:** Master basic Data Structures and Algorithms (time complexity, sorting, hash maps).
* **Suggested Certification:** Meta Front-End Developer Professional Certificate.

#### Phase 2: Database Systems & APIs (Months 3-4)
* **Action:** Master relational databases (SQL, Postgres, transactions) and schema design.
* **Milestone:** Build and document a RESTful API using Node.js, Express, and PostgreSQL.
* **Suggested Certification:** Oracle Certified Associate, Java SE 8 Programmer.

#### Phase 3: Advanced Frontend & State Management (Months 5-6)
* **Action:** Learn React, React Router, and state management (Redux Toolkit or Zustand).
* **Milestone:** Build a complex single-page dashboard with client-side routing and charts.
* **Suggested Certification:** AWS Certified Cloud Practitioner.

#### Phase 4: DevOps & Cloud Architecture (Months 7-8)
* **Action:** Learn Docker containerization, AWS core services (EC2, S3, RDS), and Nginx load balancing.
* **Milestone:** Containerize your application and deploy it to AWS ECS using a CI/CD pipeline.
* **Suggested Certification:** AWS Certified Solutions Architect - Associate.

#### Phase 5: System Design & Scaling (Months 9-10)
* **Action:** Learn microservices architecture, horizontal vs vertical scaling, and caching using Redis.
* **Milestone:** Design a high-throughput backend system blueprint incorporating rate-limiting and message queues (RabbitMQ/Kafka).`;
  }

  if (lastMessage.includes('summarize') || lastMessage.includes('notes') || lastMessage.includes('study')) {
    return `### 📝 Smart Study Guide & Summary
Here is your study outline based on the input text:

1. **Key Concepts:**
   * **Time Complexity:** Measures the execution time growth rate of an algorithm.
   * **Space Complexity:** Focuses on memory usage overhead during runtime.
2. **Crucial Formulas:**
   * Master Theorem: $T(n) = aT(n/b) + f(n)$
3. **Practice Questions:**
   * Explain how hash tables handle collisions using chaining vs open addressing.
   * Compare worst-case complexity of Quicksort vs Mergesort.`;
  }

  return `### ⚡ Ascendant AI Assistant
I am online and ready to assist you. To unlock real-time intelligence with lightning-fast llama3.3 inference, please add your **Groq API Key** in the **Settings** screen.

**How I can help you today:**
* **Analyze Resume:** Analyze placement compatibility and identify skill gaps.
* **Resume Rescue:** Build an action plan to rescue attendance in low-performing classes.
* **Smart Simulator:** Predict cumulative GPA under different academic constraints.
* **Domain Mentor:** Draft specialized roadmaps for SWE, Product Management, AI, or Higher Studies.`;
}

export async function parseAcademicCalendar(
  pdfText: string,
  currentSemester: number,
  apiKey: string
): Promise<import('../types').AcademicEvent[]> {
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GROQ_API_KEY') {
    throw new Error('A valid Groq API key is required to parse the Academic Calendar.');
  }

  const targetYear = Math.ceil(currentSemester / 2); // e.g. Sem 3 -> Year 2

  const prompt = `You are an AI assistant that extracts academic calendar events from PDF text.
Extract EVERY SINGLE event from the text line by line, regardless of the year. DO NOT summarize or skip any events.
Pay close attention to roman numerals (I, II, III, IV) or year indicators (e.g. "First Year", "Second Year"). 
If an event is explicitly for a specific year, set the "targetYear" to that integer (1, 2, 3, or 4). 
If an event applies to all students, or is general/unidentifiable (e.g. "Algosprint", general meetings, common holidays, etc.), set "targetYear" to null.
If an event is a holiday, leave, or vacation, set "isHoliday" to true, otherwise false.

The current year is typically the one mentioned in the text.

Return ONLY a valid JSON array of objects, with NO markdown formatting, NO backticks, and NO additional text. 
Format of each object:
{
  "id": "generate_a_unique_string",
  "title": "Event Name",
  "date": "YYYY-MM-DD",
  "targetYear": null, 
  "isHoliday": false
}

Here is the PDF text:
---
${pdfText.substring(0, 100000)}
---
`;

  const models = await resolveActiveGroqModel(apiKey.trim());
  let lastErr = '';

  for (const model of models) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 6000,
        }),
      });

      if (!response.ok) {
        lastErr = `Groq API error: ${response.status}`;
        continue;
      }

      const data = await response.json();
      let content = data.choices[0]?.message?.content || '[]';
    
    // Clean up potential markdown wrapper from LLM response
    content = content.replace(/```json/gi, '').replace(/```/gi, '').trim();
    
    // Attempt to extract the JSON array if there's conversational text
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }
    
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed as import('../types').AcademicEvent[];
    }
      return [];
    } catch (error: any) {
      console.error(`Failed to parse academic calendar with ${model}:`, error);
      lastErr = error.message || String(error);
    }
  }

  throw new Error(`Failed to extract events: ${lastErr || 'Unknown error'}`);
}
