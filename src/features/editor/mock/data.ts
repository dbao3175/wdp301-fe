import type {
  Mangaka,
  Proposal,
  Series,
  Chapter,
  Annotation,
  ProductionLog,
  EditorialNote,
  RevisionHistory,
} from '../types/index.ts';

// =========================================================
// MANGAKA MOCK DATA
// =========================================================

export const mockMangakas: Mangaka[] = [
  {
    id: 'mk-001',
    name: 'Yuki Tanaka',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki',
    email: 'yuki.tanaka@mangastudio.jp',
    totalSeries: 3,
    joinedDate: '2022-04-15',
  },
  {
    id: 'mk-002',
    name: 'Ren Nakamura',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ren',
    email: 'ren.nakamura@mangastudio.jp',
    totalSeries: 5,
    joinedDate: '2021-09-01',
  },
  {
    id: 'mk-003',
    name: 'Aoi Sato',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aoi',
    email: 'aoi.sato@mangastudio.jp',
    totalSeries: 2,
    joinedDate: '2023-01-20',
  },
  {
    id: 'mk-004',
    name: 'Kaito Mori',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kaito',
    email: 'kaito.mori@mangastudio.jp',
    totalSeries: 4,
    joinedDate: '2020-06-30',
  },
  {
    id: 'mk-005',
    name: 'Hana Yoshida',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hana',
    email: 'hana.yoshida@mangastudio.jp',
    totalSeries: 1,
    joinedDate: '2024-02-10',
  },
];

// =========================================================
// PROPOSALS MOCK DATA
// =========================================================

export const mockProposals: Proposal[] = [
  {
    id: 'prop-001',
    title: 'Crimson Blade Chronicles',
    synopsis:
      'In a fractured world where ancient magic clashes with steam-powered technology, a disgraced swordsman named Kuro must reclaim his honor by hunting down the legendary Crimson Blade — a weapon said to grant its wielder absolute power, at the cost of their soul.',
    genre: 'Action',
    tags: ['Swordplay', 'Steampunk', 'Redemption', 'Magic'],
    mangaka: mockMangakas[0],
    submittedDate: '2026-05-20',
    lastUpdated: '2026-06-01',
    status: 'UNDER_REVIEW',
    storyDraft: {
      description:
        'Act 1 opens with Kuro waking in a ruined village. He discovers a mysterious map fragment pointing toward the Crimson Blade\'s last known location — the Iron Citadel of the Northern Wastelands. The journey introduces his rival, a ruthless mercenary named Sora, and his unlikely ally, a mechanical girl named Yomi who harbors the blade\'s first shard.',
      samplePages: [
        { id: 'sp-001', pageNumber: 1, imageUrl: 'https://picsum.photos/seed/page1/800/1200', caption: 'Opening spread — ruined village at dawn' },
        { id: 'sp-002', pageNumber: 2, imageUrl: 'https://picsum.photos/seed/page2/800/1200', caption: 'Kuro discovers the map fragment' },
        { id: 'sp-003', pageNumber: 3, imageUrl: 'https://picsum.photos/seed/page3/800/1200', caption: 'First encounter with Sora' },
        { id: 'sp-004', pageNumber: 4, imageUrl: 'https://picsum.photos/seed/page4/800/1200', caption: 'Yomi revealed — mechanical arm exposed' },
      ],
    },
    characterDesigns: [
      {
        id: 'cd-001',
        name: 'Kuro Ashida',
        role: 'Protagonist',
        description: 'Former elite swordsman, 24 years old. Wears a tattered black hakama. Right eye scarred from a past duel. Stoic but internally broken.',
        imageUrl: 'https://picsum.photos/seed/char1/400/600',
      },
      {
        id: 'cd-002',
        name: 'Sora Minami',
        role: 'Rival / Anti-Hero',
        description: 'Cold mercenary, 26 years old. Silver hair, crimson tattoo across her collarbone. Dual wields short blades. Goal: sell the Crimson Blade to the highest bidder.',
        imageUrl: 'https://picsum.photos/seed/char2/400/600',
      },
      {
        id: 'cd-003',
        name: 'Yomi',
        role: 'Ally / Mystery',
        description: 'Mechanical girl of unknown age. Left arm is a sophisticated steam-powered prosthetic. Gentle demeanor but hides immense combat capability.',
        imageUrl: 'https://picsum.photos/seed/char3/400/600',
      },
    ],
    reviewComments: [
      {
        id: 'rc-001',
        authorId: 'ed-001',
        authorName: 'Tanaka Hiroshi (Tantou)',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hiroshi',
        content: 'Strong visual concept. The steampunk-magic blend is commercially viable. Need more clarity on the power system — how does the Crimson Blade\'s soul cost work mechanically?',
        createdAt: '2026-06-01T10:30:00Z',
        isInternal: false,
      },
    ],
    assignedEditorId: 'ed-001',
    targetAudience: 'Shonen (ages 13-18)',
    estimatedChapters: 120,
    scheduledFrequency: 'Weekly',
  },
  {
    id: 'prop-002',
    title: 'Sakura Dreams',
    synopsis:
      'A slice-of-life story set in a quiet town where cherry blossoms bloom year-round due to a mysterious phenomenon. Follows three childhood friends navigating love, dreams, and the price of a wish granted by the spirit of the eternal sakura tree.',
    genre: 'Romance',
    tags: ['Slice of Life', 'Supernatural', 'Coming of Age', 'Nature'],
    mangaka: mockMangakas[1],
    submittedDate: '2026-05-28',
    lastUpdated: '2026-06-05',
    status: 'REVISION_REQUESTED',
    storyDraft: {
      description:
        'The story begins at the Sakura Festival. Three friends — Haru, Miu, and Sota — each secretly make a wish at the spirit tree. Unknown to them, the spirit heard all three wishes simultaneously. When the wishes begin manifesting in conflicting ways, the friends must navigate new feelings and unintended consequences.',
      samplePages: [
        { id: 'sp-005', pageNumber: 1, imageUrl: 'https://picsum.photos/seed/page5/800/1200', caption: 'The eternal sakura town — establishing shot' },
        { id: 'sp-006', pageNumber: 2, imageUrl: 'https://picsum.photos/seed/page6/800/1200', caption: 'The three friends at the festival' },
      ],
    },
    characterDesigns: [
      {
        id: 'cd-004',
        name: 'Haru Mizuki',
        role: 'Protagonist',
        description: 'Gentle 16-year-old boy. Artist who sketches the sakura. Harbors deep feelings for Miu but lacks courage to confess.',
        imageUrl: 'https://picsum.photos/seed/char4/400/600',
      },
      {
        id: 'cd-005',
        name: 'Miu Asahi',
        role: 'Love Interest / Rival',
        description: 'Bright and cheerful, 16. Dreams of becoming a musician. Oblivious to Haru\'s feelings; falls for an older student.',
        imageUrl: 'https://picsum.photos/seed/char5/400/600',
      },
    ],
    reviewComments: [
      {
        id: 'rc-002',
        authorId: 'ed-001',
        authorName: 'Tanaka Hiroshi (Tantou)',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hiroshi',
        content: 'The core concept is heartwarming but the supernatural element feels underdeveloped. Please provide more detail on the spirit tree\'s rules and limitations. Also, Sota\'s character needs a clearer arc.',
        createdAt: '2026-06-03T14:00:00Z',
        isInternal: false,
      },
    ],
    assignedEditorId: 'ed-001',
    targetAudience: 'Shoujo (ages 13-18)',
    estimatedChapters: 60,
    scheduledFrequency: 'Bi-weekly',
  },
  {
    id: 'prop-003',
    title: 'Neural Ghost',
    synopsis:
      'In 2087, humanity coexists with AI-driven androids. A cybercrime detective named Reiko discovers she herself is an android — with no memory of her creation. Her investigation into her own origins unravels a conspiracy that could redefine what it means to be human.',
    genre: 'Sci-Fi',
    tags: ['Cyberpunk', 'AI', 'Mystery', 'Thriller'],
    mangaka: mockMangakas[2],
    submittedDate: '2026-06-10',
    lastUpdated: '2026-06-10',
    status: 'SUBMITTED',
    storyDraft: {
      description:
        'Reiko is called to investigate a string of android murders. Each victim was erased from all records — as if they never existed. When she finds her own name on the hit list, the story escalates into a race for survival and identity.',
      samplePages: [
        { id: 'sp-007', pageNumber: 1, imageUrl: 'https://picsum.photos/seed/page7/800/1200', caption: 'Neo-Tokyo skyline at night' },
        { id: 'sp-008', pageNumber: 2, imageUrl: 'https://picsum.photos/seed/page8/800/1200', caption: 'Reiko at a crime scene' },
        { id: 'sp-009', pageNumber: 3, imageUrl: 'https://picsum.photos/seed/page9/800/1200', caption: 'The discovery — her model number' },
      ],
    },
    characterDesigns: [
      {
        id: 'cd-006',
        name: 'Reiko-7',
        role: 'Protagonist',
        description: 'Cybercrime detective, appears 28. Short silver hair, one eye replaced with a scanning lens. Methodical and detached — but gradually becomes more human.',
        imageUrl: 'https://picsum.photos/seed/char6/400/600',
      },
    ],
    reviewComments: [],
    assignedEditorId: 'ed-001',
    targetAudience: 'Seinen (ages 18+)',
    estimatedChapters: 80,
    scheduledFrequency: 'Weekly',
  },
  {
    id: 'prop-004',
    title: 'Iron Dragon Academy',
    synopsis:
      'At a prestigious martial arts academy hidden in the mountains, students compete not just for rankings but for the right to inherit the Iron Dragon technique — a style said to be unbeatable, but drives its user mad.',
    genre: 'Action',
    tags: ['Martial Arts', 'School Life', 'Tournament', 'Power System'],
    mangaka: mockMangakas[3],
    submittedDate: '2026-04-15',
    lastUpdated: '2026-05-30',
    status: 'APPROVED_BY_TANTOU',
    storyDraft: {
      description:
        'Ryu enters the academy as the lowest-ranked student. Through sheer willpower and a forbidden breathing technique, he begins climbing the ranks. As he gets closer to the Iron Dragon secret, he realizes the technique was never meant to be mastered — it was meant to be survived.',
      samplePages: [
        { id: 'sp-010', pageNumber: 1, imageUrl: 'https://picsum.photos/seed/page10/800/1200', caption: 'Academy entrance ceremony' },
        { id: 'sp-011', pageNumber: 2, imageUrl: 'https://picsum.photos/seed/page11/800/1200', caption: 'Ryu\'s first sparring match' },
      ],
    },
    characterDesigns: [
      {
        id: 'cd-007',
        name: 'Ryu Hayashi',
        role: 'Protagonist',
        description: 'Fiery 15-year-old, lowest rank on entry. Wild dark hair, always bandaged knuckles. Stubborn to a fault, but his instincts are extraordinary.',
        imageUrl: 'https://picsum.photos/seed/char7/400/600',
      },
    ],
    reviewComments: [
      {
        id: 'rc-003',
        authorId: 'ed-001',
        authorName: 'Tanaka Hiroshi (Tantou)',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hiroshi',
        content: 'Excellent potential. The tournament arc structure is solid. Approved for submission to the Editorial Board.',
        createdAt: '2026-05-30T09:00:00Z',
        isInternal: false,
      },
    ],
    assignedEditorId: 'ed-001',
    targetAudience: 'Shonen (ages 13-18)',
    estimatedChapters: 200,
    scheduledFrequency: 'Weekly',
  },
  {
    id: 'prop-005',
    title: 'Midnight Café',
    synopsis:
      'A mystical café that only appears between midnight and 3 AM serves as the setting for interconnected stories of lonely souls. Each chapter follows a different visitor, their regrets, and the strange barista who always knows exactly what they need.',
    genre: 'Slice of Life',
    tags: ['Anthology', 'Supernatural', 'Healing', 'Vignette'],
    mangaka: mockMangakas[4],
    submittedDate: '2026-06-12',
    lastUpdated: '2026-06-12',
    status: 'SUBMITTED',
    storyDraft: {
      description:
        'Volume 1 covers 8 visitors — from a grieving father to a young woman who can\'t stop running. Each story is self-contained but hints at a larger mystery: who is the barista, and why does the café exist?',
      samplePages: [
        { id: 'sp-012', pageNumber: 1, imageUrl: 'https://picsum.photos/seed/page12/800/1200', caption: 'The café materializes — foggy street' },
        { id: 'sp-013', pageNumber: 2, imageUrl: 'https://picsum.photos/seed/page13/800/1200', caption: 'First visitor enters' },
      ],
    },
    characterDesigns: [
      {
        id: 'cd-008',
        name: 'The Barista',
        role: 'Enigmatic Host',
        description: 'Ageless appearance. Long white braid, half-moon glasses. Never speaks above a whisper. Knows every customer\'s order before they ask.',
        imageUrl: 'https://picsum.photos/seed/char8/400/600',
      },
    ],
    reviewComments: [],
    assignedEditorId: 'ed-001',
    targetAudience: 'Josei (ages 18-30)',
    estimatedChapters: 50,
    scheduledFrequency: 'Monthly',
  },
];

// =========================================================
// CHAPTERS MOCK DATA
// =========================================================

export const mockChapters: Chapter[] = [
  {
    id: 'ch-001',
    seriesId: 'series-001',
    chapterNumber: 1,
    title: 'The Ruined Village',
    status: 'PUBLISHED',
    submittedDate: '2026-01-05',
    lastUpdated: '2026-01-15',
    pages: [],
    totalPages: 24,
    votes: 4820,
    reviewNotes: 'Strong opening chapter. Panel composition is excellent.',
    deadline: '2026-01-10',
    mangakaName: 'Yuki Tanaka',
  },
  {
    id: 'ch-002',
    seriesId: 'series-001',
    chapterNumber: 2,
    title: 'The Iron Road',
    status: 'PUBLISHED',
    submittedDate: '2026-01-19',
    lastUpdated: '2026-01-28',
    pages: [],
    totalPages: 22,
    votes: 5140,
    reviewNotes: 'Pacing improved. The Sora reveal lands perfectly.',
    deadline: '2026-01-24',
    mangakaName: 'Yuki Tanaka',
  },
  {
    id: 'ch-003',
    seriesId: 'series-001',
    chapterNumber: 3,
    title: 'Yomi\'s Secret',
    status: 'PUBLISHED',
    submittedDate: '2026-02-02',
    lastUpdated: '2026-02-10',
    pages: [],
    totalPages: 26,
    votes: 6230,
    reviewNotes: 'Best chapter yet. Yomi backstory hits emotionally.',
    deadline: '2026-02-07',
    mangakaName: 'Yuki Tanaka',
  },
  {
    id: 'ch-004',
    seriesId: 'series-001',
    chapterNumber: 4,
    title: 'Into the Wastes',
    status: 'PUBLISHED',
    submittedDate: '2026-02-16',
    lastUpdated: '2026-02-24',
    pages: [],
    totalPages: 24,
    votes: 5980,
    reviewNotes: '',
    deadline: '2026-02-21',
    mangakaName: 'Yuki Tanaka',
  },
  {
    id: 'ch-005',
    seriesId: 'series-001',
    chapterNumber: 5,
    title: 'First Blood',
    status: 'PUBLISHED',
    submittedDate: '2026-03-02',
    lastUpdated: '2026-03-10',
    pages: [],
    totalPages: 28,
    votes: 7450,
    reviewNotes: 'Action sequence outstanding.',
    deadline: '2026-03-07',
    mangakaName: 'Yuki Tanaka',
  },
  {
    id: 'ch-006',
    seriesId: 'series-001',
    chapterNumber: 6,
    title: 'The Blade Calls',
    status: 'UNDER_REVIEW',
    submittedDate: '2026-06-10',
    lastUpdated: '2026-06-10',
    pages: Array.from({ length: 24 }, (_, i) => ({
      id: `page-ch006-${i + 1}`,
      pageNumber: i + 1,
      imageUrl: `https://picsum.photos/seed/manga${i + 1}/800/1200`,
      annotations: i === 2 ? [
        {
          id: `ann-001`,
          chapterId: 'ch-006',
          pageNumber: 3,
          x: 30,
          y: 45,
          category: 'DIALOGUE_ISSUE' as const,
          comment: 'The dialogue here feels too expository. Consider breaking this into a more natural conversation across panels.',
          authorName: 'Tanaka Hiroshi (Tantou)',
          authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hiroshi',
          createdAt: '2026-06-11T09:00:00Z',
          resolved: false,
        },
      ] : i === 7 ? [
        {
          id: `ann-002`,
          chapterId: 'ch-006',
          pageNumber: 8,
          x: 65,
          y: 30,
          category: 'SCENE_IMPROVEMENT' as const,
          comment: 'The fight choreography in this panel is unclear. Redraw the sword trajectory — reader cannot follow the action.',
          authorName: 'Tanaka Hiroshi (Tantou)',
          authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hiroshi',
          createdAt: '2026-06-11T09:15:00Z',
          resolved: false,
        },
      ] : [],
    })),
    totalPages: 24,
    votes: 0,
    reviewNotes: '',
    deadline: '2026-06-15',
    mangakaName: 'Yuki Tanaka',
  },
  // Series 002 chapters
  {
    id: 'ch-101',
    seriesId: 'series-002',
    chapterNumber: 1,
    title: 'Enter the Academy',
    status: 'PUBLISHED',
    submittedDate: '2026-02-01',
    lastUpdated: '2026-02-10',
    pages: [],
    totalPages: 22,
    votes: 3200,
    reviewNotes: '',
    deadline: '2026-02-05',
    mangakaName: 'Kaito Mori',
  },
  {
    id: 'ch-102',
    seriesId: 'series-002',
    chapterNumber: 2,
    title: 'The Iron Trial',
    status: 'UNDER_REVIEW',
    submittedDate: '2026-06-08',
    lastUpdated: '2026-06-08',
    pages: Array.from({ length: 20 }, (_, i) => ({
      id: `page-ch102-${i + 1}`,
      pageNumber: i + 1,
      imageUrl: `https://picsum.photos/seed/manga${i + 50}/800/1200`,
      annotations: [],
    })),
    totalPages: 20,
    votes: 0,
    reviewNotes: '',
    deadline: '2026-06-12',
    mangakaName: 'Kaito Mori',
  },
];

// =========================================================
// PRODUCTION LOGS MOCK DATA
// =========================================================

export const mockProductionLogs: ProductionLog[] = [
  {
    id: 'log-001',
    seriesId: 'series-001',
    stage: 'LINE_ART',
    description: 'Chapter 6 line art completed. Ready for coloring phase.',
    authorName: 'Yuki Tanaka',
    createdAt: '2026-06-08T10:00:00Z',
    completionPercentage: 65,
  },
  {
    id: 'log-002',
    seriesId: 'series-001',
    stage: 'STORYBOARD',
    description: 'Chapter 7 storyboard draft submitted for editor review.',
    authorName: 'Yuki Tanaka',
    createdAt: '2026-06-05T14:30:00Z',
    completionPercentage: 60,
  },
  {
    id: 'log-003',
    seriesId: 'series-001',
    stage: 'DRAFT',
    description: 'Chapter 6 initial draft approved. Proceeding to line art.',
    authorName: 'Tanaka Hiroshi (Tantou)',
    createdAt: '2026-05-28T09:00:00Z',
    completionPercentage: 55,
  },
];

// =========================================================
// EDITORIAL NOTES MOCK DATA
// =========================================================

export const mockEditorialNotes: EditorialNote[] = [
  {
    id: 'en-001',
    seriesId: 'series-001',
    content: 'The series is performing exceptionally well. Editorial Board requests maintaining the current pacing and action-to-drama ratio.',
    authorName: 'Editorial Board',
    createdAt: '2026-05-15T10:00:00Z',
    isImportant: true,
  },
  {
    id: 'en-002',
    seriesId: 'series-001',
    content: 'Consider a special illustration page for Chapter 10 anniversary.',
    authorName: 'Tanaka Hiroshi (Tantou)',
    createdAt: '2026-06-01T11:00:00Z',
    isImportant: false,
  },
];

// =========================================================
// REVISION HISTORY MOCK DATA
// =========================================================

export const mockRevisionHistory: RevisionHistory[] = [
  {
    id: 'rev-001',
    seriesId: 'series-001',
    chapterId: 'ch-003',
    description: 'Page 12 panel layout needs revision. The action flow is confusing for readers.',
    requestedBy: 'Tanaka Hiroshi (Tantou)',
    requestedAt: '2026-02-06T10:00:00Z',
    resolvedAt: '2026-02-08T14:00:00Z',
    status: 'RESOLVED',
  },
  {
    id: 'rev-002',
    seriesId: 'series-001',
    chapterId: 'ch-006',
    description: 'Dialogue on page 3 needs rewrite for better natural flow.',
    requestedBy: 'Tanaka Hiroshi (Tantou)',
    requestedAt: '2026-06-11T09:00:00Z',
    status: 'PENDING',
  },
];

// =========================================================
// SERIES MOCK DATA
// =========================================================

export const mockSeries: Series[] = [
  {
    id: 'series-001',
    title: 'Crimson Blade Chronicles',
    synopsis:
      'In a fractured world where ancient magic clashes with steam-powered technology, a disgraced swordsman named Kuro must reclaim his honor by hunting down the legendary Crimson Blade.',
    genre: 'Action',
    tags: ['Swordplay', 'Steampunk', 'Redemption', 'Magic'],
    coverUrl: 'https://picsum.photos/seed/cover1/400/560',
    mangaka: mockMangakas[0],
    assignedEditorId: 'ed-001',
    status: 'ACTIVE',
    currentStage: 'LINE_ART',
    completionPercentage: 65,
    deadline: '2026-07-15',
    remainingDays: 27,
    totalChapters: 120,
    publishedChapters: 5,
    currentRanking: 3,
    previousRanking: 5,
    totalVotes: 29620,
    averageVotesPerChapter: 5924,
    highestVotedChapter: 'Chapter 5: First Blood',
    latestChapterVotes: 7450,
    startDate: '2026-01-01',
    chapters: mockChapters.filter(c => c.seriesId === 'series-001'),
    productionLogs: mockProductionLogs.filter(l => l.seriesId === 'series-001'),
    editorialNotes: mockEditorialNotes.filter(n => n.seriesId === 'series-001'),
    revisionHistory: mockRevisionHistory.filter(r => r.seriesId === 'series-001'),
    rankingHistory: [
      { week: 'Week 1', rank: 12 },
      { week: 'Week 2', rank: 9 },
      { week: 'Week 3', rank: 7 },
      { week: 'Week 4', rank: 5 },
      { week: 'Week 5', rank: 4 },
      { week: 'Week 6', rank: 3 },
    ],
    voteHistory: [
      { chapter: 'Ch.1', votes: 4820 },
      { chapter: 'Ch.2', votes: 5140 },
      { chapter: 'Ch.3', votes: 6230 },
      { chapter: 'Ch.4', votes: 5980 },
      { chapter: 'Ch.5', votes: 7450 },
    ],
    progressHistory: [
      { month: 'Jan', chaptersCompleted: 2, target: 4 },
      { month: 'Feb', chaptersCompleted: 2, target: 4 },
      { month: 'Mar', chaptersCompleted: 1, target: 4 },
      { month: 'Apr', chaptersCompleted: 0, target: 4 },
      { month: 'May', chaptersCompleted: 0, target: 4 },
      { month: 'Jun', chaptersCompleted: 0, target: 4 },
    ],
  },
  {
    id: 'series-002',
    title: 'Iron Dragon Academy',
    synopsis:
      'At a prestigious martial arts academy hidden in the mountains, students compete for the right to inherit the Iron Dragon technique.',
    genre: 'Action',
    tags: ['Martial Arts', 'School Life', 'Tournament', 'Power System'],
    coverUrl: 'https://picsum.photos/seed/cover2/400/560',
    mangaka: mockMangakas[3],
    assignedEditorId: 'ed-001',
    status: 'ACTIVE',
    currentStage: 'STORYBOARD',
    completionPercentage: 40,
    deadline: '2026-06-30',
    remainingDays: 12,
    totalChapters: 200,
    publishedChapters: 1,
    currentRanking: 8,
    previousRanking: 10,
    totalVotes: 3200,
    averageVotesPerChapter: 3200,
    highestVotedChapter: 'Chapter 1: Enter the Academy',
    latestChapterVotes: 3200,
    startDate: '2026-02-01',
    chapters: mockChapters.filter(c => c.seriesId === 'series-002'),
    productionLogs: [],
    editorialNotes: [],
    revisionHistory: [],
    rankingHistory: [
      { week: 'Week 1', rank: 15 },
      { week: 'Week 2', rank: 12 },
      { week: 'Week 3', rank: 10 },
      { week: 'Week 4', rank: 8 },
    ],
    voteHistory: [
      { chapter: 'Ch.1', votes: 3200 },
    ],
    progressHistory: [
      { month: 'Feb', chaptersCompleted: 1, target: 3 },
      { month: 'Mar', chaptersCompleted: 0, target: 3 },
      { month: 'Apr', chaptersCompleted: 0, target: 3 },
    ],
  },
  {
    id: 'series-003',
    title: 'Void Walker',
    synopsis:
      'A celestial hunter crosses dimensions to capture escaped void creatures threatening the balance of parallel realities.',
    genre: 'Fantasy',
    tags: ['Dimension Travel', 'Monsters', 'Action', 'Mystery'],
    coverUrl: 'https://picsum.photos/seed/cover3/400/560',
    mangaka: mockMangakas[1],
    assignedEditorId: 'ed-001',
    status: 'ON_HIATUS',
    currentStage: 'STORY_PLANNING',
    completionPercentage: 20,
    deadline: '2026-09-01',
    remainingDays: 75,
    totalChapters: 90,
    publishedChapters: 3,
    currentRanking: 22,
    previousRanking: 18,
    totalVotes: 8900,
    averageVotesPerChapter: 2967,
    highestVotedChapter: 'Chapter 2: The Void Gate',
    latestChapterVotes: 2100,
    startDate: '2025-11-01',
    chapters: [],
    productionLogs: [],
    editorialNotes: [],
    revisionHistory: [],
    rankingHistory: [
      { week: 'Week 1', rank: 8 },
      { week: 'Week 2', rank: 10 },
      { week: 'Week 3', rank: 15 },
      { week: 'Week 4', rank: 18 },
      { week: 'Week 5', rank: 22 },
    ],
    voteHistory: [
      { chapter: 'Ch.1', votes: 3400 },
      { chapter: 'Ch.2', votes: 3400 },
      { chapter: 'Ch.3', votes: 2100 },
    ],
    progressHistory: [
      { month: 'Nov', chaptersCompleted: 2, target: 4 },
      { month: 'Dec', chaptersCompleted: 1, target: 4 },
      { month: 'Jan', chaptersCompleted: 0, target: 4 },
    ],
  },
];

// =========================================================
// DASHBOARD STATS MOCK DATA
// =========================================================

export const mockDashboardStats = {
  activeSeries: 2,
  pendingProposals: 2,
  pendingChapterReviews: 2,
  upcomingDeadlines: 2,
  delayedProjects: 1,
  topRankedSeries: [mockSeries[0], mockSeries[1]],
  mostVotedSeries: [mockSeries[0], mockSeries[2]],
};

export const mockDeadlines = [
  {
    id: 'dl-001',
    title: 'Crimson Blade Ch.6 Review',
    seriesTitle: 'Crimson Blade Chronicles',
    type: 'chapter_review' as const,
    dueDate: '2026-06-15',
    daysRemaining: 3,
    priority: 'HIGH' as const,
  },
  {
    id: 'dl-002',
    title: 'Iron Dragon Ch.2 Review',
    seriesTitle: 'Iron Dragon Academy',
    type: 'chapter_review' as const,
    dueDate: '2026-06-12',
    daysRemaining: 0,
    priority: 'CRITICAL' as const,
  },
  {
    id: 'dl-003',
    title: 'Series Production Checkpoint',
    seriesTitle: 'Iron Dragon Academy',
    type: 'production' as const,
    dueDate: '2026-06-30',
    daysRemaining: 12,
    priority: 'MEDIUM' as const,
  },
];
