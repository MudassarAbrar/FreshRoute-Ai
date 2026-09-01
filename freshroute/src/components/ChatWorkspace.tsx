import { useState } from "react"
import { ChevronRight, PanelRightClose, PanelRightOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { ContextPanel } from "@/components/ContextPanel"

/**
 * Responsive web workspace that replaces the PhoneFrame mockup.
 * Desktop (>= lg): chat on left, context panel on right (collapsible).
 * Tablet/mobile: chat fills width, context panel available as slide-over.
 */
export function ChatWorkspace({ children }: { children: React.ReactNode }) {
  const [panelOpen, setPanelOpen] = useState(true)

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-background">
      {/* Primary chat area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>

      {/* Desktop context panel — visible on lg+ */}
      <aside
        className={cn(
          "hidden flex-col border-l border-border bg-card transition-[width] duration-200 lg:flex",
          panelOpen ? "w-80 xl:w-96" : "w-0 overflow-hidden",
        )}
      >
        {panelOpen && <ContextPanel onClose={() => setPanelOpen(false)} />}
      </aside>

      {/* Mobile/tablet context panel — slide-over */}
      {panelOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <button
            className="flex-1 bg-black/40"
            onClick={() => setPanelOpen(false)}
            aria-label="Close context panel"
          />
          <aside className="flex w-80 max-w-[85vw] flex-col border-l border-border bg-card shadow-2xl">
            <ContextPanel onClose={() => setPanelOpen(false)} />
          </aside>
        </div>
      )}

      {/* Panel toggle button */}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className={cn(
          "absolute right-0 top-1/2 z-30 -translate-y-1/2 rounded-l-lg border border-r-0 border-border bg-card px-1.5 py-3 text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground",
          panelOpen && "lg:hidden",
        )}
        aria-label={panelOpen ? "Close context panel" : "Open context panel"}
      >
        {panelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
      </button>
    </div>
  )
}
