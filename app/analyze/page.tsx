"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BUILDING_TYPE_LABELS, BUILDING_TYPES, type BuildingType } from "@/lib/types/building";
import type { Analysis } from "@/lib/types/analysis";
import type { ExtractionResult } from "@/lib/types/utility";
import { usd, num } from "@/lib/format";
import { cacheAnalysis } from "@/lib/client/analysis-cache";

const STEPS = ["Building", "Energy", "Analysis", "Results"] as const;

function AnalyzeInner() {
  const router = useRouter();
  const search = useSearchParams();
  const startDemo = search.get("demo") === "1";

  const [step, setStep] = useState(startDemo ? 2 : 0);
  const [address, setAddress] = useState(startDemo ? "123 Main Street, Buffalo, NY 14202" : "");
  const [buildingType, setBuildingType] = useState<BuildingType>("office");
  const [squareFeet, setSquareFeet] = useState(startDemo ? "25000" : "");
  const [yearBuilt, setYearBuilt] = useState(startDemo ? "1988" : "");
  const [stories, setStories] = useState(startDemo ? "3" : "");
  const [electricityKwh, setElectricityKwh] = useState(startDemo ? "145000" : "");
  const [gasTherms, setGasTherms] = useState(startDemo ? "42000" : "");
  const [elecRate, setElecRate] = useState(startDemo ? "0.15" : "");
  const [gasRate, setGasRate] = useState(startDemo ? "1.10" : "");
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [running, setRunning] = useState(startDemo);
  const [pipeline, setPipeline] = useState<Analysis["pipeline"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editExtracted, setEditExtracted] = useState(false);

  const progress = ((step + 1) / STEPS.length) * 100;

  const extractedSummary = useMemo(() => {
    if (!extraction) return null;
    const a = extraction.annualized;
    return {
      kwh: a.electricityKwh,
      therms: a.naturalGasTherms,
      cost: a.totalAnnualCost,
      confidence: extraction.extraction.confidence,
    };
  }, [extraction]);

  async function onUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/utility-bill/extract", { method: "POST", body: form });
      const json = await res.json();
      if (json.result) {
        setExtraction(json.result);
        const a = json.result.annualized;
        if (a.electricityKwh) setElectricityKwh(String(Math.round(a.electricityKwh)));
        if (a.naturalGasTherms) setGasTherms(String(Math.round(a.naturalGasTherms)));
        if (a.electricityRate) setElecRate(String(a.electricityRate));
        if (a.gasRate) setGasRate(String(a.gasRate));
      } else {
        setError(json.error ?? "Could not extract the bill. Enter values manually.");
      }
    } catch {
      setError("Upload failed. Enter values manually.");
    } finally {
      setUploading(false);
    }
  }

  const run = useCallback(async (mode: "demo" | "custom") => {
    if (mode === "custom" && address.trim().length < 3) {
      setError("Address is required.");
      setStep(0);
      return;
    }
    setRunning(true);
    setError(null);
    setStep(2);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          address: address || "123 Main Street, Buffalo, NY 14202",
          buildingType,
          squareFeet: squareFeet ? Number(squareFeet) : null,
          yearBuilt: yearBuilt ? Number(yearBuilt) : null,
          stories: stories ? Number(stories) : null,
          utility: {
            electricityKwh: electricityKwh ? Number(electricityKwh) : null,
            naturalGasTherms: gasTherms ? Number(gasTherms) : null,
            electricityRate: elecRate ? Number(elecRate) : null,
            gasRate: gasRate ? Number(gasRate) : null,
            source: extraction ? extraction.method === "ai" ? "ai-extracted" : extraction.method === "demo" ? "demo" : "manual" : electricityKwh ? "manual" : "none",
            utilityProvider: extraction?.extraction.utilityProvider,
            monthsOfData: extraction?.extraction.billingPeriodMonths,
          },
          extraction,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.analysis) {
        setError(json.error ?? "Analysis failed.");
        setRunning(false);
        return;
      }
      const analysis = json.analysis as Analysis;
      cacheAnalysis(analysis);
      setPipeline(analysis.pipeline);
      setStep(3);
      await new Promise((r) => setTimeout(r, 1200));
      router.push(`/analysis/${analysis.id}`);
    } catch {
      setError("Network error. Please try again.");
      setRunning(false);
    }
  }, [
    address,
    buildingType,
    elecRate,
    electricityKwh,
    extraction,
    gasRate,
    gasTherms,
    router,
    squareFeet,
    stories,
    yearBuilt,
  ]);

  const autoStarted = useRef(false);
  useEffect(() => {
    if (!startDemo || autoStarted.current) return;
    autoStarted.current = true;
    void run("demo");
  }, [run, startDemo]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">Preliminary analysis</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Analyze a building</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Required: address. Everything else is optional. Missing utility data is estimated from building characteristics.
      </p>

      <div className="mt-6">
        <div className="mb-2 flex justify-between text-[11px] font-medium text-muted-foreground">
          {STEPS.map((s, i) => (
            <span key={s} className={i === step ? "text-primary" : ""}>
              {String(i + 1).padStart(2, "0")} {s}
            </span>
          ))}
        </div>
        <Progress value={progress} />
      </div>

      {error && (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {step === 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Building</CardTitle>
            <CardDescription>Public GIS is used when available. Failures do not stop the analysis.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Example Street, Buffalo, NY" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Building type</Label>
                <Select value={buildingType} onValueChange={(v) => setBuildingType(v as BuildingType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILDING_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {BUILDING_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sqft">Square footage</Label>
                <Input id="sqft" inputMode="numeric" value={squareFeet} onChange={(e) => setSquareFeet(e.target.value)} placeholder="25000" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="year">Year built</Label>
                <Input id="year" inputMode="numeric" value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} placeholder="1988" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="floors">Floors</Label>
                <Input id="floors" inputMode="numeric" value={stories} onChange={(e) => setStories(e.target.value)} placeholder="3" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setStep(1)}>Continue</Button>
              <Button variant="outline" onClick={() => run("demo")}>
                Analyze demo building
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Energy</CardTitle>
            <CardDescription>Upload a bill or enter annual totals. Monthly figures are annualized when the period is known.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="bill">Utility bill (PDF, JPG, PNG)</Label>
              <Input
                id="bill"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onUpload(f);
                }}
              />
              {uploading && (
                <ol className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>Reading document…</li>
                  <li>Extracting utility data…</li>
                  <li>Validating values…</li>
                  <li>Matching building information…</li>
                  <li>Preparing retrofit analysis…</li>
                </ol>
              )}
            </div>

            {extractedSummary && (
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-sm font-medium">Utility data detected</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Electricity</p>
                    <p>{extractedSummary.kwh != null ? `${num(extractedSummary.kwh)} kWh/yr` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gas</p>
                    <p>{extractedSummary.therms != null ? `${num(extractedSummary.therms)} therms/yr` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Est. annual cost</p>
                    <p>{extractedSummary.cost != null ? usd(extractedSummary.cost) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Confidence</p>
                    <p>{Math.round(extractedSummary.confidence * 100)}%</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{extraction?.notices.join(" ")}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setEditExtracted(true)}>
                  Edit values
                </Button>
              </div>
            )}

            {(editExtracted || !extraction) && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="kwh">Annual electricity (kWh/year)</Label>
                  <Input id="kwh" value={electricityKwh} onChange={(e) => setElectricityKwh(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="therms">Annual gas (therms/year)</Label>
                  <Input id="therms" value={gasTherms} onChange={(e) => setGasTherms(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="erate">Electricity rate ($/kWh)</Label>
                  <Input id="erate" value={elecRate} onChange={(e) => setElecRate(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="grate">Gas rate ($/therm)</Label>
                  <Input id="grate" value={gasRate} onChange={(e) => setGasRate(e.target.value)} />
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button onClick={() => run(startDemo ? "demo" : "custom")} disabled={running}>
                Run analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(step === 2 || running) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Running analysis</CardTitle>
            <CardDescription>Each check below maps to a real pipeline step returned by the engine.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {(pipeline.length
                ? pipeline
                : [
                    { key: "building", label: "Building identified", status: "done", detail: "In progress…", durationMs: 0 },
                    { key: "utility", label: "Utility data extracted", status: "done", detail: "Waiting…", durationMs: 0 },
                    { key: "baseline", label: "Energy baseline calculated", status: "done", detail: "Waiting…", durationMs: 0 },
                    { key: "opportunities", label: "Retrofit opportunities evaluated", status: "done", detail: "Waiting…", durationMs: 0 },
                    { key: "incentives", label: "Incentives matched", status: "done", detail: "Waiting…", durationMs: 0 },
                    { key: "financial", label: "Financial analysis complete", status: "done", detail: "Waiting…", durationMs: 0 },
                  ]
              ).map((s) => (
                <li key={s.key} className="flex items-start gap-2">
                  <span className="mt-0.5 font-mono text-[11px] text-primary">
                    {s.status === "error" ? "!" : s.status === "fallback" ? "~" : "✓"}
                  </span>
                  <span>
                    <span className="font-medium">{s.label}</span>
                    <span className="block text-xs text-muted-foreground">{s.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">Loading…</main>}>
      <AnalyzeInner />
    </Suspense>
  );
}
