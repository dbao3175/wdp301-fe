/**
 * AssistantIncome.tsx
 * Thống kê thu nhập dành cho Assistant
 */

import React from 'react';
import { AssistantTask } from './assistantTypes';
import { APPROVED_TASKS } from './assistantMockData';
import {
  Wallet,
  TrendingUp,
  CheckCircle2,
  Calendar,
  CreditCard,
  ChevronRight,
  Download
} from 'lucide-react';

export default function AssistantIncome() {
  // Tính tổng thu nhập
  const totalEarnings = APPROVED_TASKS.reduce(
    (sum, task) => sum + (task.earnings || 0),
    0
  );

  // Giả lập dữ liệu thu nhập các tháng gần đây
  const monthlyData = [
    { month: 'Apr', amount: 32000 },
    { month: 'May', amount: 45500 },
    { month: 'Jun', amount: totalEarnings },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 bg-[#121214] text-white">
      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white uppercase tracking-wide flex items-center gap-2">
          <Wallet className="w-5 h-5 text-red-500" />
          Income & Earnings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Track your completed tasks and payment history.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Khối thống kê tổng quan ── */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Thẻ Tổng thu nhập tháng */}
            <div className="bg-[#1e1e24] border border-[#2d2d34] rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Wallet className="w-16 h-16" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                This Month's Earnings
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-medium text-slate-400">¥</span>
                <span className="text-3xl font-bold text-white">
                  {totalEarnings.toLocaleString()}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] text-green-400 bg-green-400/10 w-fit px-2 py-1 rounded-md">
                <TrendingUp className="w-3 h-3" />
                <span>+18% from last month</span>
              </div>
            </div>

            {/* Thẻ Task Hoàn Thành */}
            <div className="bg-[#1e1e24] border border-[#2d2d34] rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <CheckCircle2 className="w-16 h-16" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Completed Tasks
              </p>
              <div className="text-3xl font-bold text-white">
                {APPROVED_TASKS.length}
              </div>
              <p className="text-[11px] text-slate-500 mt-4">
                Paid tasks this billing cycle
              </p>
            </div>

            {/* Thẻ Chờ thanh toán */}
            <div className="bg-[#1e1e24] border border-[#2d2d34] rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Calendar className="w-16 h-16" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Next Payout
              </p>
              <div className="text-xl font-bold text-white">Jul 5, 2024</div>
              <div className="mt-2 w-full bg-[#2d2d34] rounded-full h-1.5">
                <div className="bg-red-500 h-1.5 rounded-full w-[70%]"></div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Processing to Bank ****1234
              </p>
            </div>
          </div>

          {/* ── Bảng Lịch sử thu nhập chi tiết ── */}
          <div className="bg-[#1e1e24] border border-[#2d2d34] rounded-xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[#2d2d34] flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                Recent Earnings History
              </h2>
              <button className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer">
                <Download className="w-3.5 h-3.5" /> Export PDF
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#121214] text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-5 py-3 font-medium">Task</th>
                    <th className="px-5 py-3 font-medium hidden sm:table-cell">Series</th>
                    <th className="px-5 py-3 font-medium hidden md:table-cell">Approved Date</th>
                    <th className="px-5 py-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2d2d34]">
                  {APPROVED_TASKS.map((task: AssistantTask) => (
                    <tr key={task._id} className="hover:bg-[#2d2d34]/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-white">{task.title}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{task._id}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell text-slate-400">
                        {task.series}
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell text-slate-400">
                        {task.approvedAt
                          ? new Date(task.approvedAt).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="font-bold text-green-400">
                          +¥{(task.earnings || 0).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Dòng Total */}
                  <tr className="bg-[#121214]/50">
                    <td colSpan={3} className="px-5 py-3.5 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden sm:table-cell">
                      Total
                    </td>
                    <td className="px-5 py-3.5 text-right text-base font-bold text-white border-t-2 border-[#2d2d34]">
                      ¥{totalEarnings.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Cột bên phải (Ví/Thẻ) ── */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Card thanh toán */}
          <div className="bg-gradient-to-br from-[#2a2a35] to-[#1e1e24] border border-[#3a3a44] rounded-xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-red-600/10 blur-3xl rounded-full"></div>
            <div className="flex justify-between items-start mb-8 relative z-10">
              <CreditCard className="w-8 h-8 text-slate-300" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-[#121214]/50 px-2.5 py-1 rounded-md">
                Active
              </span>
            </div>
            <div className="space-y-1 relative z-10">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                Payout Account
              </p>
              <p className="text-lg font-mono tracking-widest text-white shadow-sm">
                **** **** **** 1234
              </p>
            </div>
            <div className="flex justify-between mt-6 relative z-10">
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-0.5">Cardholder</p>
                <p className="text-xs font-bold text-white uppercase">Kenji Sato</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-0.5">Bank</p>
                <p className="text-xs font-bold text-white uppercase">Tokyo UI Bank</p>
              </div>
            </div>
          </div>

          {/* Báo cáo nhanh */}
          <div className="bg-[#1e1e24] border border-[#2d2d34] rounded-xl p-5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              Quarterly Trend
            </h3>
            <div className="space-y-4">
              {monthlyData.map((data) => {
                const percentage = (data.amount / 60000) * 100;
                return (
                  <div key={data.month} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-400">{data.month}</span>
                      <span className="font-bold text-white">¥{data.amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-[#121214] rounded-full h-1.5 border border-[#2d2d34]">
                      <div
                        className={`h-1.5 rounded-full ${
                          data.month === 'Jun' ? 'bg-red-500' : 'bg-slate-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="w-full mt-6 py-2.5 bg-[#2d2d34] hover:bg-[#3a3a44] rounded-md text-[11px] font-bold text-slate-300 transition-colors cursor-pointer flex justify-center items-center gap-1 uppercase tracking-wider">
              View Full Analytics <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
