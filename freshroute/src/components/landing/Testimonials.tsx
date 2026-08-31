// Carousel adapted from 21st.dev "Carousel Testimonials" by ziegfiroyt (embla-carousel + autoplay)
import { useCallback, useEffect, useState } from "react"
import Autoplay from "embla-carousel-autoplay"
import useEmblaCarousel from "embla-carousel-react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { Reveal } from "@/components/landing/Reveal"

type TestimonialItem = {
  id: string
  text: string
  name: string
  role: string
  initials: string
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: "ashraf",
    text: "Every season I took the arthi's first number. This time the agent showed me what Multan was really paying — and what Lahore would pay after the truck. I checked every number myself before approving.",
    name: "Muhammad Ashraf",
    role: "Tomato grower · Jalalpur Pirwala, Punjab",
    initials: "MA",
  },
  {
    id: "zeenat",
    text: "I farm, I don't do paperwork. I say it in Urdu, the agent does the rest — and it asked me before sending anything to the Karachi buyer. That matters to me.",
    name: "Zeenat Bibi",
    role: "Okra grower · Lodhran, Punjab",
    initials: "ZB",
  },
  {
    id: "mustafa",
    text: "It split my orchard between two mandis instead of dumping all six tonnes at one price. First season I've known my net before the truck leaves the farm.",
    name: "Ghulam Mustafa",
    role: "Kinnow orchard · Sargodha, Punjab",
    initials: "GM",
  },
]

function Stars() {
  return (
    <div className="flex items-center gap-0.5" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
      ))}
    </div>
  )
}

export function Testimonials() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" }, [
    Autoplay({ delay: 5500, stopOnInteraction: true }),
  ])

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index)
    },
    [emblaApi],
  )

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi, onSelect])

  return (
    <section data-scroll-anchor className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-[14px] font-bold text-primary-700">// What growers say</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
            The people the agent works for.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Illustrative pilot stories — composites of the app's demo scenarios, in the growers' own words.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex items-stretch">
              {TESTIMONIALS.map((t) => (
                <div key={t.id} className="min-w-0 flex-[0_0_100%] px-3 sm:px-6">
                  <figure className="mx-auto flex h-full max-w-3xl flex-col rounded-3xl border border-border/60 bg-card p-8 shadow-card sm:p-10">
                    <Stars />
                    <blockquote className="mt-5 text-[17px] font-medium leading-relaxed text-foreground sm:text-[19px]">
                      &ldquo;{t.text}&rdquo;
                    </blockquote>
                    <figcaption className="mt-7 flex items-center gap-3.5">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-800 text-[13px] font-bold text-white">
                        {t.initials}
                      </span>
                      <span>
                        <span className="block text-[14.5px] font-bold text-foreground">{t.name}</span>
                        <span className="block text-[12.5px] text-muted-foreground">{t.role}</span>
                      </span>
                      <span className="ml-auto hidden rounded-full bg-secondary px-2.5 py-1 text-[9px] font-bold tracking-wider text-primary-700 sm:block">
                        PILOT STORY
                      </span>
                    </figcaption>
                  </figure>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-2">
            {TESTIMONIALS.map((t, index) => (
              <button
                key={t.id}
                aria-label={`Show ${t.name}'s testimonial`}
                onClick={() => scrollTo(index)}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    index === selectedIndex ? "w-6 bg-primary-700" : "w-2 bg-primary-700/25",
                  )}
                />
              </button>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
