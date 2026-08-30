import { useState } from "react"
import { CalendarDays, ChevronDown, ChevronUp, MapPin, Package2, ScanSearch, Scale, Sparkles } from "lucide-react"
import { maund, pkr } from "@/lib/format"
import type { Lot } from "@/types"
import { cn } from "@/lib/utils"

function Field({
  icon: Icon,
  label,
  value,
  confidence,
}: {
  icon: React.ElementType
  label: string
  value: string
  confidence?: number
}) {
  return (
    <div className="rounded-xl bg-secondary/70 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-primary-700/70">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        <span className="text-[14px] font-bold text-foreground">{value}</span>
        {confidence !== undefined && (
          <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-[9px] font-bold text-primary-700">
            AI {Math.round(confidence * 100)}%
          </span>
        )}
      </div>
    </div>
  )
}

export function LotCard({ lot }: { lot: Lot }) {
  const v = lot.vision
  const [showScoring, setShowScoring] = useState(false)

  return (
    <div className="w-[92%] max-w-[340px] animate-msg-in overflow-hidden rounded-2xl bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border/60 bg-gradient-to-r from-primary-800 to-primary-700 px-4 py-2.5 text-white">
        <div className="flex items-center gap-2">
          <ScanSearch className="h-4 w-4 text-emerald-300" />
          <span className="text-[12px] font-bold tracking-wide">PRODUCE LOT · #FR-1042</span>
        </div>
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
          {v.source === "gemini" ? "GEMINI VISION" : "DEMO ESTIMATE"}
        </span>
      </div>

      {lot.photos.length > 0 && (
        <div className="flex gap-1.5 px-3 pt-3">
          {lot.photos.map((p) => (
            <img key={p} src={p} alt="Lot photo" className="h-20 flex-1 rounded-xl object-cover" loading="lazy" />
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 p-3">
        <Field icon={Sparkles} label="Crop" value={lot.crop} confidence={lot.confidence.crop} />
        <Field
          icon={Scale}
          label="Quantity"
          value={`${lot.quantityKg.toLocaleString()} kg`}
          confidence={lot.confidence.quantity}
        />
        <Field icon={MapPin} label="Location" value={lot.location} confidence={lot.confidence.location} />
        <Field icon={CalendarDays} label="Ready" value={lot.readyDate} />
        <Field icon={Package2} label="Packaging" value={lot.packaging} />
        <div className="rounded-xl bg-secondary/70 px-3 py-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wide text-primary-700/70">Est. value</div>
          <div className="mt-1 text-[14px] font-bold text-primary-800">{pkr(lot.quantityKg * 70)}</div>
        </div>
      </div>

      <div className="mx-3 mb-3 rounded-xl border border-border/70 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Quality estimate
            </span>
            <span
              className={cn(
                "rounded-lg px-2 py-0.5 text-[13px] font-extrabold text-white",
                v.grade === "A" ? "bg-good" : v.grade === "B" ? "bg-primary-600" : "bg-warn",
              )}
            >
              Grade {v.grade}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground">
            {maund(lot.quantityKg)} maund
          </span>
        </div>

        {/* Quick stats row */}
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-muted/50 px-2 py-1.5 text-center">
            <p className="text-[9px] font-bold uppercase text-muted-foreground">Confidence</p>
            <p className="text-[13px] font-extrabold text-foreground">{Math.round(v.confidence * 100)}%</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-2 py-1.5 text-center">
            <p className="text-[9px] font-bold uppercase text-muted-foreground">Ripeness</p>
            <p className="text-[13px] font-extrabold capitalize text-foreground">{v.ripeness}</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-2 py-1.5 text-center">
            <p className="text-[9px] font-bold uppercase text-muted-foreground">Defects</p>
            <p className="text-[13px] font-extrabold text-foreground">~{Math.round(v.defectRate * 100)}%</p>
          </div>
        </div>

        {/* Analysis notes */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {v.notes.map((n) => (
            <span key={n} className="rounded-full bg-muted px-2 py-1 text-[10.5px] font-medium text-muted-foreground">
              {n}
            </span>
          ))}
        </div>

        {/* Confidence bar */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-700"
              style={{ width: `${v.confidence * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-primary-700">{Math.round(v.confidence * 100)}% confidence</span>
        </div>

        {/* Expandable scoring explanation */}
        <button
          onClick={() => setShowScoring(!showScoring)}
          className="mt-2 flex w-full items-center justify-between rounded-lg bg-muted/30 px-2.5 py-1.5 text-[10px] font-bold text-muted-foreground hover:bg-muted/50"
        >
          <span>How was this scored?</span>
          {showScoring ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        {showScoring && (
          <div className="mt-2 space-y-2 rounded-lg bg-muted/20 p-2.5">
            <div>
              <p className="text-[9px] font-bold uppercase text-muted-foreground">Source</p>
              <p className="text-[11px] font-medium text-foreground">
                {v.source === "gemini"
                  ? "Analyzed by Gemini Vision AI — real image analysis with a trained produce grading model."
                  : "Demo estimate — uses a deterministic fallback model. Configure GEMINI_API_KEY for real AI analysis."}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase text-muted-foreground">Grading criteria</p>
              <ul className="mt-0.5 space-y-0.5 text-[10.5px] text-foreground">
                <li>• <span className="font-medium">Colour uniformity:</span> consistent ripeness across the lot</li>
                <li>• <span className="font-medium">Surface defects:</span> bruising, blemishes, size irregularity</li>
                <li>• <span className="font-medium">Packaging quality:</span> ventilation, stacking, crate condition</li>
                <li>• <span className="font-medium">Ripeness stage:</span> affects shelf life and transport tolerance</li>
              </ul>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase text-muted-foreground">Grade scale</p>
              <div className="mt-0.5 flex gap-2 text-[10px]">
                <span className="rounded bg-good/15 px-1.5 py-0.5 font-bold text-good">A</span>
                <span className="text-muted-foreground">Premium — minimal defects, uniform colour</span>
              </div>
              <div className="mt-0.5 flex gap-2 text-[10px]">
                <span className="rounded bg-primary-50 px-1.5 py-0.5 font-bold text-primary-700">B</span>
                <span className="text-muted-foreground">Standard — acceptable quality, minor issues</span>
              </div>
              <div className="mt-0.5 flex gap-2 text-[10px]">
                <span className="rounded bg-warn/15 px-1.5 py-0.5 font-bold text-warn">C</span>
                <span className="text-muted-foreground">Below average — higher rejection risk</span>
              </div>
            </div>
            <p className="text-[9.5px] leading-snug text-muted-foreground/80">
              Visual estimate from photos — final buyer acceptance may vary after physical inspection.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
