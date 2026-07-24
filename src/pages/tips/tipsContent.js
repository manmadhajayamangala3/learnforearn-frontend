// Public, crawlable content articles under /tips/*. This is the single source of
// truth for both the rendered page (TipArticlePage) and the route SEO/JSON-LD
// (documentTitle.js imports TIPS). Each article targets one high-volume keyword
// with genuinely useful content — no stuffing. `body` entries are either a
// paragraph string or { list: [...] } / { steps: [...] }. `to` on a link points
// to a real in-app route.

export const TIPS = [
  {
    slug: 'how-to-prepare-for-placement',
    keyword: 'how to prepare for placement 2026',
    title: 'How to Prepare for Placement in 2026 — Step-by-Step Guide for Freshers',
    h1: 'How to Prepare for Placement in 2026',
    description:
      'A practical, no-fluff placement preparation plan for Indian freshers in 2026: how long it takes, what to study first, and a week-by-week roadmap covering aptitude, coding, and projects.',
    keywords:
      'how to prepare for placement 2026, placement preparation for freshers, campus placement preparation guide, off campus placement 2026',
    intro:
      'Placement preparation feels overwhelming because everyone gives you a different list. This is the honest version: what actually gets tested, in what order to learn it, and how much time each part really needs. Follow it and you will be ready in 3 to 6 months.',
    sections: [
      {
        h2: 'How long does placement preparation take?',
        body: [
          'With focused, structured effort most freshers need 3 to 6 months. Starting in your 5th or 6th semester gives the most breathing room, but even 90 days of consistent daily practice is enough if you stop jumping between random resources.',
          'The mistake that wastes months is collecting playlists and PDFs instead of solving problems daily. Preparation is a practice habit, not a reading habit.',
        ],
      },
      {
        h2: 'What companies actually test',
        body: [
          'Service companies (TCS, Infosys, Wipro, Accenture, Cognizant, HCL) test three things: aptitude in a written round, basic coding, and communication. Product companies weight data structures and algorithms much more heavily.',
          { list: [
            'Aptitude — quantitative, logical reasoning, and verbal ability',
            'Coding — output questions, then 1 to 2 programming problems',
            'DSA — arrays, strings, hashing, then trees, graphs, and dynamic programming for product roles',
            'Projects — one or two real, deployed projects you can explain end to end',
          ] },
        ],
      },
      {
        h2: 'A week-by-week roadmap',
        body: [
          { steps: [
            'Weeks 1-4: Aptitude fundamentals. One quantitative topic and one reasoning topic per day, with timed practice.',
            'Weeks 5-10: Coding + core DSA. Arrays, strings, hashing, sorting, searching, then linked lists and stacks/queues.',
            'Weeks 11-16: Advanced DSA (trees, graphs, DP) for product companies, plus building one strong project.',
            'Ongoing: One full aptitude mock and 3 to 5 coding problems every week to keep both sharp.',
          ] },
        ],
      },
      {
        h2: 'Where to practice on LearnForEarn',
        body: [
          'Practise aptitude with beginner walkthroughs and shortcut methods, solve coding problems built for placement patterns, and build resume-ready projects — all in one place.',
        ],
        links: [
          { to: '/aptitude', text: 'Practice placement aptitude' },
          { to: '/missions', text: 'Build project missions for your resume' },
          { to: '/fresher-instructions', text: 'Read the full fresher first-job playbook' },
        ],
      },
    ],
    faqs: [
      { q: 'How many days does it take to prepare for placement?', a: 'With structured daily practice, 90 to 180 days is realistic. Consistency matters more than total hours — one hour every day beats ten hours once a week.' },
      { q: 'What should I study first for placement?', a: 'Start with aptitude fundamentals and basic coding in parallel. Aptitude clears the first written round at service companies, and basic coding unblocks everything after it.' },
    ],
  },
  {
    slug: 'tcs-placement-preparation',
    keyword: 'TCS placement preparation 2026',
    title: 'TCS Placement Preparation 2026 — NQT Pattern, Syllabus & Practice Plan',
    h1: 'TCS Placement Preparation 2026',
    description:
      'Complete TCS NQT 2026 preparation guide: the exact test pattern, aptitude and coding syllabus, question types, and a focused practice plan to clear the TCS National Qualifier Test.',
    keywords:
      'TCS placement preparation 2026, TCS NQT syllabus 2026, TCS aptitude questions, TCS coding questions, aptitude and coding practice for TCS Infosys',
    intro:
      'TCS hires through the National Qualifier Test (NQT). It is predictable once you know the sections and practise to the clock. Here is the pattern and exactly what to drill.',
    sections: [
      {
        h2: 'TCS NQT test pattern',
        body: [
          'The NQT is sectional and timed, so speed matters as much as accuracy. The core sections are Numerical Ability, Reasoning Ability, Verbal Ability, and Programming (both concept MCQs and hands-on coding).',
          { list: [
            'Numerical Ability — arithmetic, number system, ratios, time-speed-distance, probability',
            'Reasoning Ability — series, coding-decoding, syllogisms, data sufficiency',
            'Verbal Ability — grammar, sentence completion, reading comprehension',
            'Programming — output/error MCQs plus 1 to 2 coding problems in a language of your choice',
          ] },
        ],
      },
      {
        h2: 'Aptitude topics to prioritise',
        body: [
          'High-frequency quantitative topics: percentages, profit and loss, time and work, time-speed-distance, ratio and proportion, and number system. In reasoning, focus on series, blood relations, directions, and syllogisms.',
        ],
        links: [
          { to: '/aptitude', text: 'Practise TCS-style aptitude with shortcuts' },
        ],
      },
      {
        h2: 'Coding syllabus and practice',
        body: [
          'You do not need advanced DSA for the NQT. Be fluent with input/output handling, loops, conditionals, strings, arrays, and basic patterns. Practise writing full programs that read from standard input and print exact output, because that is how the coding round is judged.',
        ],
        links: [
          { to: '/fresher-instructions', text: 'See how the hiring process really works' },
        ],
      },
    ],
    faqs: [
      { q: 'What is the syllabus for TCS NQT 2026?', a: 'Numerical Ability, Reasoning Ability, Verbal Ability, and Programming (concept MCQs plus hands-on coding). Focus aptitude effort on percentages, time-speed-distance, and number system.' },
      { q: 'Is coding hard in the TCS NQT?', a: 'No. The coding round tests fundamentals — input handling, loops, strings, and arrays. Practising standard input/output programs is the fastest way to clear it.' },
    ],
  },
  {
    slug: 'best-projects-for-fresher-resume',
    keyword: 'best projects for fresher resume',
    title: 'Best Projects for a Fresher Resume in 2026 — By Role, With Why They Work',
    h1: 'Best Projects for a Fresher Resume',
    description:
      'The top projects that actually impress recruiters, grouped by role — frontend, backend, full stack, and AI/ML. Learn why each one stands out and how to present it on your resume.',
    keywords:
      'best projects for fresher resume, projects for freshers resume India, resume projects for IT jobs, full stack projects beginners, AI ML projects for freshers',
    intro:
      'A recruiter spends seconds on your resume. One deployed, well-explained project beats five half-finished tutorials. Here are projects that signal real skill, by the role you are targeting.',
    sections: [
      {
        h2: 'What makes a project impressive',
        body: [
          'Three things: it solves a real problem, it is deployed with a working link, and you can explain every decision. Recruiters trust a live URL far more than a GitHub repo they will never open.',
        ],
      },
      {
        h2: 'Projects by role',
        body: [
          { list: [
            'Frontend — a responsive dashboard or a themeable app that shows layout, state, and accessibility skill',
            'Backend — a REST API with authentication, a database, and clear error handling',
            'Full stack — an app with login, CRUD, and a deployed frontend + backend that talk to each other',
            'AI/ML — a project using an LLM API or a trained model with a real, useful interface (not just a notebook)',
            'DevOps — a project you containerised and deployed with a documented pipeline',
          ] },
        ],
      },
      {
        h2: 'Build and deploy on LearnForEarn',
        body: [
          'Project Missions are ranked from E to S difficulty across every role, each designed to strengthen a resume. Once built, deploy it so the link works on your resume.',
        ],
        links: [
          { to: '/missions', text: 'Browse project missions by role' },
          { to: '/deployment', text: 'Deploy your project online' },
        ],
      },
    ],
    faqs: [
      { q: 'How many projects should a fresher have on a resume?', a: 'Two to three strong, deployed projects are enough. Depth beats quantity — one project you can explain fully is worth more than five you copied.' },
      { q: 'Do projects need to be deployed?', a: 'Yes. A live link is far more convincing than source code alone. Deploying also proves you understand how software runs in the real world.' },
    ],
  },
  {
    slug: 'aptitude-shortcuts',
    keyword: 'aptitude shortcuts for placement',
    title: 'Aptitude Shortcuts for Placement — Speed Tricks for Quant & Reasoning',
    h1: 'Aptitude Shortcuts for Placement',
    description:
      'Time-saving aptitude shortcuts and tricks for placement tests: percentages, time-speed-distance, profit and loss, and number system. Solve faster and clear sectional time limits.',
    keywords:
      'aptitude shortcuts for placement, aptitude tricks and shortcuts, quantitative aptitude shortcuts, how to crack aptitude test for placement',
    intro:
      'Aptitude tests are won on speed. The maths is not hard, but the clock is. These shortcuts cut seconds off the most common question types so you finish every section.',
    sections: [
      {
        h2: 'Percentages',
        body: [
          'Memorise fraction-to-percentage conversions (1/8 = 12.5%, 1/6 = 16.66%, 1/3 = 33.33%). Most percentage questions collapse to a known fraction, letting you answer without long multiplication.',
        ],
      },
      {
        h2: 'Time, speed and distance',
        body: [
          'Convert km/h to m/s by multiplying by 5/18, and m/s to km/h by 18/5. For two objects, learn relative speed: add speeds when moving toward each other, subtract when moving the same direction.',
        ],
      },
      {
        h2: 'Profit and loss',
        body: [
          'Work in fractions, not decimals. A 25% profit means cost:selling = 4:5. Successive percentage changes combine with a + b + ab/100 — this single formula handles most discount-then-tax questions.',
        ],
      },
      {
        h2: 'Practise the method, not just the answer',
        body: [
          'Shortcuts only help if they are automatic. Practise each with a timer until the method is reflex.',
        ],
        links: [
          { to: '/aptitude', text: 'Practise aptitude with Learn It and Crack It modes' },
        ],
      },
    ],
    faqs: [
      { q: 'How do I solve aptitude faster in placement tests?', a: 'Memorise fraction-percentage conversions and unit conversions (5/18, 18/5), and practise each question type against a timer until the method becomes automatic.' },
    ],
  },
  {
    slug: 'coding-interview-preparation-freshers',
    keyword: 'coding interview preparation freshers India',
    title: 'Coding Interview Preparation for Freshers in India — DSA Roadmap & Plan',
    h1: 'Coding Interview Preparation for Freshers',
    description:
      'A complete coding interview preparation roadmap for Indian freshers: which data structures to learn first, a topic order that builds on itself, and a weekly practice plan for placements.',
    keywords:
      'coding interview preparation for freshers, coding interview preparation freshers India, DSA practice for placements, data structures practice for freshers',
    intro:
      'Coding interviews reward pattern recognition, not memorised solutions. Learn topics in an order that builds on itself, and practise enough problems per pattern to recognise it instantly.',
    sections: [
      {
        h2: 'Which topics to learn first',
        body: [
          { steps: [
            'Arrays and strings — the foundation for almost every other pattern',
            'Hashing — turns many O(n^2) problems into O(n)',
            'Two pointers and sliding window — core interview patterns',
            'Stacks and queues, then linked lists',
            'Recursion, then trees and binary search',
            'Graphs and dynamic programming — the advanced tier for product companies',
          ] },
        ],
      },
      {
        h2: 'How many problems to solve',
        body: [
          'Aim for 8 to 12 problems per pattern — enough to recognise it, not so many that you burn out. Redo the ones you failed a week later. Recognising the pattern under pressure is the real skill.',
        ],
      },
      {
        h2: 'A four-phase practice plan',
        body: [
          { steps: [
            'Phase 1: Arrays, strings, hashing until you are fast and confident',
            'Phase 2: Two pointers, sliding window, stacks, queues, linked lists',
            'Phase 3: Recursion, trees, binary search',
            'Phase 4: Graphs and dynamic programming for product-company interviews',
          ] },
        ],
        links: [
          { to: '/fresher-instructions/career-guidance', text: 'Pick the right role to target first' },
        ],
      },
    ],
    faqs: [
      { q: 'Which coding topic should a fresher learn first?', a: 'Arrays and strings, then hashing. They appear in the majority of interview problems and unlock the two-pointer and sliding-window patterns.' },
      { q: 'How many DSA problems should I solve for placements?', a: 'Roughly 8 to 12 per pattern. Recognising the pattern quickly matters more than the raw count — quality and review beat volume.' },
    ],
  },
]

export const TIPS_BY_SLUG = Object.fromEntries(TIPS.map((t) => [t.slug, t]))
