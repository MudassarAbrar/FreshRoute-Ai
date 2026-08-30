import { useRef, useState } from "react"
import { Camera, Check, Send, Upload, X } from "lucide-react"
import { onPhotosChosen } from "@/store/director"
import { useApp } from "@/store/useApp"
import { cn } from "@/lib/utils"

const SAMPLES = ["/images/tomato-crate-1.jpg", "/images/tomato-crate-2.jpg"]

export function PhotoSheet() {
  const setSheet = useApp((s) => s.setSheet)
  const [selected, setSelected] = useState<string[]>(SAMPLES.slice(0, 1))
  const [uploads, setUploads] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const toggle = (p: string) =>
    setSelected((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p].slice(0, 3)))

  const onFiles = (files: FileList | null) => {
    if (!files) return
    const readers = Array.from(files)
      .slice(0, 3)
      .map(
        (f) =>
          new Promise<string>((resolve) => {
            const r = new FileReader()
            r.onload = () => resolve(r.result as string)
            r.readAsDataURL(f)
          }),
      )
    Promise.all(readers).then((urls) => {
      setUploads(urls)
      setSelected(urls.slice(0, 3))
    })
  }

  const all = uploads.length > 0 ? uploads : SAMPLES
  const chosen = uploads.length > 0 ? selected.filter((s) => s.startsWith("data:")) : selected

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <button className="absolute inset-0 bg-primary-900/45 backdrop-blur-[2px]" onClick={() => setSheet("none")} aria-label="Close" />
      <div className="animate-fade-up relative rounded-t-3xl bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-sheet">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary-600" />
            <h3 className="text-[15px] font-extrabold text-foreground">Add produce photos</h3>
          </div>
          <button onClick={() => setSheet("none")} className="rounded-full p-1.5 hover:bg-muted" aria-label="Close">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <p className="mb-3 text-[11.5px] leading-snug text-muted-foreground">
          Photos let the vision model estimate grade, ripeness and defects — this drives your price comparison. Tap to
          select up to 3.
        </p>

        <div className="mb-3 grid grid-cols-2 gap-2">
          {all.map((p) => {
            const active = chosen.includes(p)
            return (
              <button
                key={p}
                onClick={() => uploads.length === 0 && toggle(p)}
                className={cn(
                  "relative overflow-hidden rounded-2xl border-2 transition-all",
                  active ? "border-primary-600 shadow-glow" : "border-transparent opacity-90",
                )}
              >
                <img src={p} alt="Produce photo option" className="h-28 w-full object-cover" />
                {active && (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </span>
                )}
              </button>
            )
          })}
          <button
            onClick={() => fileRef.current?.click()}
            className="flex h-28 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-primary-300 bg-secondary/50 text-primary-700 transition-colors hover:bg-secondary"
          >
            <Upload className="h-5 w-5" />
            <span className="text-[11px] font-bold">Upload your own</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
        </div>

        <button
          disabled={chosen.length === 0}
          onClick={() => onPhotosChosen(chosen)}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-extrabold transition-all",
            chosen.length > 0
              ? "bg-primary-600 text-white shadow-glow hover:bg-primary-700 active:scale-[0.98]"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Send className="h-4 w-4" />
          {chosen.length > 0 ? `Send ${chosen.length} photo${chosen.length > 1 ? "s" : ""} for analysis` : "Select photos first"}
        </button>
      </div>
    </div>
  )
}
