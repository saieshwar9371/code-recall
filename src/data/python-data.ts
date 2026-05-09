export type Difficulty = 'foundational' | 'developing' | 'proficient';

export interface Milestone {
  id: string;
  difficulty: Difficulty;
  title: string;
  description: string;
  isCompleted: boolean;
  isLocked: boolean;
  masteryWeight: number;
}

export interface Session {
  id: string;
  title: string;
  description: string;
  order: number;
  milestones: Milestone[];
  isCompleted: boolean;
  isLocked: boolean;
  completionPct: number;
}

export const PYTHON_CURRICULUM: Session[] = [
  {
    id: 'programming-foundations',
    title: 'Python Foundations',
    description:
      'Python onboarding: ideas, software, syntax, print(), calculator mode, variables, I/O, strings, len(), indexing — with focused comprehension challenges.',
    order: 1,
    isCompleted: false,
    isLocked: false,
    completionPct: 0,
    milestones: [
      { id: 'pb-foundational', difficulty: 'foundational', masteryWeight: 1, title: 'Core Concepts', description: 'Understand what programming is and how Python works.', isCompleted: false, isLocked: false },
      { id: 'pb-developing',   difficulty: 'developing',   masteryWeight: 2, title: 'Variables & Types',  description: 'Store and manipulate data with variables and types.', isCompleted: false, isLocked: true },
      { id: 'pb-proficient',   difficulty: 'proficient',   masteryWeight: 3, title: 'Applied Practice', description: 'Combine all concepts to solve multi-step problems.', isCompleted: false, isLocked: true },
    ]
  },
  {
    id: 'logic-decision-making',
    title: 'Logic & Decision Making',
    description: 'Master type conversion, string slicing, relational operators, and conditional decision-making.',
    order: 2,
    isCompleted: false,
    isLocked: true,
    completionPct: 0,
    milestones: [
      { id: 'ldm-foundational', difficulty: 'foundational', masteryWeight: 1, title: 'Types & Slicing', description: 'Master type casting and advanced string slicing.', isCompleted: false, isLocked: true },
      { id: 'ldm-developing',   difficulty: 'developing',   masteryWeight: 2, title: 'Boolean Logic',   description: 'Relational operators and boolean algebra (and/or/not).', isCompleted: false, isLocked: true },
      { id: 'ldm-proficient',   difficulty: 'proficient',   masteryWeight: 3, title: 'Decision Making', description: 'Master if/elif/else and nested conditions.', isCompleted: false, isLocked: true },
    ]
  },
  {
    id: 'loops',
    title: 'Loops',
    description: 'Repeat actions with for and while loops, mastering iteration patterns.',
    order: 3,
    isCompleted: false,
    isLocked: true,
    completionPct: 0,
    milestones: [
      { id: 'lp-foundational', difficulty: 'foundational', masteryWeight: 1, title: 'While Loops', description: 'Repeat code while a condition holds true.', isCompleted: false, isLocked: true },
      { id: 'lp-developing',   difficulty: 'developing',   masteryWeight: 2, title: 'For Loops',   description: 'Iterate over ranges and sequences.', isCompleted: false, isLocked: true },
      { id: 'lp-proficient',   difficulty: 'proficient',   masteryWeight: 3, title: 'Loop Control', description: 'Use break and continue to control flow.', isCompleted: false, isLocked: true },
    ]
  },
  {
    id: 'functions',
    title: 'Functions',
    description: 'Write reusable, well-structured blocks of logic with functions.',
    order: 4,
    isCompleted: false,
    isLocked: true,
    completionPct: 0,
    milestones: [
      { id: 'fn-foundational', difficulty: 'foundational', masteryWeight: 1, title: 'Defining Functions', description: 'Create your first reusable code blocks.', isCompleted: false, isLocked: true },
      { id: 'fn-developing',   difficulty: 'developing',   masteryWeight: 2, title: 'Parameters',        description: 'Pass data into functions with arguments.', isCompleted: false, isLocked: true },
      { id: 'fn-proficient',   difficulty: 'proficient',   masteryWeight: 3, title: 'Return Values',     description: 'Get structured results back from functions.', isCompleted: false, isLocked: true },
    ]
  }
];
