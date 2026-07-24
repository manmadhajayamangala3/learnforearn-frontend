import { TOOLS, CATEGORIES } from '../pages/ailab/aiLabData'
import { STACKS } from '../pages/deployment/guideIndex'
import { APTITUDE_CATEGORIES, APTITUDE_CATEGORY_MAP } from '../pages/aptitude/aptitudeData'
import { TIPS } from '../pages/tips/tipsContent'

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

const FRESHER_FAQ = faqPage([
  { q: 'How long does placement preparation take?', a: 'With structured preparation covering aptitude, coding, and projects, most freshers need 3-6 months. Starting in 5th or 6th semester gives the best results.' },
  { q: 'Which companies can I get placed in with LearnForEarn preparation?', a: 'Our preparation covers TCS, Infosys, Wipro, Accenture, Cognizant, HCL, and product companies. The platform covers aptitude, DSA, and projects required for all major IT companies.' },
  { q: 'What is the difference between Code Gym and the Aptitude section?', a: 'Code Gym focuses on DSA and programming problems for technical rounds. Aptitude covers Quantitative, Logical, and Verbal sections tested in written rounds at service companies.' },
  { q: 'Do I need any prior coding knowledge to start?', a: 'No. LearnForEarn is designed for complete beginners. Start with E-rank missions and aptitude basics, then progress at your own pace through the structured learning path.' },
])

const APTITUDE_LR = {
  '@type': 'LearningResource',
  name: 'Aptitude Practice — Quantitative, Logical, Verbal',
  description: 'Complete aptitude preparation for placement tests at TCS, Infosys, Wipro and more.',
  provider: ORG_INLINE,
  teaches: ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Data Interpretation'],
}

export const BASE_TITLE = `${BRAND} — Placement Prep, Coding Practice & Fresher Jobs India`
export const BASE_DESCRIPTION =
  'LearnForEarn helps Indian students and freshers go from zero to hired — career roadmaps, coding practice (C, Python, Java, C++), DSA, placement aptitude, mock tests, AI tools, deployment guides, resume builder, project missions, and walk-in job drives.'

export const BASE_KEYWORDS =
  'LearnForEarn, ARISE learning platform, coding practice, DSA practice, data structures and algorithms, placement preparation, campus placement preparation, aptitude preparation, quantitative aptitude, logical reasoning, verbal ability, data interpretation, mock aptitude test, TCS NQT, Infosys, Wipro, Accenture, fresher jobs India, walk-in drives, off campus drive, AI tools for students, career roadmap, coding interview questions, coding problems with solutions, project ideas for students, final year project ideas, deployment guides, resume builder for freshers, interview preparation, learn Python, learn Java, learn C, learn C++, learn React, learn SQL, coding for beginners, B.Tech placement, software developer jobs for freshers'

const CATEGORY_LABEL = Object.fromEntries(
  CATEGORIES.filter((c) => c.id !== 'all').map((c) => [c.id, c.label]),
)

const STACK_BY_ROUTE = Object.fromEntries(STACKS.filter((s) => s.route).map((s) => [s.route, s]))

/** Public, crawlable hubs + legal pages. Auth / private routes use noindex. */
const ROUTE_SEO = {
  '/': {
    title: BASE_TITLE,
    description: BASE_DESCRIPTION,
    keywords: 'coding practice India, learn programming online, placement preparation platform, student career platform, zero to hired',
  },
  '/about': {
    title: brand('About Us'),
    description: 'What LearnForEarn (ARISE) is, who it is for, and how it helps Indian students and freshers go from zero to hired.',
    keywords: 'about LearnForEarn, ARISE learning platform, career platform India',
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
    title: brand('Project Missions'),
    description: 'Build resume-worthy project missions — practice apps, role-based builds, and academic projects with clear steps and XP rewards.',
    keywords: 'project ideas for students, resume projects, portfolio projects, mini projects, final year project ideas',
  },
  '/walk-ins': {
    title: brand('Walk-In Job Drives for Freshers'),
    description: 'Latest walk-in interview drives and fresher hiring across India — filter by city, role, and skills.',
    keywords: 'walk-in drives, fresher jobs India, walk-in interview, off campus drive, IT jobs for freshers',
  },
  '/fresher-instructions': {
    title: brand('Fresher Guide — First Job Playbook'),
    description: 'Honest fresher guide: how hiring really works, AI impact, and a practical playbook to land your first job.',
    keywords: 'fresher guide, how to get first job, placement tips, first job after graduation',
    schema: [FRESHER_FAQ],
  },
  '/fresher-instructions/career-guidance': {
    title: brand('Career Guidance for Students'),
    description: 'Role-by-role career guidance — passion fit, AI impact, salaries, and realistic outlook for IT and software paths.',
    keywords: 'career guidance, which career to choose, IT career paths, career after B.Tech',
  },
  '/ai-lab': {
    title: `AI Lab — ${TOOLS.length}+ AI Tools for Students · ${BRAND}`,
    description: `Explore ${TOOLS.length}+ AI tools for students — ChatGPT, coding copilots, agents, RAG, automation, and more. Beginner-friendly guides to learn and build.`,
    keywords: 'AI tools for students, ChatGPT guide, AI coding tools, prompt engineering, RAG, learn AI, generative AI tools',
  },
  '/deployment': {
    title: brand('Deployment Guides for Students'),
    description: `Step-by-step deployment guides for React, Node, Django, Spring Boot, FastAPI, databases, and AI apps — copy-paste commands to take your project live.`,
    keywords: 'hosting for students, deploy React app, deploy Django, deploy Node.js, deploy Spring Boot, host project online, Vercel, Render, Netlify',
  },
  '/aptitude': {
    title: brand('Placement Aptitude — Quant, Reasoning, Verbal & DI'),
    description: 'Master placement aptitude two ways: Learn It (beginner walkthrough) and Crack It (fast shortcuts) — quantitative, logical, verbal, and data interpretation.',
    keywords: 'aptitude preparation, quantitative aptitude, logical reasoning, verbal ability, data interpretation, TCS NQT aptitude',
    schema: [APTITUDE_LR],
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
  '/code-gym': {
    title: brand('Code Gym — Coding Practice'),
    description: 'Ranked coding tracks from first program to interview DSA — login required.',
    keywords: 'coding practice, DSA practice',
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
  title: brand('Placement Preparation Guides for Freshers'),
  description: 'Placement preparation guides for Indian freshers — how to prepare, TCS NQT, resume projects, aptitude shortcuts, and coding interview roadmaps.',
  keywords: 'placement preparation guides, fresher placement tips, how to crack placement, TCS NQT preparation, coding interview roadmap',
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
