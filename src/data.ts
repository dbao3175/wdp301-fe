/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Series, Chapter, Task, SeriesRank } from "./types";

export const MOCK_USERS: User[] = [
  {
    _id: "usr-oda",
    name: "Eiichiro Oda",
    email: "mangaka@test.com",
    role: "MANGAKA",
    avatar: "EO",
    token: "mock-token-oda"
  },
  {
    _id: "usr-loc",
    name: "Vũ Thiên Lộc (Editor-in-Chief)",
    email: "editor@test.com",
    role: "EDITOR",
    avatar: "TL",
    token: "mock-token-loc"
  },
  {
    _id: "usr-bao",
    name: "Đức Bảo (Board Director)",
    email: "board@test.com",
    role: "BOARD_MEMBER",
    avatar: "DB",
    token: "mock-token-bao"
  },
  {
    _id: "usr-chi",
    name: "Lan Chi (Lead Assistant)",
    email: "assistant@test.com",
    role: "ASSISTANT",
    avatar: "LC",
    token: "mock-token-chi"
  },
  {
    _id: "usr-minh",
    name: "Hoàng Minh (Beta Reader)",
    email: "assistant2@test.com",
    role: "ASSISTANT",
    avatar: "HM",
    token: "mock-token-minh"
  }
];

export const INITIAL_SERIES: Series[] = [
  {
    _id: "ser-op",
    title: "One Piece",
    synopsis: "Hành trình tìm kiếm kho báu One Piece của Luffy và đồng đội để trở thành Vua Hải Tặc.",
    mangakaId: { _id: "usr-oda", name: "Eiichiro Oda", email: "mangaka@test.com" },
    status: "IN_PRODUCTION",
    pubSchedule: "WEEKLY",
    reviewedBy: "usr-loc",
    reviewNote: "Dự án cực kỳ tiềm năng, duyệt phát hành hàng tuần!",
    reviewedAt: new Date(Date.now() - 3600 * 24 * 30 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3600 * 24 * 31 * 1000).toISOString()
  },
  {
    _id: "ser-jjk",
    title: "Jujutsu Kaisen",
    synopsis: "Cuộc chiến của Yuji Itadori chống lại những Chú Linh hắc ám sau khi nuốt ngón tay của Sukuna.",
    mangakaId: { _id: "usr-oda", name: "Eiichiro Oda", email: "mangaka@test.com" },
    status: "APPROVED",
    pubSchedule: "MONTHLY",
    reviewedBy: "usr-loc",
    createdAt: new Date(Date.now() - 3600 * 24 * 10 * 1000).toISOString()
  },
  {
    _id: "ser-sxf",
    title: "Spy x Family",
    synopsis: "Gia đình điệp viên giả vờ bao gồm Loid, Anya và Yor cùng thực hiện sứ mệnh gì bìn hòa bình thế giới.",
    mangakaId: { _id: "usr-oda", name: "Eiichiro Oda", email: "mangaka@test.com" },
    status: "PENDING",
    createdAt: new Date(Date.now() - 3600 * 24 * 2 * 1000).toISOString()
  }
];

export const INITIAL_CHAPTERS: Chapter[] = [
  { 
    _id: "chap-op-1", 
    seriesId: "ser-op", 
    chapterNumber: 1115, 
    title: "Chapter 1115: Khối Di Sản Thế Kỷ",
    status: "COMPLETED",
    dueAt: new Date(Date.now() - 3600 * 24 * 2 * 1000).toISOString()
  },
  { 
    _id: "chap-op-2", 
    seriesId: "ser-op", 
    chapterNumber: 1116, 
    title: "Chapter 1116: Mâu Thuẫn Thế Hệ",
    status: "IN_PROGRESS",
    dueAt: new Date(Date.now() + 3600 * 24 * 3 * 1000).toISOString()
  },
  { 
    _id: "chap-jjk-1", 
    seriesId: "ser-jjk", 
    chapterNumber: 261, 
    title: "Chapter 261: Phép Thuật Thần Sầu",
    status: "IN_PROGRESS",
    dueAt: new Date(Date.now() + 3600 * 24 * 7 * 1000).toISOString()
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    _id: "tsk-1",
    seriesId: "ser-op",
    chapterId: "chap-op-1",
    assignedTo: "usr-chi",
    title: "Dịch thô hội thoại tiếng Nhật sang tiếng Việt",
    status: "DONE",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    _id: "tsk-2",
    seriesId: "ser-op",
    chapterId: "chap-op-1",
    assignedTo: "usr-minh",
    title: "Chỉnh sửa câu cú bong bóng thoại tiếng Việt",
    status: "DONE",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    _id: "tsk-3",
    seriesId: "ser-op",
    chapterId: "chap-op-2",
    assignedTo: "usr-chi",
    title: "Dịch thô hội thoại Nhật-Việt Chap 1116",
    status: "PENDING",
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    _id: "tsk-4",
    seriesId: "ser-jjk",
    chapterId: "chap-jjk-1",
    assignedTo: "usr-chi",
    title: "Redraw nách truyện & xóa chữ Nhật gáy sách",
    status: "PENDING",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

export const INITIAL_RANKS: SeriesRank[] = [
  { _id: "rnk-1", seriesId: "ser-op", rank: 1, prevRank: 1, rankedOn: new Date().toISOString() },
  { _id: "rnk-2", seriesId: "ser-jjk", rank: 2, prevRank: 3, rankedOn: new Date().toISOString() },
  { _id: "rnk-3", seriesId: "ser-sxf", rank: 3, prevRank: null, rankedOn: new Date().toISOString() }
];

export const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "MANGAKA": return "bg-orange-100 text-orange-800 border-orange-200";
    case "EDITOR": return "bg-blue-100 text-blue-800 border-blue-200";
    case "BOARD_MEMBER": return "bg-purple-100 text-purple-800 border-purple-200";
    case "ASSISTANT": return "bg-teal-100 text-teal-800 border-teal-200";
    default: return "bg-zinc-100 text-zinc-800 border-zinc-200";
  }
};

export const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "PENDING": return "bg-zinc-100 text-zinc-800 border-zinc-200 ring-1 ring-zinc-300";
    case "APPROVED": return "bg-emerald-50 text-emerald-800 border-emerald-100 ring-1 ring-emerald-300";
    case "IN_PRODUCTION": return "bg-amber-50 text-amber-800 border-amber-100 ring-1 ring-amber-300";
    case "PUBLISHED": return "bg-blue-50 text-blue-800 border-blue-100 ring-1 ring-blue-300";
    case "REJECTED": return "bg-rose-50 text-rose-800 border-rose-100 ring-1 ring-rose-300";
    case "CANCELLED": return "bg-zinc-200 text-zinc-600 border-zinc-300";
    default: return "bg-zinc-100 text-zinc-600 border-zinc-200";
  }
};
