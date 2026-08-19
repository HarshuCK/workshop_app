export interface CategoryAllocation {
  budget: number
  team: number
  effort: number
}

export interface ResourceCategory {
  id: string
  name: string
  description: string
  color: string
  minimumBudget: number
  minimumTeam: number
  minimumEffort: number
}

export interface ScenarioResources {
  budget: number
  team: number
  effort: number
}

export interface ResourceScenario {
  id: string
  title: string
  tagline: string
  description: string
  resources: ScenarioResources
  categories: ResourceCategory[]
}

export interface ScenarioEvent {
  id: string
  label: string
  description: string
  budgetDelta: number
  teamDelta: number
  effortDelta: number
}

// ── Scenario A — College Innovation Fest ─────────────────────────────────────

const SCENARIO_A: ResourceScenario = {
  id: 'innovation-fest',
  title: 'College Innovation Fest',
  tagline: 'Plan a full-day campus event for 300+ students',
  description:
    'Your college is hosting an Innovation Fest featuring project showcases, workshops, and a keynote. You have a fixed budget, a volunteer team, and a limited pool of effort points to distribute across seven areas.',
  resources: { budget: 100000, team: 20, effort: 100 },
  categories: [
    {
      id: 'venue',
      name: 'Venue & Setup',
      description: 'Hall booking, furniture, lighting, and stage decoration',
      color: '#6366f1',
      minimumBudget: 15000,
      minimumTeam: 3,
      minimumEffort: 15,
    },
    {
      id: 'promotion',
      name: 'Promotion',
      description: 'Posters, social media, banners, and outreach',
      color: '#f59e0b',
      minimumBudget: 10000,
      minimumTeam: 2,
      minimumEffort: 10,
    },
    {
      id: 'technical',
      name: 'Technical Support',
      description: 'AV equipment, internet, laptops, and troubleshooting',
      color: '#3b82f6',
      minimumBudget: 8000,
      minimumTeam: 2,
      minimumEffort: 12,
    },
    {
      id: 'hospitality',
      name: 'Hospitality',
      description: 'Food, water, and attendee comfort',
      color: '#10b981',
      minimumBudget: 5000,
      minimumTeam: 2,
      minimumEffort: 8,
    },
    {
      id: 'registration',
      name: 'Registration',
      description: 'Entry desk, badges, check-in, and participant list',
      color: '#ec4899',
      minimumBudget: 3000,
      minimumTeam: 1,
      minimumEffort: 8,
    },
    {
      id: 'stage',
      name: 'Stage & Performances',
      description: 'Anchoring, MC, performances, and awards ceremony',
      color: '#8b5cf6',
      minimumBudget: 7000,
      minimumTeam: 2,
      minimumEffort: 10,
    },
    {
      id: 'contingency',
      name: 'Contingency',
      description: 'Emergency fund and buffer for unexpected needs',
      color: '#64748b',
      minimumBudget: 5000,
      minimumTeam: 1,
      minimumEffort: 5,
    },
  ],
}

// ── Scenario B — Student Startup Launch ───────────────────────────────────────

const SCENARIO_B: ResourceScenario = {
  id: 'startup-launch',
  title: 'Student Startup Launch',
  tagline: 'Take your student project from idea to launch',
  description:
    'Your student team has built a product and is ready to go public. You have seed funding, a small but skilled team, and a focused effort budget. Decide how to allocate resources across seven startup functions.',
  resources: { budget: 75000, team: 8, effort: 80 },
  categories: [
    {
      id: 'prototype',
      name: 'Prototype & Dev',
      description: 'Final product build, testing, and bug fixes',
      color: '#3b82f6',
      minimumBudget: 15000,
      minimumTeam: 2,
      minimumEffort: 20,
    },
    {
      id: 'design',
      name: 'Design & Branding',
      description: 'UI/UX, logo, pitch deck, and visual identity',
      color: '#8b5cf6',
      minimumBudget: 5000,
      minimumTeam: 1,
      minimumEffort: 12,
    },
    {
      id: 'marketing',
      name: 'Marketing',
      description: 'Social media, ads, content, and community outreach',
      color: '#f59e0b',
      minimumBudget: 8000,
      minimumTeam: 1,
      minimumEffort: 10,
    },
    {
      id: 'user-testing',
      name: 'User Testing',
      description: 'Feedback sessions, surveys, and iteration',
      color: '#10b981',
      minimumBudget: 3000,
      minimumTeam: 1,
      minimumEffort: 8,
    },
    {
      id: 'launch-event',
      name: 'Launch Event',
      description: 'Demo day, investor pitch, or public launch gathering',
      color: '#ec4899',
      minimumBudget: 10000,
      minimumTeam: 1,
      minimumEffort: 10,
    },
    {
      id: 'operations',
      name: 'Operations',
      description: 'Hosting, tools, subscriptions, and admin',
      color: '#6366f1',
      minimumBudget: 4000,
      minimumTeam: 0,
      minimumEffort: 8,
    },
    {
      id: 'contingency',
      name: 'Contingency',
      description: 'Reserve for surprises and pivots',
      color: '#64748b',
      minimumBudget: 4000,
      minimumTeam: 1,
      minimumEffort: 5,
    },
  ],
}

// ── Scenario C — Community Campaign ──────────────────────────────────────────

const SCENARIO_C: ResourceScenario = {
  id: 'community-campaign',
  title: 'Community Awareness Campaign',
  tagline: 'Run a social impact drive across five neighbourhoods',
  description:
    'Your student group is organising a community awareness campaign covering health, environment, and education. Resources are tight — you need to cover seven areas with a lean budget, a mid-sized volunteer team, and a capped effort pool.',
  resources: { budget: 50000, team: 15, effort: 70 },
  categories: [
    {
      id: 'materials',
      name: 'Materials & Supplies',
      description: 'Pamphlets, kits, posters, and awareness materials',
      color: '#10b981',
      minimumBudget: 8000,
      minimumTeam: 1,
      minimumEffort: 10,
    },
    {
      id: 'transportation',
      name: 'Transportation',
      description: 'Vehicle hire and travel costs across neighbourhoods',
      color: '#f59e0b',
      minimumBudget: 10000,
      minimumTeam: 2,
      minimumEffort: 8,
    },
    {
      id: 'awareness',
      name: 'Awareness Sessions',
      description: 'Talks, street plays, and interactive demos',
      color: '#6366f1',
      minimumBudget: 6000,
      minimumTeam: 2,
      minimumEffort: 12,
    },
    {
      id: 'coordination',
      name: 'Volunteer Coordination',
      description: 'Training, scheduling, and managing the team',
      color: '#3b82f6',
      minimumBudget: 4000,
      minimumTeam: 3,
      minimumEffort: 10,
    },
    {
      id: 'documentation',
      name: 'Documentation',
      description: 'Photography, video, reports, and social sharing',
      color: '#8b5cf6',
      minimumBudget: 3000,
      minimumTeam: 1,
      minimumEffort: 8,
    },
    {
      id: 'logistics',
      name: 'Logistics & Setup',
      description: 'Tents, mics, power, and on-ground setup',
      color: '#ec4899',
      minimumBudget: 5000,
      minimumTeam: 2,
      minimumEffort: 10,
    },
    {
      id: 'contingency',
      name: 'Contingency',
      description: 'Buffer for weather delays, cancellations, or extra needs',
      color: '#64748b',
      minimumBudget: 4000,
      minimumTeam: 1,
      minimumEffort: 5,
    },
  ],
}

export const RESOURCE_SCENARIOS: ResourceScenario[] = [SCENARIO_A, SCENARIO_B, SCENARIO_C]

// ── Events ────────────────────────────────────────────────────────────────────
// All deltas are verified safe: won't make any scenario's minimum requirements impossible.

export const SCENARIO_EVENTS: ScenarioEvent[] = [
  {
    id: 'budget-cut',
    label: 'Budget Cut',
    description:
      'A sponsor pulled out at the last minute. Your available budget drops by ₹10,000. Adjust your plan.',
    budgetDelta: -10000,
    teamDelta: 0,
    effortDelta: 0,
  },
  {
    id: 'team-loss',
    label: 'Team Dropout',
    description:
      'One volunteer had to drop out due to personal reasons. Your team size decreases by 1. Redistribute responsibilities.',
    budgetDelta: 0,
    teamDelta: -1,
    effortDelta: 0,
  },
  {
    id: 'effort-boost',
    label: 'Productivity Boost',
    description:
      'A nearby college offered to partner and contribute time. Your effort pool increases by 15 points.',
    budgetDelta: 0,
    teamDelta: 0,
    effortDelta: 15,
  },
  {
    id: 'budget-grant',
    label: 'Grant Received',
    description:
      'Your project was shortlisted for a community grant. An additional ₹8,000 has been added to your budget.',
    budgetDelta: 8000,
    teamDelta: 0,
    effortDelta: 0,
  },
]
