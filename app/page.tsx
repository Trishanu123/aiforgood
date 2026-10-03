import Link from "next/link";
import { ArrowRight, Building2, FileSearch, Landmark, LineChart, Sparkles, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRODUCT_NAME } from "@/lib/constants";

const FLOW = [
  "Building",
  "Data",
  "AI analysis",
  "Retrofit opportunities",
  "Incentives",
  "Financial model",
  "Action plan",
];

const STEPS = [
  { n: "01", title: "Analyze building", body: "Start with an address. Add type, size, vintage, and optional utility data." },
  { n: "02", title: "Understand energy use", body: "Build a preliminary electricity, gas, cost, and EUI baseline from available data." },
  { n: "03", title: "Identify upgrades", body: "Screen HVAC, lighting, controls, envelope, solar, storage, and water heating." },
  { n: "04", title: "Match incentives", body: "Surface official NYSERDA, federal, and utility program pathways — not invented rebates." },
  { n: "05", title: "Calculate economics", body: "Deterministic cost, savings, payback, and ROI. The LLM never does the arithmetic." },
  { n: "06", title: "Plan next steps", body: "Leave with a preliminary sequence and verification checklist, not a construction spec." },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">{PRODUCT_NAME}</p>
          <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Turn building data into energy savings.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            OptiBuild AI identifies retrofit opportunities, estimates financial impact, and surfaces potential
            incentives — before you spend weeks on preliminary analysis.
          </p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            AI identifies promising retrofit opportunities for preliminary evaluation. It does not determine exactly
            what a building needs.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/analyze">
                Analyze a Building
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/analyze?demo=1">Try Demo</Link>
            </Button>
          </div>
        </div>
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Workflow</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <ol className="space-y-0">
              {FLOW.map((item, i) => (
                <li key={item} className="text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-5 font-mono text-[11px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-medium">{item}</span>
                  </div>
                  {i < FLOW.length - 1 && (
                    <div className="ml-[9px] h-3 border-l border-border" aria-hidden />
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </section>

      <section className="mt-20">
        <h2 className="text-xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s) => (
            <Card key={s.n} size="sm">
              <CardHeader>
                <p className="font-mono text-[11px] text-primary">{s.n}</p>
                <CardTitle>{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">{s.body}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <h2 className="text-xl font-semibold tracking-tight">Example result</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Illustrative dashboard snapshot for a 25,000 sq ft Buffalo office. Live numbers are produced by the calculation engine in demo mode.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Annual energy cost", "Estimated from bills or building data"],
            ["Potential annual savings", "Preliminary, with uncertainty range"],
            ["Potential incentives", "Program pathways — amounts require verification"],
            ["Best preliminary payback", "Simple payback of the strongest measure"],
          ].map(([t, d]) => (
            <Card key={t} size="sm">
              <CardHeader>
                <CardTitle className="text-sm">{t}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">{d}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-20 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Why it matters</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Commercial retrofit decisions require fragmented building, energy, financial, and incentive information.
            Owners and ESCOs often assemble spreadsheets, utility PDFs, GIS lookups, and program manuals by hand
            just to decide whether a project is worth investigating.
          </p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            OptiBuild AI combines those inputs into one preliminary retrofit intelligence workflow: context, utility
            understanding, recommendations, incentive discovery, financial modeling, and next steps.
          </p>
        </div>
        <div className="grid gap-3">
          {[
            { icon: Building2, t: "Building context", d: "Address, type, size, vintage, location." },
            { icon: FileSearch, t: "Utility understanding", d: "AI extraction from bills, with manual correction." },
            { icon: Sparkles, t: "AI + engineering", d: "LLM reads documents; TypeScript calculates dollars." },
            { icon: Landmark, t: "Incentive pathways", d: "Official sources, never fabricated rebate amounts." },
            { icon: LineChart, t: "Financial screening", d: "Cost, savings, payback, ROI, lifetime net." },
            { icon: Workflow, t: "Actionable next steps", d: "What to verify before anyone spends capital." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="flex gap-3 rounded-lg border border-border/70 bg-card px-3 py-2.5">
              <Icon className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{t}</p>
                <p className="text-xs text-muted-foreground">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
