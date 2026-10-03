"use client";

import type { Analysis } from "@/lib/types/analysis";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usd, num } from "@/lib/format";

const COLORS = ["#2f6f57", "#3d5a80", "#c9a227", "#8c4a3a", "#5c5470", "#6b8f71"];

export function AnalysisCharts({ analysis }: { analysis: Analysis }) {
  const f = analysis.financialSummary;
  const included = analysis.recommendations.filter((r) => r.includedInPortfolio);
  const costData = [
    { name: "Before", cost: f.annualEnergyCost },
    { name: "After (est.)", cost: f.postRetrofitAnnualCost },
  ];
  const contrib = included.map((r) => ({
    name: r.categoryLabel,
    savings: Math.round(r.estimatedAnnualSavings),
  }));
  const energyData = [
    { name: "Electricity kWh", before: analysis.energy.electricityKwh, after: f.postRetrofitElectricityKwh },
    { name: "Gas therms", before: analysis.energy.naturalGasTherms, after: f.postRetrofitGasTherms },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Annual energy cost before vs estimated after">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={costData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${num(v / 1000, 0)}k`} />
            <Tooltip formatter={(v) => usd(Number(v))} />
            <Bar dataKey="cost" fill="#2f6f57" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Savings contribution by technology">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={contrib} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${num(v / 1000, 0)}k`} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => usd(Number(v))} />
            <Bar dataKey="savings" radius={[0, 4, 4, 0]}>
              {contrib.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Ten-year cumulative financial impact (undiscounted)">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={f.cumulative}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${num(v / 1000, 0)}k`} />
            <Tooltip formatter={(v) => usd(Number(v))} />
            <Legend />
            <Line type="monotone" dataKey="cumulativeNet" name="Cumulative net" stroke="#2f6f57" dot={false} />
            <Line type="monotone" dataKey="cumulativeSavings" name="Cumulative savings" stroke="#3d5a80" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Energy consumption before vs estimated after">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={energyData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="before" fill="#8a8f87" radius={[4, 4, 0, 0]} />
            <Bar dataKey="after" fill="#2f6f57" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-sm font-medium">{title}</p>
      {children}
    </div>
  );
}
