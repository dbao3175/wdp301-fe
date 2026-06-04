import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');
const JWT_SECRET = process.env.JWT_SECRET || 'manga_studio_super_secret_key_1337';

// Middleware
app.use(express.json());

// -------------------------------------------------------------------------
// DATABASE STORAGE & INITIALIZATION (SIMULATING MONGOOSE COLLECTION MODELS)
// -------------------------------------------------------------------------
interface DBState {
  users: any[];
  series: any[];
  chapters: any[];
  tasks: any[];
  ratings: any[];
  votes: any[];
  annotations: any[];
  pages: any[];
  assistantEarnings: any[];
}

const DEFAULT_USERS = [
  { _id: "u1", name: "Minh Tuấn (Mangaka)", email: "mangaka@example.com", role: "MANGAKA", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHg4AqOzqTV4dewyU1i46CaCUf4pdWEGhiU2lW3liCFs9JIde6fE9uwaRXVueKT86jIlGpymMPHJCh6-Coee4I6o2JxMGU-b-ts2Dmy6dKXtzK6RPgJ9XIL-1TYRm1JkqG8CkCx_ZgdB3cBNUUJyT9pvzu7uKesV0D55DoIMkLIv6PspHUrWtqKEj3H2tBogMUnEDiuCIIKF5mSpOCdwVfdskbQpvNQx3V_lA8OtcIk6q8LZ9AmfiRwuw0bF5K5naoU52pMuRXDiP2" },
  { _id: "u2", name: "Kenji Sato (Assistant)", email: "assistant@example.com", role: "ASSISTANT", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuByWi6Zl9Aq5qImGVzCM9dhGi2im5oNDHcYKm7_gdy-y_OSg-Pknn0o2Seu12-bt1ZlvW5mUwYsHbUzshmDVAh9HLeU2zsF4S5qvBZcASl2N4mHoV4QkyO3oaBVVg5I3WsU787UzwLfvdhrTVpYwQpRHM10fQ67X_0IXkIfhdkBbM5hGfouxY6d_0YEaDvNbGo2xqh8PeDhZhx73aSK3GLz-B8_C9WMamYLJXcYZShKrPQs9cA-qJJWPqKe3zVBhGuEz1CkezmEZARm" },
  { _id: "u3", name: "Mei Lin", email: "assistant2@example.com", role: "ASSISTANT", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDb75LL8ZWct7hOj_Lpk8YxqEv5BjlWa2mgnocgPm9ezXoHO2Eo7INteNIxv3zb59h68u5MrIsX4qE02NGXmancNIhDRjuLuw8cxldllyVXH8ZRRLi01owyzX7zHvC-NGEEnQuQDiF5_9C8BO2AJvtFze4KTeSuHEeW4eoMhlvbPbvZtfDUx1qbYDwAmHMmL2Wnf9Ue9jyCn5WnL98U1dHFJYXetVyECwx5fpaqDoerU6KxLWjbM5TxO2vJ4bceFRnggczcCiKg-8R0" },
  { _id: "u4", name: "Quốc Anh (Editor)", email: "editor@example.com", role: "EDITOR", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAVi7aFSbo-LyrCWDY1XT3sJ8w7jPP5GQRbTdz4nvQMQWPmEme3f92cnzxzIb7YzKn3JOkYN8m5-Z6Ek55flh7p2pvz3X5oM5-VpM-xDDxX4A--79wtyhSZ_J97mQJvZm82ptTfjkLRQvCyVJ1h0xoxsS_T8kHsj2bKKKC2BGIoTEB5uXKqQ-njmmYbZnSXJPOQhHkEcA-6DBmGAgsPaEj-M3_Nw0STUg5cJu56ITbBHbw9s3efEj4urYplhuRmgKwPmBMATWNqf5T-" },
  { _id: "u5", name: "Akihiro T. (Board)", email: "board@example.com", role: "BOARD_MEMBER", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuB-Y24_KFTU88hcNYomZqWcHloXlbLaqXPH9qMM3qQn4JMyBC7d50DZ4LmEG4B9uq6CvbDNBBtjvW5szNUZxcvPIZygGA_lUFjAmfd2czkfAVQnVQ4FHF4r5Y1oLYjls7Gc1pnSNvNU7Ovy_FjExXjNdDdxl2n8ncBlJSM8RV8AtaqfenpxoWuDukWYHrkD-fzzpdwugHREE3WTNbEbBHIlPgbjzVnKg_Uv_LCB5l4OO5vsDNgHwEsOH3yEkK1QkUfwYEWlnlWPHIoV" }
];

const DEFAULT_SERIES = [
  {
    _id: "s1",
    title: "Neon Genesis",
    synopsis: "In a post-apocalyptic future, young pilots navigate giant biomechanical suits to defend the remaining strongholds of humanity.",
    mangakaId: "u1",
    status: "IN_PRODUCTION",
    pubSchedule: "WEEKLY",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    _id: "s2",
    title: "Cyberpunk Drifter",
    synopsis: "A rogue courier with a bionic heart gets entangled in a corporate warfare while delivering a mysterious quantum flash drive.",
    mangakaId: "u1",
    status: "IN_PRODUCTION",
    pubSchedule: "MONTHLY",
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  },
  {
    _id: "s3",
    title: "Dragon's Ascent",
    synopsis: "A young monk sets off on a perilous mountain climb to awaken the final ancient dragon deity and break a centuries-old curse.",
    mangakaId: "u1",
    status: "APPROVED",
    pubSchedule: "MONTHLY",
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
  },
  {
    _id: "s4",
    title: "Neon Samurai",
    synopsis: "A synthesis of classical swordsmanship and futuristic neon augmentations in a neo-shogunate under siege by deep cybernetic invaders.",
    mangakaId: "u1",
    status: "PENDING",
    createdAt: new Date().toISOString()
  },
  {
    _id: "s5",
    title: "Whispering Petals",
    synopsis: "An elegant, heartwarming slice-of-life romance depicting two aspiring botanical artists finding their voice together in Tokyo.",
    mangakaId: "u1",
    status: "PENDING",
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_CHAPTERS = [
  { _id: "c1", seriesId: "s1", chapterNumber: 142, status: "IN_PROGRESS", deadline: "2026-06-12", dueAt: "2026-06-12" },
  { _id: "c2", seriesId: "s2", chapterNumber: 8, status: "IN_PROGRESS", deadline: "2026-06-10", dueAt: "2026-06-10" },
  { _id: "c3", seriesId: "s1", chapterNumber: 141, status: "COMPLETED", deadline: "2026-06-05", dueAt: "2026-06-05" },
  { _id: "c4", seriesId: "s3", chapterNumber: 42, status: "IN_PROGRESS", deadline: "2026-06-15", dueAt: "2026-06-15" }
];

const DEFAULT_TASKS = [
  { _id: "t1", seriesId: "s1", chapterId: "c1", assignedTo: "u2", assignedBy: "u1", title: "Shading Backgrounds on Page 12", status: "PENDING", region: { x: 50, y: 50, width: 300, height: 200, type: 'panel' }, pageIds: ["p1"] },
  { _id: "t2", seriesId: "s1", chapterId: "c1", assignedTo: "u2", assignedBy: "u1", title: "Adding Speed Lines to Action Panels", status: "PENDING", region: { x: 400, y: 50, width: 250, height: 250, type: 'panel' }, pageIds: ["p1"] },
  { _id: "t3", seriesId: "s2", chapterId: "c2", assignedTo: "u3", assignedBy: "u1", title: "Inking Character Face Detail, Chapter 8", status: "PENDING", region: { x: 100, y: 350, width: 200, height: 180, type: 'character' }, pageIds: ["p2"] },
  { _id: "t4", seriesId: "s1", chapterId: "c3", assignedTo: "u2", assignedBy: "u1", title: "Toning Background Scene 141", status: "COMPLETED", completedAt: new Date().toISOString(), pageIds: ["p3"] }
];

const DEFAULT_PAGES = [
  { _id: "p1", chapterId: "c1", pageNumber: 12, imageUrl: "none", assistantImageUrl: "none", status: "DRAFT", resources: [], note: "", reviewNote: "" },
  { _id: "p2", chapterId: "c2", pageNumber: 1, imageUrl: "none", assistantImageUrl: "none", status: "DRAFT", resources: [], note: "", reviewNote: "" },
  { _id: "p3", chapterId: "c3", pageNumber: 5, imageUrl: "none", assistantImageUrl: "none", status: "COMPLETED", resources: [], note: "", reviewNote: "" }
];

const DEFAULT_RATINGS = [
  { _id: "r1", seriesId: "s4", voteCount: 92450, source: "Web Platform", submittedBy: "u4", createdAt: new Date().toISOString() },
  { _id: "r2", seriesId: "s5", voteCount: 85120, source: "Mobile App", submittedBy: "u4", createdAt: new Date().toISOString() }
];

const DEFAULT_VOTES = [
  { _id: "v1", submissionId: "s4", voterId: "u5", decision: "ACCEPT", comment: "Outstanding plot line, highly recommended.", createdAt: new Date().toISOString() }
];

const DEFAULT_ANNOTATIONS = [
  { _id: "a1", pageId: "p1", annotatorId: "u4", coords: { x: 240, y: 140 }, content: "Pacing feels a bit rushed in this panel. Add more action line markers.", type: "CONTENT", createdAt: new Date().toISOString() }
];

const DEFAULT_EARNINGS = [
  {
    _id: "e1",
    assistantId: "u2",
    month: "2026-06",
    totalPagesApproved: 5,
    ratePerPage: 150,
    totalEarning: 750,
    approvedPages: [
      { pageId: "p3", chapterId: "c3", seriesId: "s1", approvedAt: new Date().toISOString() }
    ],
    paymentStatus: "PENDING"
  }
];

// -------------------------------------------------------------------------
// MONGOOSE SCHEMAS & MODELS FOR REAL MONGODB INTERFACING
// -------------------------------------------------------------------------
const userSchema = new mongoose.Schema({
  _id: String,
  name: String,
  email: { type: String, unique: true },
  password: { type: String, default: 'password123' },
  role: String,
  avatar: String
}, { _id: false, timestamps: true });

const seriesSchema = new mongoose.Schema({
  _id: String,
  title: String,
  synopsis: String,
  mangakaId: String,
  status: { type: String, default: 'PENDING' },
  pubSchedule: String,
  reviewedBy: String,
  reviewNote: String,
  reviewedAt: String
}, { _id: false, timestamps: true });

const chapterSchema = new mongoose.Schema({
  _id: String,
  seriesId: String,
  chapterNumber: Number,
  status: { type: String, default: 'IN_PROGRESS' },
  deadline: String,
  dueAt: String
}, { _id: false, timestamps: true });

const taskSchema = new mongoose.Schema({
  _id: String,
  seriesId: String,
  chapterId: String,
  assignedTo: String,
  assignedBy: String,
  title: String,
  status: { type: String, default: 'PENDING' },
  completedAt: String,
  region: mongoose.Schema.Types.Mixed,
  pageIds: [String]
}, { _id: false, timestamps: true });

const ratingSchema = new mongoose.Schema({
  _id: String,
  seriesId: String,
  voteCount: Number,
  source: String,
  submittedBy: String
}, { _id: false, timestamps: true });

const voteSchema = new mongoose.Schema({
  _id: String,
  submissionId: String,
  voterId: String,
  decision: String,
  comment: String
}, { _id: false, timestamps: true });

const annotationSchema = new mongoose.Schema({
  _id: String,
  pageId: String,
  annotatorId: String,
  coords: { x: Number, y: Number },
  content: String,
  type: { type: String, default: 'CONTENT' }
}, { _id: false, timestamps: true });

const pageSchema = new mongoose.Schema({
  _id: String,
  chapterId: String,
  pageNumber: Number,
  imageUrl: String,
  assistantImageUrl: String,
  status: { type: String, default: 'DRAFT' },
  resources: [mongoose.Schema.Types.Mixed],
  note: String,
  reviewNote: String
}, { _id: false, timestamps: true });

const earningSchema = new mongoose.Schema({
  _id: String,
  assistantId: String,
  month: String,
  totalPagesApproved: Number,
  ratePerPage: Number,
  totalEarning: Number,
  approvedPages: [mongoose.Schema.Types.Mixed],
  paymentStatus: { type: String, default: 'PENDING' }
}, { _id: false, timestamps: true });

const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
const SeriesModel = mongoose.models.Series || mongoose.model('Series', seriesSchema);
const ChapterModel = mongoose.models.Chapter || mongoose.model('Chapter', chapterSchema);
const TaskModel = mongoose.models.Task || mongoose.model('Task', taskSchema);
const RatingModel = mongoose.models.Rating || mongoose.model('Rating', ratingSchema);
const VoteModel = mongoose.models.Vote || mongoose.model('Vote', voteSchema);
const AnnotationModel = mongoose.models.Annotation || mongoose.model('Annotation', annotationSchema);
const PageModel = mongoose.models.Page || mongoose.model('Page', pageSchema);
const EarningModel = mongoose.models.Earning || mongoose.model('Earning', earningSchema);

// In-Memory Synchronized State Cache (Optimizes MongoDB query latency & resolves synchronous execution)
let g_dbCache: DBState | null = null;

async function syncToMongoDB(state: DBState) {
  if (mongoose.connection.readyState !== 1) return;
  try {
    // Clear and re-populate live MongoDB collections with the active state
    await UserModel.deleteMany({});
    await UserModel.insertMany(state.users as any[]);

    await SeriesModel.deleteMany({});
    await SeriesModel.insertMany(state.series as any[]);

    await ChapterModel.deleteMany({});
    await ChapterModel.insertMany(state.chapters as any[]);

    await TaskModel.deleteMany({});
    await TaskModel.insertMany(state.tasks as any[]);

    await RatingModel.deleteMany({});
    await RatingModel.insertMany(state.ratings as any[]);

    await VoteModel.deleteMany({});
    await VoteModel.insertMany(state.votes as any[]);

    await AnnotationModel.deleteMany({});
    await AnnotationModel.insertMany(state.annotations as any[]);

    await PageModel.deleteMany({});
    await PageModel.insertMany(state.pages as any[]);

    await EarningModel.deleteMany({});
    await EarningModel.insertMany(state.assistantEarnings as any[]);
  } catch (err: any) {
    console.error("❌ Failed to push synchronized memory state to MongoDB collections:", err.message);
  }
}

async function loadStateFromMongoDB() {
  try {
    const users = await UserModel.find().lean();
    const series = await SeriesModel.find().lean();
    const chapters = await ChapterModel.find().lean();
    const tasks = await TaskModel.find().lean();
    const ratings = await RatingModel.find().lean();
    const votes = await VoteModel.find().lean();
    const annotations = await AnnotationModel.find().lean();
    const pages = await PageModel.find().lean();
    const assistantEarnings = await EarningModel.find().lean();

    // Check if initial seed is required
    if (users.length === 0) {
      console.log("🌱 Database is unpopulated. Seeding default data to MongoDB...");
      await UserModel.insertMany(DEFAULT_USERS as any[]);
      await SeriesModel.insertMany(DEFAULT_SERIES as any[]);
      await ChapterModel.insertMany(DEFAULT_CHAPTERS as any[]);
      await TaskModel.insertMany(DEFAULT_TASKS as any[]);
      await RatingModel.insertMany(DEFAULT_RATINGS as any[]);
      await VoteModel.insertMany(DEFAULT_VOTES as any[]);
      await AnnotationModel.insertMany(DEFAULT_ANNOTATIONS as any[]);
      await PageModel.insertMany(DEFAULT_PAGES as any[]);
      await EarningModel.insertMany(DEFAULT_EARNINGS as any[]);
    }

    g_dbCache = {
      users: await UserModel.find().lean(),
      series: await SeriesModel.find().lean(),
      chapters: await ChapterModel.find().lean(),
      tasks: await TaskModel.find().lean(),
      ratings: await RatingModel.find().lean(),
      votes: await VoteModel.find().lean(),
      annotations: await AnnotationModel.find().lean(),
      pages: await PageModel.find().lean(),
      assistantEarnings: await EarningModel.find().lean(),
    };
    console.log("📊 System memory cache successfully pre-populated from live MongoDB!");
  } catch (err: any) {
    console.error("❌ Error while reading live collections from MongoDB:", err.message);
  }
}

function readDB(): DBState {
  if (mongoose.connection.readyState === 1 && g_dbCache) {
    return g_dbCache;
  }

  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to read schema DB file:", error);
  }

  // Fallback initial data structure setup
  const state: DBState = {
    users: DEFAULT_USERS,
    series: DEFAULT_SERIES,
    chapters: DEFAULT_CHAPTERS,
    tasks: DEFAULT_TASKS,
    ratings: DEFAULT_RATINGS,
    votes: DEFAULT_VOTES,
    annotations: DEFAULT_ANNOTATIONS,
    pages: DEFAULT_PAGES,
    assistantEarnings: DEFAULT_EARNINGS
  };
  writeDB(state);
  return state;
}

function writeDB(state: DBState) {
  g_dbCache = state;
  if (mongoose.connection.readyState === 1) {
    // Run async sync operation to MongoDB without blocking API threads
    syncToMongoDB(state);
  }

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error("Failed to write schema DB file:", error);
  }
}


// -------------------------------------------------------------------------
// JWT AUTHENTICATION MIDDLEWARE
// -------------------------------------------------------------------------
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authorization token not provided' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired authorization token' });
    }
    const db = readDB();
    const user = db.users.find(u => u._id === decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Staff user profile not found' });
    }
    req.user = user;
    next();
  });
};

// -------------------------------------------------------------------------
// ROUTE HANDLERS: AUTH SERVICES
// -------------------------------------------------------------------------
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and role' });
    }

    const db = readDB();
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered inside studio' });
    }

    const _id = `u_${Date.now()}`;
    const newUser = {
      _id,
      name,
      email,
      password: password || 'password123',
      role,
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHg4AqOzqTV4dewyU1i46CaCUf4pdWEGhiU2lW3liCFs9JIde6fE9uwaRXVueKT86jIlGpymMPHJCh6-Coee4I6o2JxMGU-b-ts2Dmy6dKXtzK6RPgJ9XIL-1TYRm1JkqG8CkCx_ZgdB3cBNUUJyT9pvzu7uKesV0D55DoIMkLIv6PspHUrWtqKEj3H2tBogMUnEDiuCIIKF5mSpOCdwVfdskbQpvNQx3V_lA8OtcIk6q8LZ9AmfiRwuw0bF5K5naoU52pMuRXDiP2"
    };

    db.users.push(newUser);
    writeDB(db);

    const token = jwt.sign({ id: _id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      success: true,
      data: { ...newUser, password: undefined, token }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email' });
    }

    const db = readDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email address or unlisted profile' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({
      success: true,
      data: { ...user, password: undefined, token }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
});

// -------------------------------------------------------------------------
// ROUTE HANDLERS: SERIES SERVICES
// -------------------------------------------------------------------------
app.post('/api/series', authenticateToken, (req: any, res) => {
  try {
    const { title, synopsis } = req.body;
    if (!title || !synopsis) {
      return res.status(400).json({ success: false, message: 'Missing title or synopsis' });
    }

    const db = readDB();
    const newSeries = {
      _id: `s_${Date.now()}`,
      title,
      synopsis,
      mangakaId: req.user._id,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    db.series.push(newSeries);
    writeDB(db);

    // Dynamic populate
    const mangaka = db.users.find(u => u._id === req.user._id);
    const populated = {
      ...newSeries,
      mangakaId: mangaka ? { _id: mangaka._id, name: mangaka.name, email: mangaka.email } : newSeries.mangakaId
    };

    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/series', authenticateToken, (req: any, res) => {
  try {
    const db = readDB();
    let result = [...db.series];

    const { status, mangakaId } = req.query;
    if (status) {
      result = result.filter(s => s.status === status);
    }
    if (mangakaId) {
      result = result.filter(s => s.mangakaId === mangakaId);
    }

    // Role level filtering if needed (e.g. Mangaka only sees their own series)
    if (req.user.role === 'MANGAKA') {
      result = result.filter(s => s.mangakaId === req.user._id);
    }

    // Populate mangakaId and reviewedBy
    const populated = result.map(s => {
      const creator = db.users.find(u => u._id === s.mangakaId);
      const reviewer = s.reviewedBy ? db.users.find(u => u._id === s.reviewedBy) : null;
      return {
        ...s,
        mangakaId: creator ? { _id: creator._id, name: creator.name, email: creator.email } : s.mangakaId,
        reviewedBy: reviewer ? { _id: reviewer._id, name: reviewer.name, email: reviewer.email } : s.reviewedBy
      };
    });

    res.status(200).json({ success: true, count: populated.length, data: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/series/:id', authenticateToken, (req, res) => {
  try {
    const db = readDB();
    const s = db.series.find(item => item._id === req.params.id);
    if (!s) {
      return res.status(404).json({ success: false, message: 'Series not found' });
    }

    const creator = db.users.find(u => u._id === s.mangakaId);
    const reviewer = s.reviewedBy ? db.users.find(u => u._id === s.reviewedBy) : null;
    const populated = {
      ...s,
      mangakaId: creator ? { _id: creator._id, name: creator.name, email: creator.email } : s.mangakaId,
      reviewedBy: reviewer ? { _id: reviewer._id, name: reviewer.name, email: reviewer.email } : s.reviewedBy
    };

    res.status(200).json({ success: true, data: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Editorial Board Series Review: Approve or Reject
app.put('/api/series/:id/review', authenticateToken, (req: any, res) => {
  try {
    const { action, note, pubSchedule } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be APPROVED or REJECTED" });
    }

    const db = readDB();
    const seriesIndex = db.series.findIndex(s => s._id === req.params.id);
    if (seriesIndex === -1) {
      return res.status(404).json({ success: false, message: 'Series not found' });
    }

    const series = db.series[seriesIndex];
    if (series.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Only PENDING series proposals can be reviewed' });
    }

    series.status = action;
    series.reviewedBy = req.user._id;
    series.reviewNote = note || '';
    series.reviewedAt = new Date().toISOString();

    if (action === 'APPROVED' && pubSchedule) {
      series.pubSchedule = pubSchedule;
    }

    db.series[seriesIndex] = series;
    writeDB(db);

    const creator = db.users.find(u => u._id === series.mangakaId);
    const reviewer = db.users.find(u => u._id === req.user._id);
    const populated = {
      ...series,
      mangakaId: creator ? { _id: creator._id, name: creator.name, email: creator.email } : series.mangakaId,
      reviewedBy: reviewer ? { _id: reviewer._id, name: reviewer.name, email: reviewer.email } : series.reviewedBy
    };

    res.status(200).json({ success: true, message: `Series evaluated to ${action}`, data: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// General purpose status transition (e.g. transition from Approved -> In Production -> Published)
app.put('/api/series/:id/status', authenticateToken, (req, res) => {
  try {
    const { status } = req.body;
    const validTransitions: Record<string, string[]> = {
      PENDING: ['APPROVED', 'REJECTED'],
      APPROVED: ['IN_PRODUCTION', 'CANCELLED'],
      IN_PRODUCTION: ['PUBLISHED', 'CANCELLED'],
      PUBLISHED: ['CANCELLED'],
      REJECTED: [],
      CANCELLED: []
    };

    const db = readDB();
    const seriesIndex = db.series.findIndex(s => s._id === req.params.id);
    if (seriesIndex === -1) {
      return res.status(404).json({ success: false, message: 'Series not found' });
    }

    const series = db.series[seriesIndex];
    const allowed = validTransitions[series.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition: '${series.status}' → '${status}'. Allowed: ${allowed.join(', ') || 'none'}`
      });
    }

    series.status = status;
    db.series[seriesIndex] = series;
    writeDB(db);

    res.status(200).json({ success: true, message: `Series status updated to ${status}`, data: series });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// -------------------------------------------------------------------------
// ROUTE HANDLERS: CHAPTER SERVICES
// -------------------------------------------------------------------------
app.get('/api/chapters', authenticateToken, (req, res) => {
  try {
    const { seriesId } = req.query;
    const db = readDB();
    let result = [...db.chapters];
    if (seriesId) {
      result = result.filter(c => c.seriesId === seriesId);
    }
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/chapters', authenticateToken, (req, res) => {
  try {
    const { seriesId, chapterNumber, deadline } = req.body;
    if (!seriesId || !chapterNumber || !deadline) {
      return res.status(400).json({ success: false, message: 'Missing seriesId, chapterNumber or deadline' });
    }

    const db = readDB();
    const newChapter = {
      _id: `c_${Date.now()}`,
      seriesId,
      chapterNumber: Number(chapterNumber),
      status: 'IN_PROGRESS',
      deadline,
      dueAt: deadline
    };

    db.chapters.push(newChapter);
    writeDB(db);

    res.status(201).json({ success: true, data: newChapter });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/chapters/:id', authenticateToken, (req, res) => {
  try {
    const db = readDB();
    const idx = db.chapters.findIndex(c => c._id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Chapter not found' });
    }

    db.chapters[idx] = { ...db.chapters[idx], ...req.body };
    writeDB(db);

    res.status(200).json({ success: true, data: db.chapters[idx] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/chapters/:id', authenticateToken, (req, res) => {
  try {
    const db = readDB();
    const initialLen = db.chapters.length;
    db.chapters = db.chapters.filter(c => c._id !== req.params.id);
    if (db.chapters.length === initialLen) {
      return res.status(404).json({ success: false, message: 'Chapter not found' });
    }
    writeDB(db);
    res.status(200).json({ success: true, message: 'Chapter deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// -------------------------------------------------------------------------
// ROUTE HANDLERS: TASKS SERVICES
// -------------------------------------------------------------------------
app.get('/api/tasks', authenticateToken, (req, res) => {
  try {
    const { userId } = req.query;
    const db = readDB();
    let result = [...db.tasks];
    if (userId) {
      result = result.filter(t => t.assignedTo === userId);
    }
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/tasks', authenticateToken, (req: any, res) => {
  try {
    const { seriesId, chapterId, assignedTo, title, region } = req.body;
    if (!seriesId || !chapterId || !assignedTo || !title) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const db = readDB();
    // Validate that assigned user is an ASSISTANT (optional, but robust)
    const assignee = db.users.find(u => u._id === assignedTo);
    if (!assignee) {
      return res.status(400).json({ success: false, message: 'Assigned staff user could not be mapped' });
    }

    const newTask = {
      _id: `t_${Date.now()}`,
      seriesId,
      chapterId,
      assignedTo,
      assignedBy: req.user._id,
      title,
      status: 'PENDING',
      region: region || null,
      pageIds: []
    };

    db.tasks.push(newTask);
    writeDB(db);

    res.status(201).json({ success: true, data: newTask });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/tasks/:id/submit', authenticateToken, (req, res) => {
  try {
    const db = readDB();
    const idx = db.tasks.findIndex(t => t._id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    db.tasks[idx].status = 'COMPLETED';
    db.tasks[idx].completedAt = new Date().toISOString();
    writeDB(db);

    res.status(200).json({ success: true, message: 'Task submitted', data: db.tasks[idx] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Supporting PUT endpoints for the Vietnamese BE controller (resilient API alias fallback)
app.put('/api/assistant/tasks/:taskId/submit', authenticateToken, (req, res) => {
  try {
    const db = readDB();
    const idx = db.tasks.findIndex(t => t._id === req.params.taskId);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    db.tasks[idx].status = 'SUBMITTED';
    db.tasks[idx].completedAt = new Date().toISOString();
    writeDB(db);

    res.status(200).json({ success: true, message: 'Task submitted', data: db.tasks[idx] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/assistant/my-tasks', authenticateToken, (req: any, res) => {
  try {
    const db = readDB();
    const myTasks = db.tasks.filter(t => t.assignedTo === req.user._id);

    // Populated
    const populated = myTasks.map(t => {
      const series = db.series.find(s => s._id === t.seriesId);
      const chapter = db.chapters.find(c => c._id === t.chapterId);
      return {
        ...t,
        seriesId: series ? { _id: series._id, title: series.title } : t.seriesId,
        chapterId: chapter ? { _id: chapter._id, chapterNumber: chapter.chapterNumber, title: `Chapter ${chapter.chapterNumber}` } : t.chapterId
      };
    });

    res.status(200).json({ success: true, count: populated.length, data: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// -------------------------------------------------------------------------
// ROUTE HANDLERS: VOTES AND BOARD PARTICIPATION
// -------------------------------------------------------------------------
app.post('/api/votes', authenticateToken, (req: any, res) => {
  try {
    const { submissionId, decision, comment } = req.body;
    if (!submissionId || !decision) {
      return res.status(400).json({ success: false, message: 'Submission ID and decision required' });
    }

    const db = readDB();
    const newVote = {
      _id: `v_${Date.now()}`,
      submissionId,
      voterId: req.user._id,
      decision,
      comment: comment || '',
      createdAt: new Date().toISOString()
    };

    db.votes.push(newVote);
    writeDB(db);

    res.status(201).json({ success: true, data: newVote });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/votes/submission/:submissionId', authenticateToken, (req, res) => {
  try {
    const db = readDB();
    const list = db.votes.filter(v => v.submissionId === req.params.submissionId);
    res.status(200).json({ success: true, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// -------------------------------------------------------------------------
// ROUTE HANDLERS: READER RATINGS & CALC RANKS
// -------------------------------------------------------------------------
app.get('/api/ratings', authenticateToken, (req, res) => {
  try {
    const db = readDB();
    res.status(200).json({ success: true, count: db.ratings.length, data: db.ratings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/ratings/:seriesId', authenticateToken, (req, res) => {
  try {
    const db = readDB();
    const list = db.ratings.filter(r => r.seriesId === req.params.seriesId);
    res.status(200).json({ success: true, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/ratings', authenticateToken, (req: any, res) => {
  try {
    const { seriesId, voteCount, source } = req.body;
    if (!seriesId || !voteCount) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const db = readDB();
    const newRating = {
      _id: `r_${Date.now()}`,
      seriesId,
      voteCount: Number(voteCount),
      source: source || 'External Ingestion',
      submittedBy: req.user._id,
      createdAt: new Date().toISOString()
    };

    db.ratings.push(newRating);
    writeDB(db);

    res.status(201).json({ success: true, data: newRating });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// -------------------------------------------------------------------------
// ROUTE HANDLERS: ANNOTATIONS & COMMENTS
// -------------------------------------------------------------------------
app.get('/api/annotations/page/:pageId', authenticateToken, (req, res) => {
  try {
    const db = readDB();
    const list = db.annotations.filter(a => a.pageId === req.params.pageId);
    res.status(200).json({ success: true, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/annotations', authenticateToken, (req: any, res) => {
  try {
    const { pageId, coords, content, type } = req.body;
    if (!pageId || !coords || !content || !type) {
      return res.status(400).json({ success: false, message: 'Missing pageId, coords, content, or type' });
    }

    const db = readDB();
    const newAnn = {
      _id: `ann_${Date.now()}`,
      pageId,
      annotatorId: req.user._id,
      coords,
      content,
      type,
      createdAt: new Date().toISOString()
    };

    db.annotations.push(newAnn);
    writeDB(db);

    res.status(201).json({ success: true, data: newAnn });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// -------------------------------------------------------------------------
// ROUTE HANDLERS: EDITOR METRICS & PROGRESS
// -------------------------------------------------------------------------
app.get('/api/editor/dashboard', authenticateToken, (req: any, res) => {
  try {
    const db = readDB();
    const editorId = req.user._id;

    // Filter series managed by editor or general (fallback)
    const mySeries = db.series.filter(s => s.status !== 'PENDING');
    const seriesIds = mySeries.map(s => s._id);

    const totalChapters = db.chapters.filter(c => seriesIds.includes(c.seriesId)).length;
    const upcoming = db.chapters.filter(c => seriesIds.includes(c.seriesId) && c.status !== 'COMPLETED');

    const nearDue = upcoming.map(c => {
      const s = db.series.find(item => item._id === c.seriesId);
      return {
        chapterId: c._id,
        seriesTitle: s ? s.title : 'Unknown Series',
        chapterNumber: c.chapterNumber,
        dueAt: c.deadline
      };
    });

    res.status(200).json({
      success: true,
      data: {
        seriesCount: mySeries.length,
        totalChapters,
        series: mySeries,
        deadlines: {
          overdueCount: 0,
          nearDueCount: nearDue.length,
          overdue: [],
          nearDue
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// -------------------------------------------------------------------------
// VITE MIDDLEWARE CONFIGURATION FOR STANDALONE DEV & BUILD SERVING
// -------------------------------------------------------------------------
async function startServer() {
  const uri = process.env.MONGODB_URI;
  if (uri) {
    console.log("🔌 Connecting to MongoDB clusters...");
    try {
      mongoose.set('strictQuery', false);
      await mongoose.connect(uri);
      console.log("✅ MongoDB Connected Successfully!");
      await loadStateFromMongoDB();
    } catch (err: any) {
      console.error("❌ Failed to connect to MongoDB on startup:", err.message);
      console.log("⚠️ Falling back to local file DB mode (db.json).");
    }
  } else {
    console.log("⚠️ MONGODB_URI not found in environment. Running in dual-redundant local file DB mode (db.json).");
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Full-stack unified server running on http://localhost:${PORT}`);
  });
}

startServer();
