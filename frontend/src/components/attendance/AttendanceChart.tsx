"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface AttendanceChartData {
  date: string;
  label: string;
  present: number;
  absent: number;
  hours: number;
}

function formatDate(dateString: string): string {
  let processedDateString = dateString;
  if (!dateString.endsWith("Z") && !dateString.includes("+") && !dateString.includes("T")) {
    processedDateString = dateString + "T00:00:00Z";
  } else if (!dateString.endsWith("Z") && !dateString.match(/[+-]\d{2}:\d{2}$/)) {
    processedDateString = dateString + "Z";
  }

  const date = new Date(processedDateString);
  return date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface AttendanceChartProps {
  chartData: AttendanceChartData[];
}

export default function AttendanceChart({ chartData }: AttendanceChartProps) {
  if (chartData.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
        No attendance data available for graph
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="attendance" tick={{ fontSize: 12 }} allowDecimals={false} />
          <YAxis yAxisId="hours" orientation="right" tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "hours") return [`${value}h`, "Hours"];
              if (name === "present") return [value, "Present"];
              if (name === "absent") return [value, "Absent"];
              return [value, name];
            }}
            labelFormatter={(label: string, payload: any[]) => {
              const row = payload?.[0]?.payload;
              return row?.date ? formatDate(row.date) : label;
            }}
          />
          <Legend />
          <Bar yAxisId="attendance" dataKey="present" fill="#16a34a" radius={[4, 4, 0, 0]} name="present" />
          <Bar yAxisId="attendance" dataKey="absent" fill="#f59e0b" radius={[4, 4, 0, 0]} name="absent" />
          <Line yAxisId="hours" type="monotone" dataKey="hours" stroke="#2563eb" strokeWidth={2} dot={{ r: 2 }} name="hours" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}