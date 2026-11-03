"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { formatCount, formatShortDate } from "@/lib/format";
import type { ChartPoint } from "@/lib/progress";

/** 進捗グラフ（累計の折れ線）。灰: 最初の計画、緑: 実績、緑の点線: これからの計画 */
export function ProgressChart({
  points,
  totalWork,
}: {
  points: ChartPoint[];
  totalWork: number;
}) {
  const hasForecast = points.some((p) => p.forecast !== undefined);
  return (
    <figure className="flex flex-col gap-2">
      <div
        className="h-52 w-full"
        role="img"
        aria-label="進捗グラフ。最初の計画と、これまでに解いた数の合計の移り変わり"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={points}
            margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
          >
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              stroke="var(--border)"
              minTickGap={24}
            />
            <YAxis
              domain={[0, totalWork]}
              tickFormatter={formatCount}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              stroke="var(--border)"
              width={48}
            />
            <Line
              dataKey="baseline"
              stroke="var(--baseline)"
              strokeWidth={2}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            <Line
              dataKey="forecast"
              stroke="var(--brand)"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            <Line
              dataKey="actual"
              stroke="var(--brand)"
              strokeWidth={2.5}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <LegendItem color="var(--baseline)">最初の計画</LegendItem>
        <LegendItem color="var(--brand)">実績</LegendItem>
        {hasForecast && (
          <LegendItem color="var(--brand)" dashed>
            これからの計画
          </LegendItem>
        )}
      </figcaption>
    </figure>
  );
}

function LegendItem({
  color,
  dashed = false,
  children,
}: {
  color: string;
  dashed?: boolean;
  children: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden
        className="inline-block w-5 border-t-2"
        style={{ borderColor: color, borderStyle: dashed ? "dashed" : "solid" }}
      />
      {children}
    </span>
  );
}
