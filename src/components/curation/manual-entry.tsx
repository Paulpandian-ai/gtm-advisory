"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Send } from "lucide-react";

/* ── Constants ─────────────────────────────────────────── */

const INDUSTRIES = [
  "SaaS",
  "FinTech",
  "HealthTech",
  "EdTech",
  "DevTools",
  "Security",
  "Data & Analytics",
  "MarTech",
  "HRTech",
  "E-Commerce",
  "Infrastructure",
  "AI / ML",
] as const;

const STAGES = ["Seed", "Series A", "Series B", "Series C", "Growth"] as const;

const GTM_MOTIONS = [
  "Product-Led",
  "Sales-Led",
  "Hybrid",
  "Channel",
  "Marketplace",
] as const;

const PRICING_MODELS = [
  "Freemium",
  "Free Trial",
  "Usage-Based",
  "Flat Rate",
  "Per Seat",
  "Tiered",
  "Custom / Enterprise",
] as const;

const DATA_ORIGINS = [
  "Public Filing",
  "Press Release",
  "Analyst Report",
  "Direct Engagement",
  "Conference Talk",
  "Job Posting Analysis",
  "Other",
] as const;

const CHANNEL_LABELS = [
  "Direct Sales",
  "Self-Serve",
  "Partner / Channel",
  "Marketplace",
  "Outbound",
  "Inbound",
] as const;

/* ── Shared styles ─────────────────────────────────────── */

const inputCls =
  "bg-[#020617] border-[#334155] focus:border-[#3b82f6] text-[#f8fafc]";

const selectTriggerCls =
  "bg-[#020617] border-[#334155] focus:border-[#3b82f6] text-[#f8fafc]";

const selectContentCls = "bg-[#0f172a] border-[#1e293b]";

/* ── Channel Mix Slider ────────────────────────────────── */

function ChannelSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#94a3b8]">{label}</span>
        <span className="text-xs font-mono text-[#f8fafc]">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-[#1e293b] accent-[#3b82f6] cursor-pointer"
      />
    </div>
  );
}

/* ── Form Field Helpers ────────────────────────────────── */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[#94a3b8] text-xs">{label}</Label>
      {children}
    </div>
  );
}

/* ── Main Component ────────────────────────────────────── */

export function ManualEntry() {
  // Company Profile
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("");
  const [arr, setArr] = useState("");
  const [employees, setEmployees] = useState("");
  const [funding, setFunding] = useState("");

  // GTM Strategy
  const [motion, setMotion] = useState("");
  const [channels, setChannels] = useState<number[]>([20, 20, 15, 15, 15, 15]);
  const [icp, setIcp] = useState("");

  // Revenue Metrics
  const [winRate, setWinRate] = useState("");
  const [salesCycle, setSalesCycle] = useState("");
  const [cac, setCac] = useState("");
  const [ltv, setLtv] = useState("");
  const [nrr, setNrr] = useState("");
  const [churn, setChurn] = useState("");

  // Ecosystem
  const [partnerProgram, setPartnerProgram] = useState(false);
  const [marketplaces, setMarketplaces] = useState({
    aws: false,
    azure: false,
    gcp: false,
  });
  const [coSellDeals, setCoSellDeals] = useState("");
  const [coSellRevenue, setCoSellRevenue] = useState("");

  // Pricing
  const [pricingModel, setPricingModel] = useState("");
  const [tierCount, setTierCount] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [enterprisePrice, setEnterprisePrice] = useState("");
  const [freeTier, setFreeTier] = useState(false);

  // Source
  const [dataOrigin, setDataOrigin] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceNotes, setSourceNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  function updateChannel(index: number, value: number) {
    setChannels((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  const channelSum = channels.reduce((a, b) => a + b, 0);

  async function handleSave(status: "DRAFT" | "PUBLISHED") {
    setSaving(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setToast(
      status === "DRAFT"
        ? "Draft saved successfully"
        : "Company data published successfully"
    );
    setTimeout(() => setToast(""), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] px-4 py-2.5 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      <Accordion
        type="multiple"
        defaultValue={["company", "gtm", "revenue", "ecosystem", "pricing", "source"]}
        className="space-y-3"
      >
        {/* Section 1: Company Profile */}
        <AccordionItem
          value="company"
          className="bg-[#0f172a] border border-[#1e293b] rounded-lg px-5 overflow-hidden"
        >
          <AccordionTrigger className="text-[#f8fafc] hover:no-underline">
            <span className="flex items-center gap-2">
              <span className="text-[#3b82f6] text-xs font-mono">01</span>
              Company Profile
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <Field label="Company Name">
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Corp"
                  className={inputCls}
                />
              </Field>
              <Field label="Industry">
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger className={selectTriggerCls}>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent className={selectContentCls}>
                    {INDUSTRIES.map((i) => (
                      <SelectItem key={i} value={i}>
                        {i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Stage">
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger className={selectTriggerCls}>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent className={selectContentCls}>
                    {STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="ARR ($)">
                <Input
                  type="number"
                  value={arr}
                  onChange={(e) => setArr(e.target.value)}
                  placeholder="5000000"
                  className={cn(inputCls, "font-mono")}
                />
              </Field>
              <Field label="Employees">
                <Input
                  type="number"
                  value={employees}
                  onChange={(e) => setEmployees(e.target.value)}
                  placeholder="120"
                  className={cn(inputCls, "font-mono")}
                />
              </Field>
              <Field label="Total Funding ($)">
                <Input
                  type="number"
                  value={funding}
                  onChange={(e) => setFunding(e.target.value)}
                  placeholder="20000000"
                  className={cn(inputCls, "font-mono")}
                />
              </Field>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 2: GTM Strategy */}
        <AccordionItem
          value="gtm"
          className="bg-[#0f172a] border border-[#1e293b] rounded-lg px-5 overflow-hidden"
        >
          <AccordionTrigger className="text-[#f8fafc] hover:no-underline">
            <span className="flex items-center gap-2">
              <span className="text-[#3b82f6] text-xs font-mono">02</span>
              GTM Strategy
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="GTM Motion">
                  <Select value={motion} onValueChange={setMotion}>
                    <SelectTrigger className={selectTriggerCls}>
                      <SelectValue placeholder="Select motion" />
                    </SelectTrigger>
                    <SelectContent className={selectContentCls}>
                      {GTM_MOTIONS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-[#94a3b8] text-xs">Channel Mix</Label>
                  <span
                    className={cn(
                      "text-xs font-mono",
                      channelSum === 100
                        ? "text-[#22c55e]"
                        : "text-[#f59e0b]"
                    )}
                  >
                    Total: {channelSum}%
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                  {CHANNEL_LABELS.map((label, i) => (
                    <ChannelSlider
                      key={label}
                      label={label}
                      value={channels[i]}
                      onChange={(v) => updateChannel(i, v)}
                    />
                  ))}
                </div>
              </div>

              <Field label="Ideal Customer Profile (ICP)">
                <textarea
                  value={icp}
                  onChange={(e) => setIcp(e.target.value)}
                  placeholder="Describe your ideal customer..."
                  rows={3}
                  className={cn(
                    inputCls,
                    "w-full rounded-md px-3 py-2 text-sm resize-none"
                  )}
                />
              </Field>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 3: Revenue Metrics */}
        <AccordionItem
          value="revenue"
          className="bg-[#0f172a] border border-[#1e293b] rounded-lg px-5 overflow-hidden"
        >
          <AccordionTrigger className="text-[#f8fafc] hover:no-underline">
            <span className="flex items-center gap-2">
              <span className="text-[#3b82f6] text-xs font-mono">03</span>
              Revenue Metrics
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <Field label="Win Rate (%)">
                <Input
                  type="number"
                  step="0.1"
                  value={winRate}
                  onChange={(e) => setWinRate(e.target.value)}
                  placeholder="22"
                  className={cn(inputCls, "font-mono")}
                />
              </Field>
              <Field label="Sales Cycle (days)">
                <Input
                  type="number"
                  value={salesCycle}
                  onChange={(e) => setSalesCycle(e.target.value)}
                  placeholder="38"
                  className={cn(inputCls, "font-mono")}
                />
              </Field>
              <Field label="CAC ($)">
                <Input
                  type="number"
                  value={cac}
                  onChange={(e) => setCac(e.target.value)}
                  placeholder="20000"
                  className={cn(inputCls, "font-mono")}
                />
              </Field>
              <Field label="LTV ($)">
                <Input
                  type="number"
                  value={ltv}
                  onChange={(e) => setLtv(e.target.value)}
                  placeholder="60000"
                  className={cn(inputCls, "font-mono")}
                />
              </Field>
              <Field label="NRR (%)">
                <Input
                  type="number"
                  step="0.1"
                  value={nrr}
                  onChange={(e) => setNrr(e.target.value)}
                  placeholder="105"
                  className={cn(inputCls, "font-mono")}
                />
              </Field>
              <Field label="Churn (%/month)">
                <Input
                  type="number"
                  step="0.01"
                  value={churn}
                  onChange={(e) => setChurn(e.target.value)}
                  placeholder="3"
                  className={cn(inputCls, "font-mono")}
                />
              </Field>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 4: Ecosystem */}
        <AccordionItem
          value="ecosystem"
          className="bg-[#0f172a] border border-[#1e293b] rounded-lg px-5 overflow-hidden"
        >
          <AccordionTrigger className="text-[#f8fafc] hover:no-underline">
            <span className="flex items-center gap-2">
              <span className="text-[#3b82f6] text-xs font-mono">04</span>
              Ecosystem
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-5 pt-2">
              <div className="flex items-center gap-3">
                <Switch
                  checked={partnerProgram}
                  onCheckedChange={setPartnerProgram}
                />
                <Label className="text-[#94a3b8]">
                  Has Partner Program
                </Label>
              </div>

              <div>
                <Label className="text-[#94a3b8] text-xs mb-3 block">
                  Cloud Marketplaces
                </Label>
                <div className="flex flex-wrap gap-3">
                  {(
                    [
                      ["aws", "AWS"],
                      ["azure", "Azure"],
                      ["gcp", "GCP"],
                    ] as const
                  ).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={
                          marketplaces[key as keyof typeof marketplaces]
                        }
                        onChange={(e) =>
                          setMarketplaces((prev) => ({
                            ...prev,
                            [key]: e.target.checked,
                          }))
                        }
                        className="rounded border-[#334155] bg-[#020617] text-[#3b82f6] focus:ring-[#3b82f6] w-4 h-4"
                      />
                      <span className="text-sm text-[#e2e8f0]">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Co-sell Deals (count)">
                  <Input
                    type="number"
                    value={coSellDeals}
                    onChange={(e) => setCoSellDeals(e.target.value)}
                    placeholder="12"
                    className={cn(inputCls, "font-mono")}
                  />
                </Field>
                <Field label="Co-sell Revenue ($)">
                  <Input
                    type="number"
                    value={coSellRevenue}
                    onChange={(e) => setCoSellRevenue(e.target.value)}
                    placeholder="500000"
                    className={cn(inputCls, "font-mono")}
                  />
                </Field>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 5: Pricing */}
        <AccordionItem
          value="pricing"
          className="bg-[#0f172a] border border-[#1e293b] rounded-lg px-5 overflow-hidden"
        >
          <AccordionTrigger className="text-[#f8fafc] hover:no-underline">
            <span className="flex items-center gap-2">
              <span className="text-[#3b82f6] text-xs font-mono">05</span>
              Pricing
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Pricing Model">
                  <Select value={pricingModel} onValueChange={setPricingModel}>
                    <SelectTrigger className={selectTriggerCls}>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent className={selectContentCls}>
                      {PRICING_MODELS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Number of Tiers">
                  <Input
                    type="number"
                    value={tierCount}
                    onChange={(e) => setTierCount(e.target.value)}
                    placeholder="3"
                    className={cn(inputCls, "font-mono")}
                  />
                </Field>
                <Field label="Starting Price ($/mo)">
                  <Input
                    type="number"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(e.target.value)}
                    placeholder="49"
                    className={cn(inputCls, "font-mono")}
                  />
                </Field>
                <Field label="Enterprise Price ($/mo)">
                  <Input
                    type="number"
                    value={enterprisePrice}
                    onChange={(e) => setEnterprisePrice(e.target.value)}
                    placeholder="999"
                    className={cn(inputCls, "font-mono")}
                  />
                </Field>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={freeTier} onCheckedChange={setFreeTier} />
                <Label className="text-[#94a3b8]">Has Free Tier</Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 6: Source */}
        <AccordionItem
          value="source"
          className="bg-[#0f172a] border border-[#1e293b] rounded-lg px-5 overflow-hidden"
        >
          <AccordionTrigger className="text-[#f8fafc] hover:no-underline">
            <span className="flex items-center gap-2">
              <span className="text-[#3b82f6] text-xs font-mono">06</span>
              Data Source
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <Field label="Source Type">
                <Select value={dataOrigin} onValueChange={setDataOrigin}>
                  <SelectTrigger className={selectTriggerCls}>
                    <SelectValue placeholder="Where did this data come from?" />
                  </SelectTrigger>
                  <SelectContent className={selectContentCls}>
                    {DATA_ORIGINS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Source URL">
                <Input
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://..."
                  className={inputCls}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Notes">
                  <textarea
                    value={sourceNotes}
                    onChange={(e) => setSourceNotes(e.target.value)}
                    placeholder="Additional context about the data source..."
                    rows={2}
                    className={cn(
                      inputCls,
                      "w-full rounded-md px-3 py-2 text-sm resize-none"
                    )}
                  />
                </Field>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => handleSave("DRAFT")}
          disabled={saving}
          className="border-[#334155] text-[#94a3b8] hover:text-[#f8fafc]"
        >
          <Save className="w-4 h-4 mr-1" />
          Save Draft
        </Button>
        <Button onClick={() => handleSave("PUBLISHED")} disabled={saving}>
          <Send className="w-4 h-4 mr-1" />
          Publish
        </Button>
      </div>
    </div>
  );
}
