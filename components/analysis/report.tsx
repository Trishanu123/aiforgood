"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Analysis } from "@/lib/types/analysis";
import type { Recommendation } from "@/lib/types/recommendation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AnalysisCharts } from "@/components/charts/analysis-charts";
import { BUILDING_TYPE_LABELS } from "@/lib/types/building";
import { usd, num, years } from "@/lib/format";
import { ExternalLink } from "lucide-react";

function priorityClass(p: Recommendation["priority"]) {
  if (p === "high") return "bg-primary/15 text-primary";
  if (p === "medium") return "bg-secondary text-foreground";
  return "bg-muted text-muted-foreground";
}

export function AnalysisReport({ analysis, debug }: { analysis: Analysis; debug?: boolean }) {
  const [sortKey, setSortKey] = useState<keyof Pick<Recommendation, "name" | "estimatedCost" | "incentives" | "netCost" | "estimatedAnnualSavings" | "paybackYears" | "roiPercent" | "confidence">>("paybackYears");
  const [asc, setAsc] = useState(true);

  const sorted = useMemo(() => {
    const copy = [...analysis.recommendations];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return asc ? av - bv : bv - av;
      return asc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [analysis.recommendations, sortKey, asc]);

  const f = analysis.financialSummary;
  const included = analysis.recommendations.filter((r) => r.includedInPortfolio);
  const phases = [
    {
      title: "Phase 1 — Low-cost efficiency",
      items: included.filter((r) => r.complexity === "low"),
    },
    {
      title: "Phase 2 — Major systems",
      items: included.filter((r) => r.complexity === "high" && r.category !== "solar" && r.category !== "storage"),
    },
    {
      title: "Phase 3 — Generation & storage",
      items: included.filter((r) => r.category === "solar" || r.category === "storage" || r.complexity === "medium"),
    },
  ].map((p) => ({ ...p, items: p.items.filter((item, i, arr) => arr.findIndex((x) => x.id === item.id) === i) }));

  function header(key: typeof sortKey, label: string) {
    return (
      <button
        className="font-medium"
        onClick={() => {
          if (sortKey === key) setAsc(!asc);
          else {
            setSortKey(key);
            setAsc(true);
          }
        }}
      >
        {label}
        {sortKey === key ? (asc ? " ↑" : " ↓") : ""}
      </button>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 print:max-w-none">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">Retrofit Intelligence Report</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{analysis.building.address}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {BUILDING_TYPE_LABELS[analysis.building.buildingType]}
            {analysis.building.buildingAreaSqFt ? ` · ${num(analysis.building.buildingAreaSqFt)} sq ft` : ""}
            {analysis.building.yearBuilt ? ` · built ${analysis.building.yearBuilt}` : ""}
            {" · "}data confidence {analysis.confidence.level}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {analysis.isDemo && <Badge variant="outline">Demo / estimated data</Badge>}
            {[...new Set(analysis.notices.filter((n) => !n.toLowerCase().startsWith("demo")))]
              .slice(0, 3)
              .map((n) => (
              <Badge key={n} variant="secondary">
                {n.length > 48 ? `${n.slice(0, 48)}…` : n}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            Download preliminary report
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/analyze">New analysis</Link>
          </Button>
        </div>
      </div>

      <p className="mt-4 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs leading-5 text-muted-foreground">
        {analysis.disclaimer}
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Building energy snapshot</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Estimated annual energy cost" value={usd(f.annualEnergyCost)} hint="Electricity + gas" />
          <Stat
            label="Potential annual savings"
            value={usd(f.potentialAnnualSavings)}
            hint={`${usd(f.savingsRange.low)}–${usd(f.savingsRange.high)} estimated range`}
          />
          <Stat label="Potential incentives (modeled)" value={usd(f.potentialIncentives)} hint="Planning assumption, not awarded" />
          <Stat
            label="Best preliminary payback"
            value={years(f.bestPaybackYears)}
            hint={f.bestPaybackMeasure ?? "No positive-savings measure"}
          />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <Mini label="Electricity" value={`${num(analysis.energy.electricityKwh)} kWh`} />
          <Mini label="Natural gas" value={`${num(analysis.energy.naturalGasTherms)} therms`} />
          <Mini
            label="Preliminary EUI"
            value={analysis.energy.euiKbtuPerSqFt ? `${num(analysis.energy.euiKbtuPerSqFt, 0)} kBtu/sq ft` : "n/a"}
          />
          <Mini label="Estimated opportunities" value={String(f.opportunityCount)} />
        </div>
        {analysis.energy.benchmark && (
          <p className="mt-2 text-xs text-muted-foreground">{analysis.energy.benchmark.label}</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Recommended solutions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Priority reflects payback, savings magnitude, incentives, building fit, confidence, and complexity — not ROI alone.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {analysis.recommendations.map((r, i) => (
            <Card key={r.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-[11px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</p>
                    <CardTitle>{r.name}</CardTitle>
                    <CardDescription>{r.description}</CardDescription>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${priorityClass(r.priority)}`}>
                    {r.priority}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <Mini label="Estimated savings" value={`${usd(r.estimatedAnnualSavings)}/yr`} />
                  <Mini label="Estimated net cost" value={usd(r.netCost)} />
                  <Mini label="Payback" value={years(r.paybackYears)} />
                  <Mini label="Potential incentive" value={usd(r.incentives)} />
                </div>
                <p className="text-xs text-muted-foreground">{r.priorityReason}</p>
                {!r.includedInPortfolio && (
                  <p className="text-xs">Excluded from portfolio totals (alternative or no positive operating savings).</p>
                )}
                <Accordion type="single" collapsible>
                  <AccordionItem value="calc">
                    <AccordionTrigger>View calculation</AccordionTrigger>
                    <AccordionContent>
                      <ol className="space-y-2 text-xs">
                        {r.calculation.map((c) => (
                          <li key={c.label}>
                            <p className="font-medium">{c.label}</p>
                            <p className="font-mono text-muted-foreground">{c.expression}</p>
                            <p>= {c.result}</p>
                          </li>
                        ))}
                      </ol>
                      <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                        {r.assumptions.map((a) => (
                          <li key={a}>{a}</li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs">Next step: {r.nextStep}</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Compare upgrades</h2>
        <Card className="mt-4 py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{header("name", "Upgrade")}</TableHead>
                <TableHead>{header("estimatedCost", "Upfront cost")}</TableHead>
                <TableHead>{header("incentives", "Incentive")}</TableHead>
                <TableHead>{header("netCost", "Net cost")}</TableHead>
                <TableHead>{header("estimatedAnnualSavings", "Annual savings")}</TableHead>
                <TableHead>{header("paybackYears", "Payback")}</TableHead>
                <TableHead>{header("roiPercent", "Annual ROI")}</TableHead>
                <TableHead>{header("confidence", "Confidence")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{usd(r.estimatedCost)}</TableCell>
                  <TableCell>{usd(r.incentives)}</TableCell>
                  <TableCell>{usd(r.netCost)}</TableCell>
                  <TableCell>{usd(r.estimatedAnnualSavings)}</TableCell>
                  <TableCell>{years(r.paybackYears)}</TableCell>
                  <TableCell>{r.roiPercent == null ? "n/a" : `${r.roiPercent.toFixed(1)}%`}</TableCell>
                  <TableCell>{r.confidence}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        <p className="mt-2 text-xs text-muted-foreground">
          Annual ROI is defined as estimated annual savings ÷ net cost × 100. Preliminary installed-cost estimate uses the typical value of each cost range.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Visualizations</h2>
        <div className="mt-4">
          <AnalysisCharts analysis={analysis} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Recommended retrofit path</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Preliminary implementation sequence based on current estimates — not a rigid engineering recommendation.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {phases.map((p) => (
            <Card key={p.title} size="sm">
              <CardHeader>
                <CardTitle className="text-sm">{p.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {p.items.length === 0 ? (
                  <p className="text-muted-foreground">No measures in this phase.</p>
                ) : (
                  <ul className="space-y-2">
                    {p.items.map((r) => (
                      <li key={r.id}>
                        <p className="font-medium">{r.name}</p>
                        <p className="text-xs text-muted-foreground">Estimated payback: {years(r.paybackYears)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Potential incentives</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Eligibility must be confirmed before financial decisions. Incentive values are not invented.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {analysis.incentives.map((inc) => (
            <Card key={inc.id} size="sm">
              <CardHeader>
                <CardTitle>{inc.name}</CardTitle>
                <CardDescription>{inc.provider}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Potentially relevant to: </span>
                  {inc.matchedTechnologies.join(", ")}
                </p>
                <p>
                  <span className="text-muted-foreground">Status: </span>
                  {inc.status === "potentially-applicable" ? "Potentially applicable" : "Verify status"}
                </p>
                <p>
                  <span className="text-muted-foreground">Incentive: </span>
                  {inc.incentiveValue}
                </p>
                <p>
                  <span className="text-muted-foreground">Source: </span>
                  {inc.sourceName}
                </p>
                <p>
                  <span className="text-muted-foreground">Last verified: </span>
                  {inc.verificationDate}
                </p>
                <p className="text-xs text-muted-foreground">{inc.notes}</p>
                <Button asChild variant="outline" size="sm">
                  <a href={inc.sourceUrl} target="_blank" rel="noreferrer">
                    View source <ExternalLink />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Data confidence</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Overall: <span className="font-medium text-foreground">{analysis.confidence.level}</span>
          {` (${Math.round(analysis.confidence.score * 100)}% of screening inputs present).`}
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {analysis.confidence.factors.map((f) => (
            <div key={f.label} className="rounded-lg border border-border/80 px-3 py-2">
              <p className="text-sm font-medium">
                {f.met ? "Present" : "Missing"} · {f.label}
              </p>
              <p className="text-xs text-muted-foreground">{f.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Why OptiBuild AI recommends these</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{analysis.explanation.summary}</p>
        {analysis.explanation.measureRationales.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm">
            {analysis.explanation.measureRationales.map((m) => {
              const rec = analysis.recommendations.find((r) => r.id === m.id);
              return (
                <li key={m.id} className="rounded-lg border border-border/70 px-3 py-2">
                  <p className="font-medium">{rec?.name ?? m.id}</p>
                  <p className="text-muted-foreground">{m.rationale}</p>
                </li>
              );
            })}
          </ul>
        )}
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {analysis.explanation.caveats.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Recommended next steps</h2>
        <ol className="mt-4 space-y-3">
          {analysis.nextSteps.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="font-mono text-xs text-primary">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-sm text-muted-foreground">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Assumptions</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Assumption</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.assumptions.map((a, i) => (
                <TableRow key={`${a.label}-${i}`}>
                  <TableCell>{a.category}</TableCell>
                  <TableCell>{a.label}</TableCell>
                  <TableCell>{a.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="mt-10 mb-16">
        <h2 className="text-lg font-semibold">Sources & methodology</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {analysis.sources.map((s) => (
            <li key={`${s.name}-${s.retrievedAt}`}>
              <p className="font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                {s.category} · retrieved {s.retrievedAt.slice(0, 10)}
                {s.url ? (
                  <>
                    {" · "}
                    <a className="underline" href={s.url} target="_blank" rel="noreferrer">
                      {s.url}
                    </a>
                  </>
                ) : null}
              </p>
              {s.note && <p className="text-xs text-muted-foreground">{s.note}</p>}
            </li>
          ))}
        </ul>
      </section>

      {debug && (
        <section className="mb-16 rounded-xl border border-dashed p-4 text-xs no-print">
          <h2 className="text-sm font-semibold">Debug</h2>
          <pre className="mt-3 overflow-auto rounded bg-muted p-3">
            {JSON.stringify(
              {
                pipeline: analysis.pipeline,
                errors: analysis.debug.errors,
                persistence: analysis.persistence,
                extraction: analysis.extraction,
                grounding: analysis.explanation.groundingCheck,
              },
              null,
              2,
            )}
          </pre>
        </section>
      )}
    </main>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tracking-tight">{value}</CardTitle>
      </CardHeader>
      {hint && <CardContent className="text-xs text-muted-foreground">{hint}</CardContent>}
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
