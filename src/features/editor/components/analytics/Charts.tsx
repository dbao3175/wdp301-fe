import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { RankingDataPoint, VoteDataPoint, ProgressDataPoint } from '../../types/index.ts';

// Custom Tooltip Style
const customTooltipStyle = {
  backgroundColor: '#141414',
  border: '2px solid #141414',
  borderRadius: 0,
  padding: '8px 12px',
  color: '#FFFFFF',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: '11px',
  fontWeight: 'bold',
};

// =========================================================
// RANKING CHART
// =========================================================

interface RankingChartProps {
  data: RankingDataPoint[];
  title?: string;
}

export const RankingChart: React.FC<RankingChartProps> = ({
  data,
  title = 'Ranking Trend',
}) => {
  // Invert axis: lower rank number = better
  const maxRank = Math.max(...data.map((d) => d.rank), 20);

  return (
    <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414] p-5">
      <h3 className="font-syne font-extrabold text-xs uppercase tracking-widest text-ink-black mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="week"
            tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#6b7280' }}
          />
          <YAxis
            reversed
            domain={[1, maxRank + 2]}
            tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#6b7280' }}
            tickFormatter={(v) => `#${v}`}
          />
          <Tooltip
            contentStyle={customTooltipStyle}
            formatter={(value: number) => [`#${value}`, 'Rank']}
          />
          <Line
            type="monotone"
            dataKey="rank"
            stroke="#E63946"
            strokeWidth={2.5}
            dot={{ fill: '#E63946', r: 4, strokeWidth: 2, stroke: '#141414' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// =========================================================
// VOTE TREND CHART
// =========================================================

interface VoteTrendChartProps {
  data: VoteDataPoint[];
  title?: string;
}

export const VoteTrendChart: React.FC<VoteTrendChartProps> = ({
  data,
  title = 'Vote Trend',
}) => {
  return (
    <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414] p-5">
      <h3 className="font-syne font-extrabold text-xs uppercase tracking-widest text-ink-black mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="voteGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E63946" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#E63946" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="chapter"
            tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#6b7280' }}
          />
          <YAxis
            tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#6b7280' }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={customTooltipStyle}
            formatter={(value: number) => [value.toLocaleString(), 'Votes']}
          />
          <Area
            type="monotone"
            dataKey="votes"
            stroke="#E63946"
            strokeWidth={2.5}
            fill="url(#voteGradient)"
            dot={{ fill: '#E63946', r: 4, strokeWidth: 2, stroke: '#141414' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// =========================================================
// PROGRESS CHART
// =========================================================

interface ProgressChartProps {
  data: ProgressDataPoint[];
  title?: string;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  data,
  title = 'Production Progress',
}) => {
  return (
    <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414] p-5">
      <h3 className="font-syne font-extrabold text-xs uppercase tracking-widest text-ink-black mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#6b7280' }}
          />
          <YAxis
            tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#6b7280' }}
          />
          <Tooltip
            contentStyle={customTooltipStyle}
          />
          <Legend
            wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 10 }}
          />
          <Bar dataKey="target" name="Target" fill="#e5e7eb" stroke="#9ca3af" strokeWidth={1} />
          <Bar dataKey="chaptersCompleted" name="Completed" fill="#141414" stroke="#141414" strokeWidth={1} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// =========================================================
// MINI SPARKLINE (for dashboard widgets)
// =========================================================

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = '#E63946',
  height = 40,
}) => {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
