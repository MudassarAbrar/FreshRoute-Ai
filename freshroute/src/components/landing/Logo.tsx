import { cn } from "@/lib/utils"

export function Logo({ className, size = 34 }: { className?: string; size?: number }) {
  return (
    <img
      src="/favicon.svg"
      alt="FreshRoute"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
    />
  )
}

export function Wordmark({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Logo size={32} />
      <span
        className={cn(
          "font-display text-[19px] font-bold tracking-tight",
          dark ? "text-primary-50" : "text-foreground",
        )}
      >
        FreshRoute
      </span>
    </span>
  )
}
