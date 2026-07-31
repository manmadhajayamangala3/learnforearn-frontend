import { TOOLS, CATEGORIES } from '../pages/ailab/aiLabData'
import { STACKS } from '../pages/deployment/guideIndex'
import { APTITUDE_CATEGORIES, APTITUDE_CATEGORY_MAP } from '../pages/aptitude/aptitudeData'
import { TIPS } from '../pages/tips/tipsContent'
import { FAQS, PREP_HOWTO_STEPS } from '../pages/faqContent'

const BRAND = 'LearnForEarn'
const ORIGIN = 'https://learnforearn.in'
const brand = (label) => `${label} · ${BRAND}`

// Shared JSON-LD fragments (no @context — merged into the page @graph by
// setRouteJsonLd in App.jsx). Referencing the #organization node keeps a single
// canonical publisher identity across the site.
const ORG_REF = { '@id': `${ORIGIN}/#organization` }
const ORG_INLINE = { '@type': 'Organization', name: BRAND, url: `${ORIGIN}/` }

const faqPage = (qa) => ({
  '@type': 'FAQPage',
  mainEntity: qa.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
})

// Full Organization entity for the About page — shares the #organization @id
// with the site-wide node in index.html so AI/search build one confident entity.
const ORG_ENTITY = {
  '@type': ['Organization', 'EducationalOrganization'],
  '@id': `${ORIGIN}/#organization`,
  name: BRAND,
  alternateName: ['ARISE', 'Learn For Earn'],
  url: `${ORIGIN}/`,
  logo: `${ORIGIN}/icon-512.png`,
  description:
    'LearnForEarn is an online learning platform for tech students at every stage — beginners learning to code, developers improving skills, students preparing for placements, and professionals exploring AI tools. It covers coding practice, aptitude tests, real project building, AI tools, career roadmaps, and deployment guidance for students across India.',
  areaServed: { '@type': 'Country', name: 'India' },
  audience: {
    '@type': 'EducationalAudience',
    educationalRole: 'student',
    audienceType: 'Tech students at every stage — beginners, skill builders, placement seekers, career switchers, AI learners',
  },
  knowsAbout: [
    'Learning to code from scratch',
    'Data structures and algorithms',
    'Aptitude practice',
    'Building real projects for a portfolio',
    'AI tools for developers',
    'Tech career roadmaps',
    'Placement preparation',
    'Deploying projects live',
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Learning Paths',
    itemListElement: [
      { '@type': 'Course', name: 'Aptitude Practice', description: 'Quantitative, Logical, Verbal and Data Interpretation for every student' },
      { '@type': 'Course', name: 'Code GYM', description: 'Coding problems from beginner to advanced' },
      { '@type': 'Course', name: 'Mission Board', description: 'Real guided projects at every skill level' },
      { '@type': 'Course', name: 'AI Lab', description: 'AI tools for modern developers' },
      { '@type': 'Course', name: 'Career Roadmaps', description: 'Tech career paths for every role' },
      { '@type': 'Course', name: 'Deploy Guidance', description: 'How to deploy projects live' },
    ],
  },
  sameAs: [
    'https://twitter.com/learnforearn',
    'https://linkedin.com/company/learnforearn',
    'https://instagram.com/learnforearn',
  ],
}

// Step-by-step placement plan for the FAQ page (Fix 6 HowTo).
const PREP_HOWTO = {
  '@type': 'HowTo',
  name: 'How to use LearnForEarn to grow in tech',
  description: 'Step by step guide for any student to start learning and improving using LearnForEarn',
  step: PREP_HOWTO_STEPS.map((s) => ({ '@type': 'HowToStep', name: s.name, text: s.text })),
}

const FRESHER_FAQ = faqPage([
  { q: 'How long does placement preparation take?', a: 'With structured preparation covering aptitude, coding, and projects, most freshers need 3-6 months. Starting in 5th or 6th semester gives the best results.' },
  { q: 'Which companies can I get placed in with LearnForEarn preparation?', a: 'Our preparation covers TCS, Infosys, Wipro, Accenture, Cognizant, HCL, and product companies. The platform covers aptitude, DSA, and projects required for all major IT companies.' },
  { q: 'What is the difference between Code Gym and the Aptitude section?', a: 'Code Gym focuses on DSA and programming problems for technical rounds. Aptitude covers Quantitative, Logical, and Verbal sections tested in written rounds at service companies.' },
  { q: 'Do I need any prior coding knowledge to start?', a: 'No. LearnForEarn is designed for complete beginners. Start with E-rank missions and aptitude basics, then progress at your own pace through the structured learning path.' },
])

const APTITUDE_LR = {
  '@type': 'LearningResource',
  name: 'Aptitude Practice — Quantitative, Logical, Verbal',
  description: 'Aptitude practice for placement tests, competitive exams, and sharpening logical and mathematical thinking — every topic explained from scratch with shortcuts.',
  provider: ORG_INLINE,
  teaches: ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Data Interpretation'],
}

const CODEGYM_LR = {
  '@type': 'LearningResource',
  name: 'Code GYM — Coding Practice from Beginner to Advanced',
  description: 'Structured coding practice with full solutions — from arrays and strings to trees, graphs and dynamic programming, in Java, Python and C++ — for beginners, DSA skill-building and coding-interview preparation.',
  provider: ORG_INLINE,
  teaches: ['Data Structures', 'Algorithms', 'Problem Solving', 'Coding Interview Preparation'],
}

export const BASE_TITLE = `${BRAND} — Learn Coding, Build Projects, Crack Aptitude and Grow in Tech`
export const BASE_DESCRIPTION =
  'Whether you are learning to code for the first time, improving your skills, preparing for placements, or exploring AI tools — LearnForEarn has the structured path for you. Coding practice, aptitude tests, real projects, career roadmaps and more.'

export const BASE_KEYWORDS =
  'learn coding online, coding practice India, learn programming from scratch, coding for beginners, DSA practice, data structures and algorithms, aptitude practice, quantitative aptitude, logical reasoning, verbal ability, placement preparation, campus placement preparation, mock aptitude test, TCS NQT, Infosys, Wipro, Accenture, build projects, portfolio projects, AI tools for students, GitHub Copilot, ChatGPT for coding, career roadmap tech, frontend developer roadmap, backend developer roadmap, full stack roadmap, AI ML career path, DevOps roadmap, deployment guides, resume builder for freshers, learn Python, learn Java, learn C, learn C++, learn React, learn SQL, career switch to tech, self learning coding, final year project ideas, coding interview preparation'

const CATEGORY_LABEL = Object.fromEntries(
  CATEGORIES.filter((c) => c.id !== 'all').map((c) => [c.id, c.label]),
)

const STACK_BY_ROUTE = Object.fromEntries(STACKS.filter((s) => s.route).map((s) => [s.route, s]))

/** Public, crawlable hubs + legal pages. Auth / private routes use noindex. */
const ROUTE_SEO = {
  '/': {
    title: BASE_TITLE,
    description:
      'Whether you are learning to code for the first time, improving your skills, preparing for placements, or exploring AI tools — LearnForEarn has the structured path for you. Coding practice, aptitude tests, real projects, career roadmaps and more.',
    keywords: 'learn coding online, coding practice India, aptitude practice, placement preparation, build projects, learn programming from scratch, DSA practice, AI tools for students, career roadmap tech, coding for beginners,placement preparation, campus placements, fresher jobs preparation, aptitude practice, quantitative aptitude, logical reasoning, verbal ability, data interpretation, aptitude mock tests, aptitude questions and answers, placement aptitude preparation, aptitude shortcuts, coding practice, coding problems, DSA practice, data structures and algorithms, coding interview preparation, technical interview preparation, coding challenges, leetcode alternatives, java programming, python programming, c programming, c++ programming, react learning, sql practice, frontend developer roadmap, backend developer roadmap, full stack developer roadmap, software engineer roadmap, devops roadmap, ai engineer roadmap, machine learning roadmap, career roadmap, resume builder, ATS resume builder, resume for freshers, resume template for students, portfolio projects, full stack projects, project based learning, final year projects, github projects, deployment guide, render deployment, vercel deployment, host projects online, ai tools for developers, github copilot, cursor ai, chatgpt for coding, placement preparation india, tcs nqt preparation, infosys preparation, wipro preparation, cognizant preparation, accenture preparation, learn coding from scratch, tech career guidance, software engineer preparation, best website to learn coding for free, online learning platform for engineering students, learn to code India, coding website for college students, tech skills for students, how to get IT job in India, IT job preparation, software job without experience, self paced coding course, free coding classes online, learn tech from scratch, learn software development online, web development for beginners, mobile app development learning, software engineering learning platform, Coursera alternative India, Udemy alternative for coding, LinkedIn Learning alternative, learn coding without a degree, coding for BTech students, coding for MCA students, coding for BCA students, coding for BSc CS students, coding for engineering students India, learn coding in 2026, future proof tech skills 2026, AI era coding skills, how to become a software developer, how to become a programmer in India, skill development platform for students, upskilling platform for students India, job ready coding skills, coding kaise sikhe, programming kaise sikhe, best platform to learn programming, learn to build websites and apps, one platform for coding and aptitude, all in one placement and learning platform, learn code build projects get hired, career options after engineering, how to start career in software, learn coding step by step, beginner friendly coding platform, gamified coding learning platform, learn coding on mobile, everything to get placed in one place, tech learning platform India, IT career for students India, coding practice with certificate, best online coding platform for students​‌',
  },
  '/about': {
    title: brand('About Us'),
    description: 'LearnForEarn is an online learning platform for tech students at every stage — beginners, skill builders, placement seekers, career switchers, and AI learners. Learn what it is, who it is for, and how it helps you grow in tech.',
    keywords: 'about LearnForEarn, ARISE learning platform, online learning platform for tech students, career platform India',
    schema: [ORG_ENTITY],
  },
  '/faq': {
    title: brand('Frequently Asked Questions'),
    description:
      'Everything students ask about LearnForEarn — what it covers, who it is for, how to use it, and how it helps every type of student grow in tech.',
    keywords: 'LearnForEarn FAQ, what is LearnForEarn, is LearnForEarn good for beginners, LearnForEarn for placement, learn coding platform FAQ, is LearnForEarn free, LearnForEarn review, LearnForEarn vs PrepInsta, LearnForEarn vs GeeksforGeeks, LearnForEarn vs Coding Ninjas, LearnForEarn vs LeetCode, LearnForEarn vs Unstop, is LearnForEarn worth it, how to use LearnForEarn, do I need to sign up for LearnForEarn, is LearnForEarn good for non CS students, can I use LearnForEarn for free, best free platform for placement preparation, coding platform for college students India, online practice platform for students, learning platform for beginners in tech, platform to practice aptitude and coding, study resource for engineering students, resource for teachers coding practice, platform recommendation for students, what is ARISE learning platform, how does LearnForEarn work, who can use LearnForEarn, does LearnForEarn give certificates, is LearnForEarn good for self study, coding practice for school students, platform for parents to help students learn coding, alternative to PrepInsta free, alternative to Coding Ninjas free, one platform for aptitude coding projects, how to start on LearnForEarn, LearnForEarn features, LearnForEarn for career switchers, LearnForEarn for AI learning, is LearnForEarn safe, LearnForEarn missions explained, LearnForEarn skill arena, how to earn XP on LearnForEarn, LearnForEarn rank system, best placement website 2026, trusted coding practice platform India',
    schema: [faqPage(FAQS.map((f) => ({ q: f.q, a: f.a }))), PREP_HOWTO],
  },
  '/contact': {
    title: brand('Contact Us'),
    description: 'Contact LearnForEarn — support, feedback, privacy requests, and partnership enquiries.',
    keywords: 'contact LearnForEarn, support, feedback, partnerships',
  },
  '/terms': {
    title: brand('Terms of Service'),
    description: 'Terms of service for using LearnForEarn (ARISE).',
    keywords: 'terms of service',
  },
  '/privacy': {
    title: brand('Privacy Policy'),
    description: 'How LearnForEarn collects, uses, and protects your data.',
    keywords: 'privacy policy, data protection',
  },
  '/missions': {
    title: brand('Project Missions — Build Real Projects at Every Skill Level'),
    description: 'Build projects that match your current skill level — with source code and step-by-step guidance. From your very first program to a production-ready application, Mission Board has guided React, Node.js, Python, Java, ML and DevOps projects for beginners, final-year students and developers building a portfolio.',
    keywords: 'coding projects for beginners, projects for developers, build real projects, portfolio projects, full stack projects, AI ML projects, DevOps projects, programming projects India, final year project ideas, React project ideas, Node.js project ideas, Python project ideas, Django project ideas, Flask project ideas, Spring Boot project ideas, Java project ideas, JavaScript project ideas, MERN stack projects, Flutter app projects, Android app project ideas, machine learning project ideas, data science project ideas, deep learning projects, NLP project ideas, computer vision projects, generative AI projects, beginner project ideas, intermediate project ideas, advanced project ideas, frontend developer projects, backend developer projects, data analyst projects, ML engineer projects, final year project ideas for CSE, BCA final year project, MCA final year project, BTech final year project, mini project ideas, major project ideas, IEEE project ideas, projects with source code, coding projects with source code, GitHub project ideas, open source contribution for beginners, hackathon project ideas, resume worthy projects, projects to get placed, deployed project examples, capstone project ideas, web development project ideas, guided project tutorials, real world coding projects, e-commerce project idea, chat application project, job portal project, resume analyzer project, weather app project, to-do app project, blog website project, portfolio website project, REST API project ideas, SaaS project ideas, startup project ideas for students',
  },
  '/walk-ins': {
    title: brand('Walk-In Job Drives for Freshers'),
    description: 'Latest walk-in interview drives and fresher hiring across India — filter by city, role, and skills.',
    keywords: 'walk-in drives, fresher jobs India, walk-in interview, off campus drive, IT jobs for freshers',
  },
  '/fresher-instructions': {
    title: brand('Starting Your Tech Career — Complete Guide for Students'),
    description: 'A complete honest guide for students entering the tech world — even with a low CGPA, a tier-3 college, a gap year or no experience. Understand the real market, service vs product companies, AMCAT / eLitmus / CoCubes, resume and HR-round preparation, and how to go from student to working developer.',
    keywords: 'how to start tech career, placement preparation guide, fresher guide IT jobs, tech career for students India, how to get first IT job, how to get placed with low CGPA, placement for tier 3 college students, how to get IT job with gap year, job without experience fresher, how to handle placement rejection, IT job myths vs reality, is IT job stressful, fresher IT salary expectations, what is service based company, service based vs product based company, what is bond in IT companies, IT company training period, notice period for freshers, AMCAT preparation, eLitmus pH test preparation, CoCubes test preparation, Superset platform placement, how to optimize LinkedIn profile fresher, LinkedIn for freshers job search, resume for freshers with no experience, ATS friendly resume freshers, cover letter for freshers, HR interview questions for freshers, HR round preparation, tell me about yourself answer fresher, common interview questions freshers, how to answer why should we hire you, off campus placement drives 2026, on campus vs off campus placement, how to apply for off campus drives, fresher job offer letter, salary negotiation for freshers, how to break a bond, IT company hiring process explained, what companies look for in freshers, how to prepare for first job, confidence tips for interviews, do internships help in placement, how many backlogs allowed in placements, English communication for interviews',
    schema: [FRESHER_FAQ],
  },
  '/fresher-instructions/career-guidance': {
    title: brand('Tech Career Roadmaps — Frontend, Backend, Full Stack, AI ML, DevOps'),
    description: 'Explore detailed roadmaps for every tech role — what each role does, the skills to build, fresher salaries in India, job demand, and how long each takes to learn. Whether you are a beginner, a B.Tech / MCA / BCA student, or a non-CS career switcher, find the path that fits you.',
    keywords: 'tech career roadmap, frontend developer roadmap, backend developer roadmap, full stack roadmap, AI ML career path, DevOps roadmap, which tech role to choose, frontend developer salary India, backend developer salary freshers, full stack developer salary India, data scientist salary India entry level, data analyst salary freshers, machine learning engineer salary India, DevOps engineer salary India, cloud engineer salary India, software developer salary freshers India, frontend vs backend developer, data analyst vs data scientist, DevOps vs cloud engineer, ML engineer vs AI engineer, software engineer vs data scientist, skills required for frontend developer, skills required for backend developer, skills for data analyst, skills for machine learning engineer, how long to become a full stack developer, how long to learn data science, how long to become a software engineer, job demand for data analyst India, most in demand tech jobs India 2026, highest paying tech jobs freshers India, career after BTech CSE, career after MCA, career after BCA, career after BSc computer science, non CS student into tech, arts student learn coding career, mechanical engineer to software career, career switch to data science, QA tester career roadmap, data engineer roadmap, cloud computing career path, cybersecurity career roadmap, android developer roadmap, mobile app developer career, companies hiring frontend developers India, companies hiring data scientists India, internship roadmap for students, how to get a tech internship, freelancing roadmap for developers, how to start freelancing coding, best tech career for freshers, which programming language for which career',
  },
  '/ai-lab': {
    title: brand('AI Lab — Learn the AI Tools Every Developer Needs in 2026'),
    description: `Explore and learn the AI tools transforming how developers work. GitHub Copilot, ChatGPT for coding, Cursor, Windsurf, Codeium and ${TOOLS.length}+ more — practical hands-on guides for prompt engineering, AI pair programming and using AI to code better, learn faster and build more.`,
    keywords: 'AI tools for developers, learn GitHub Copilot, ChatGPT for coding, AI tools for students, AI skills 2026, learn AI tools India, Cursor AI editor, Windsurf AI editor, Codeium free AI, Tabnine autocomplete, v0 by Vercel, Bolt.new app builder, Lovable AI app builder, Replit AI, Claude for coding, Claude Code, Gemini Code Assist, Amazon Q Developer, Blackbox AI, Phind AI search, Continue AI extension, DeepSeek coder, Perplexity for research, AI code completion tools, AI pair programming, vibe coding, vibe coding tools, prompt engineering for beginners, prompt engineering for developers, how to write prompts for coding, AI for learning to code faster, AI tools to get hired, AI resume builder tool, AI for job search, AI code reviewer, AI debugging tools, AI for students free, best AI coding assistant 2026, GitHub Copilot for students free, GitHub Student Developer Pack Copilot, how to use AI to code, AI tools for non programmers, AI app builder no code, generate code with AI, AI for building projects, future of coding with AI, AI productivity tools for students, how to use AI without cheating, learn AI for free, AI chatbot for coding help, ChatGPT vs Copilot vs Cursor, best free AI coding tools',
  },
  '/deployment': {
    title: brand('Deploy Your Projects — Make Your Work Live on the Internet'),
    description: 'Step by step guides to deploy Python, Node.js, React, Django, Flask, FastAPI, Spring Boot and full-stack projects for free on Vercel, Netlify, Render, Railway and more. Turn your local project into a live URL with a custom domain and free SSL — and fix common deploy errors along the way.',
    keywords: 'deploy project free, how to deploy Python project, deploy React app, Render deployment guide, Vercel deployment tutorial, make project live, free hosting for students, deploy on Netlify, deploy on Railway, Fly.io deployment, Cloudflare Pages hosting, Koyeb free hosting, PythonAnywhere hosting, GitHub Pages hosting, Heroku alternative free, AWS free tier deployment, Google Cloud free hosting, Azure for students, DigitalOcean deployment, deploy Django app free, deploy Flask app, deploy Next.js app, deploy Node.js Express app, deploy Spring Boot app, deploy FastAPI app, deploy Streamlit app, deploy static website free, host portfolio website free, deploy full stack app free, host backend API free, free database hosting, MongoDB Atlas free, Supabase free database, Neon Postgres free, PlanetScale database, deploy build failed error, environment variables deployment, CORS error fix deployment, port error deployment, database connection error deploy, add custom domain free, free SSL certificate, CI CD for beginners, GitHub Actions deploy, Docker deployment basics, containerize app for deployment, how to host a website for free, how to deploy a project step by step, deploy MERN app, deploy React to Vercel, connect domain to Vercel, deploy machine learning model, host Python script online',
  },
  '/aptitude': {
    title: brand('Aptitude Practice — Quantitative, Logical, Verbal for Every Student'),
    description: 'Practice aptitude for placement tests (TCS NQT, Infosys InfyTQ, Wipro NLTH, Cognizant GenC), competitive exams like SSC, IBPS and CAT, or simply to sharpen your logical and mathematical thinking. Every topic explained from scratch with shortcuts — from Number System and Time & Work to Probability.',
    keywords: 'aptitude practice online, quantitative aptitude, logical reasoning practice, verbal ability, aptitude for placement, aptitude for competitive exams, aptitude shortcuts and tricks,aptitude practice, quantitative aptitude, logical reasoning, verbal ability, data interpretation, aptitude preparation, placement aptitude, aptitude mock test, aptitude questions, aptitude shortcuts, aptitude tricks, tcs nqt aptitude, infosys aptitude, wipro aptitude, cognizant aptitude, campus placement aptitude, online aptitude test, aptitude for freshers, time speed and distance problems, time and work problems, profit and loss aptitude, percentage problems aptitude, ratio and proportion questions, number system aptitude, simple and compound interest, pipes and cisterns problems, boats and streams problems, problems on ages aptitude, averages aptitude questions, permutation and combination questions, probability aptitude, mixtures and alligations, partnership problems, clocks and calendars aptitude, HCF and LCM problems, simplification questions, mensuration aptitude, speed maths tricks, blood relations reasoning, coding decoding reasoning, syllogism questions, seating arrangement problems, direction sense test, series completion reasoning, data sufficiency questions, logical puzzles practice, analogy reasoning questions, reading comprehension practice, sentence correction English, synonyms and antonyms practice, error spotting English, para jumbles practice, Infosys InfyTQ preparation, Wipro NLTH aptitude, Accenture cognitive assessment, Cognizant GenC aptitude, Capgemini aptitude test, HCL TechBee aptitude, Tech Mahindra aptitude, Capgemini game changer test, SSC CGL quantitative aptitude, IBPS PO reasoning, SBI PO aptitude, bank exam aptitude preparation, CAT quantitative aptitude, MAT aptitude preparation, GRE quant practice, GMAT quant preparation, railway exam aptitude, vedic maths tricks, mental maths practice, aptitude formulas list, aptitude previous year questions, sectional aptitude test, aptitude time management tips, negative marking strategy, aptitude speed and accuracy, aptitude questions with explanation, quantitative aptitude tricks, reasoning ability practice',
    schema: [APTITUDE_LR],
  },
  // Code GYM landing is public and crawlable (preview the tracks). Individual tracks
  // and problem workspaces (/code-gym/*) stay login-gated + noindex via PREFIX_SEO below.
  '/code-gym': {
    title: brand('Code GYM — Practice Coding Problems from Beginner to Advanced'),
    description: 'Solve coding problems at every level — from arrays and strings to trees, graphs and dynamic programming, in Java, Python, C++ and more. Whether you are just starting, improving your DSA skills, or preparing for company coding rounds and technical interviews, Code GYM has structured practice with full solutions.',
    keywords: 'coding practice online, DSA problems, learn data structures, coding problems beginners, coding interview preparation, programming practice India, DSA practice for placement, arrays practice problems, string coding problems, linked list problems, stack and queue problems, tree data structure problems, binary search tree practice, graph algorithms practice, dynamic programming problems, recursion practice problems, backtracking problems, greedy algorithm problems, sorting algorithms practice, searching algorithms problems, hashing problems, two pointers problems, sliding window problems, bit manipulation problems, heap and priority queue problems, trie data structure, Java coding practice, Python coding practice, C++ coding practice, JavaScript coding problems, C programming practice, TCS NQT coding questions, Infosys HackWithInfy problems, Wipro coding questions, Accenture coding questions, Amazon coding interview questions, Google coding interview practice, Microsoft interview coding questions, FAANG interview preparation, product company coding preparation, LeetCode alternative India, HackerRank alternative, CodeChef practice, Codeforces problems, online judge for coding, competitive programming India, competitive coding practice, coding problems with solutions, solved coding problems, easy medium hard coding problems, topic wise DSA practice, daily coding challenge, coding streak practice, time complexity practice, space complexity problems, time limit exceeded fix, runtime error debugging, Blind 75 problems, striver SDE sheet, pattern based DSA practice, coding round preparation, technical interview coding questions, system design basics for beginners, low level design practice, output MCQ programming questions',
    schema: [CODEGYM_LR],
  },
  '/resume': {
    title: brand('Resume Builder for Freshers'),
    description: 'Build an ATS-friendly resume for campus placements and fresher jobs — clean layout, export-ready, made for Indian students.',
    keywords: 'resume builder for freshers, ATS resume, online resume builder India, campus placement resume, fresher resume format',
  },
  '/certificate/verify': {
    title: brand('Verify Certificate'),
    description: 'Verify a LearnForEarn certificate or badge code.',
    keywords: 'certificate verification',
  },

  // Auth / private — keep titles for UX, never index
  '/login': {
    title: brand('Sign In'),
    description: 'Sign in to LearnForEarn to continue learning.',
    noindex: true,
  },
  '/register': {
    title: brand('Create Account'),
    description: 'Create your LearnForEarn account and start your journey from zero to hired.',
    noindex: true,
  },
  '/forgot-password': {
    title: brand('Reset Password'),
    description: 'Reset your LearnForEarn password.',
    noindex: true,
  },
  '/skill-arena/dashboard': {
    title: brand('Skill Arena'),
    description: 'Your Skill Arena dashboard — gates, paths, quests, and XP.',
    noindex: true,
  },
  '/bookmarks': {
    title: brand('My Bookmarks'),
    description: 'Your saved concepts and problems.',
    noindex: true,
  },
  '/myprofile': {
    title: brand('My Profile'),
    description: 'Your hunter profile and settings.',
    noindex: true,
  },
  '/aptitude/mock': {
    title: brand('Core Aptitude Mock'),
    description: '50-question placement-style aptitude mock exam.',
    noindex: true,
  },
}

// Aptitude category hubs are public and crawlable
for (const cat of APTITUDE_CATEGORIES) {
  const description = cat.description || cat.tagline
  ROUTE_SEO[`/aptitude/${cat.id}`] = {
    title: brand(`${cat.label} — Placement Aptitude`),
    description,
    keywords: `${cat.label}, aptitude preparation, placement aptitude, ${cat.chips?.join(', ') || ''}`,
    schema: [{
      '@type': 'Course',
      name: `${cat.label} — Aptitude Practice`,
      description,
      provider: ORG_INLINE,
      hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online' },
    }],
  }
}

// Public /tips content articles — hub + one crawlable page per guide, each with
// Article + FAQPage structured data built from its own content (tipsContent.js).
ROUTE_SEO['/tips'] = {
  title: brand('Tech Learning Guides — Coding, DSA, Projects, AI Tools & Placement'),
  description: 'Practical guides for every tech student — how to start coding from scratch, build a developer portfolio, learn DSA, choose a tech role, use AI tools, and prepare for placements.',
  keywords: 'learn to code guide, DSA roadmap for beginners, developer portfolio guide, AI tools for students, which tech role to choose, placement preparation guides, coding interview roadmap',
}
for (const t of TIPS) {
  const path = `/tips/${t.slug}`
  const schema = [{
    '@type': 'Article',
    headline: t.h1,
    description: t.description,
    author: ORG_INLINE,
    publisher: ORG_REF,
    inLanguage: 'en-IN',
    mainEntityOfPage: ORIGIN + path,
  }, {
    '@type': 'LearningResource',
    name: t.h1,
    description: t.description,
    url: ORIGIN + path,
    inLanguage: 'en-IN',
    provider: ORG_INLINE,
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
    },
  }]
  if (t.faqs?.length) {
    schema.push(faqPage(t.faqs.map((f) => ({ q: f.q, a: f.a }))))
  }
  ROUTE_SEO[path] = {
    title: `${t.title} · ${BRAND}`,
    description: t.description,
    keywords: t.keywords,
    schema,
  }
}

/** Prefix rules — more specific prefixes first. Protected trees are noindex. */
const PREFIX_SEO = [
  ['/admin-skill-arena', { title: brand('Admin'), noindex: true }],
  ['/skill-arena', { title: brand('Skill Arena'), noindex: true }],
  ['/aptitude/mock', { title: brand('Aptitude Mock'), noindex: true }],
  ['/bookmarks', { title: brand('Bookmarks'), noindex: true }],
  ['/myprofile', { title: brand('My Profile'), noindex: true }],
  ['/code-gym/', { title: brand('Code Gym'), description: 'Coding practice problem.', noindex: true }],
  ['/missions/', { title: brand('Mission'), description: 'Project mission details.', noindex: true }],
  ['/r/', { title: brand('Shared Resume'), noindex: true }],
  ['/u/', { title: brand('Hunter Profile'), noindex: true }],
  ['/certificate/', { title: brand('Certificate'), noindex: true }],
  ['/verify/', { title: brand('Verify Certificate'), noindex: true }],
]

/** Full SEO record: { title, description, keywords, canonical, noindex }. */
export function resolveSeo(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'

  const exact = ROUTE_SEO[path]
  if (exact) return withCanonical(path, exact)

  // Dynamic: AI Lab tool (login-gated — noindex, still good titles for shares)
  const ai = path.match(/^\/ai-lab\/([^/]+)\/([^/]+)$/)
  if (ai) {
    const [, category, toolId] = ai
    const tool = TOOLS.find((t) => t.id === toolId && t.category === category)
    if (tool) {
      return withCanonical(path, {
        title: brand(`${tool.name} — AI Lab`),
        description: tool.tagline || `Learn how to use ${tool.name} — beginner guide for students.`,
        keywords: `${tool.name}, ${CATEGORY_LABEL[category] || 'AI Lab'}, AI tools for students`,
        noindex: true,
      })
    }
    return withCanonical(path, { title: brand('AI Lab'), noindex: true })
  }

  // Dynamic: deployment guide (login-gated — noindex)
  const stack = STACK_BY_ROUTE[path]
  if (stack) {
    return withCanonical(path, {
      title: brand(`Deploy ${stack.title}`),
      description: stack.desc || `Step-by-step guide to deploy ${stack.title}.`,
      keywords: `deploy ${stack.title}, ${stack.platforms || ''}, deployment guide, hosting, ${(stack.tags || []).slice(0, 6).join(', ')}`,
      noindex: true,
    })
  }

  // Dynamic: aptitude group page (public) — /aptitude/:category/:group
  const aptGroup = path.match(/^\/aptitude\/([^/]+)\/([^/]+)$/)
  if (aptGroup) {
    const meta = APTITUDE_CATEGORY_MAP[aptGroup[1]]
    if (meta) {
      const groupLabel = aptGroup[2].replace(/-/g, ' ')
      return withCanonical(path, {
        title: brand(`${meta.label} — ${groupLabel}`),
        description: `Practice ${meta.label} topics in ${groupLabel}. Beginner explanations and shortcut methods for placement aptitude.`,
        keywords: `${meta.label}, ${groupLabel}, aptitude preparation, placement aptitude`,
      })
    }
  }

  // Deeper aptitude topic/questions (protected)
  if (path.startsWith('/aptitude/') && path.split('/').length >= 4) {
    const cat = APTITUDE_CATEGORY_MAP[path.split('/')[2]]
    return withCanonical(path, {
      title: brand(cat ? cat.label : 'Aptitude'),
      description: 'Aptitude topic practice — login required.',
      noindex: true,
    })
  }

  for (const [prefix, meta] of PREFIX_SEO) {
    if (path.startsWith(prefix) || path === prefix.replace(/\/$/, '')) {
      return withCanonical(path, meta)
    }
  }

  // AI lab / deployment unknown subpaths
  if (path.startsWith('/ai-lab/')) return withCanonical(path, { title: brand('AI Lab'), noindex: true })
  if (path.startsWith('/deployment/')) return withCanonical(path, { title: brand('Deployment Guide'), noindex: true })

  return withCanonical('/', { title: BASE_TITLE, description: BASE_DESCRIPTION })
}

function withCanonical(pathname, meta) {
  const keywords = meta.keywords ? `${meta.keywords}, ${BASE_KEYWORDS}` : BASE_KEYWORDS
  return {
    title: meta.title || BASE_TITLE,
    description: meta.description || BASE_DESCRIPTION,
    keywords,
    canonical: ORIGIN + (pathname === '/' ? '/' : pathname),
    noindex: !!meta.noindex,
    schema: meta.schema,
  }
}

export { ORIGIN, BRAND }
