import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useApp } from "@/store/useApp"
import { createListing } from "@/lib/db"
import { sanitizeForLLM } from "@/lib/gemini"
import { ArrowLeft, Loader2 } from "lucide-react"
import type { ListingType } from "@/types"

const CITIES = ["Multan", "Lahore", "Faisalabad", "Islamabad", "Karachi", "Rawalpindi", "Vehari", "Khanewal", "Sahiwal", "Other"]
const CROPS = ["Tomato", "Potato", "Onion", "Mango", "Kinnow", "Banana", "Green Chili", "Okra", "Leafy Vegetables"]

const LISTING_TYPES: { value: ListingType; label: string; desc: string }[] = [
  { value: "lot", label: "Produce Lot", desc: "Sell your harvest" },
  { value: "buyer_request", label: "Buyer Request", desc: "Post what you want to buy" },
  { value: "transport_slot", label: "Transport Slot", desc: "Offer transport capacity" },
  { value: "storage_slot", label: "Storage Slot", desc: "Offer storage space" },
]

const inputCls =
  "h-11 w-full rounded-xl border border-input bg-background px-4 text-[14px] font-medium text-foreground outline-none ring-primary-400 transition-shadow placeholder:text-muted-foreground/60 focus:ring-2"
const labelCls = "mb-1.5 block text-[12px] font-bold text-foreground"

export default function CreateListingPage() {
  const navigate = useNavigate()
  const profile = useApp((s) => s.profile)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [listingType, setListingType] = useState<ListingType>("lot")
  const [commodity, setCommodity] = useState("Tomato")
  const [quantity, setQuantity] = useState("")
  const [unit, setUnit] = useState("kg")
  const [location, setLocation] = useState("Multan")
  const [price, setPrice] = useState("")
  const [availableFrom, setAvailableFrom] = useState("")
  const [availableTo, setAvailableTo] = useState("")

  // Lot-specific
  const [grade, setGrade] = useState("B")
  const [harvestDate, setHarvestDate] = useState("")
  const [packaging, setPackaging] = useState("crates")

  // Buyer request
  const [deliveryRegion, setDeliveryRegion] = useState("Lahore")
  const [priceCeiling, setPriceCeiling] = useState("")
  const [neededBy, setNeededBy] = useState("")

  // Transport
  const [vehicleType, setVehicleType] = useState("Covered Mazda")
  const [refrigerated, setRefrigerated] = useState(false)

  // Storage
  const [facilityType, setFacilityType] = useState("cold_storage")
  const [tempMin, setTempMin] = useState("2")
  const [tempMax, setTempMax] = useState("8")

  function buildAttributes(): Record<string, unknown> {
    // Phase 1.3: Sanitize free-text fields before sending to the database
    if (listingType === "lot") return { grade, harvestDate, packaging }
    if (listingType === "buyer_request") return { grade, deliveryRegion: sanitizeForLLM(deliveryRegion), priceCeiling: priceCeiling ? Number(priceCeiling) : undefined, neededBy }
    if (listingType === "transport_slot") return { vehicleType: sanitizeForLLM(vehicleType), refrigerated }
    if (listingType === "storage_slot") return { facilityType, tempRange: { min: Number(tempMin), max: Number(tempMax) } }
    return {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile?.id) { setError("You must be signed in."); return }
    if (!quantity) { setError("Quantity is required."); return }
    setError("")
    setLoading(true)
    try {
      await createListing({
        id: `listing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ownerUserId: profile.id,
        listingType,
        commodity,
        quantity: Number(quantity),
        unit,
        locationGeo: location,
        price: price ? Number(price) : null,
        availableFrom: availableFrom || null,
        availableTo: availableTo || null,
        attributes: buildAttributes(),
      })
      navigate("/listings")
    } catch (err: any) {
      setError(err.message ?? "Failed to create listing")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-extrabold text-foreground">Create Listing</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && (
          <div className="rounded-xl border border-risk/30 bg-risk/5 px-4 py-3 text-[13px] font-medium text-risk">
            {error}
          </div>
        )}

        {/* Listing Type */}
        <div>
          <label className={labelCls}>Listing Type</label>
          <div className="grid grid-cols-2 gap-2">
            {LISTING_TYPES.map((lt) => (
              <button
                key={lt.value}
                type="button"
                onClick={() => setListingType(lt.value)}
                className={
                  listingType === lt.value
                    ? "rounded-xl border-2 border-primary-600 bg-primary-600/5 px-3 py-2.5 text-left"
                    : "rounded-xl border border-border bg-card px-3 py-2.5 text-left hover:border-primary-300"
                }
              >
                <div className="text-[13px] font-bold text-foreground">{lt.label}</div>
                <div className="text-[11px] text-muted-foreground">{lt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Commodity (not for transport/storage) */}
        {(listingType === "lot" || listingType === "buyer_request") && (
          <div>
            <label className={labelCls}>Commodity</label>
            <select value={commodity} onChange={(e) => setCommodity(e.target.value)} className={inputCls}>
              {CROPS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        )}

        {/* Quantity + Unit */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className={labelCls}>Quantity</label>
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 800" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Unit</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls}>
              <option>kg</option>
              <option>units</option>
              <option>crates</option>
            </select>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className={labelCls}>Location</label>
          <select value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls}>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className={labelCls}>Price (PKR/{unit}, optional)</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 62" className={inputCls} />
        </div>

        {/* Availability Window */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Available From</label>
            <input type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Available To</label>
            <input type="date" value={availableTo} onChange={(e) => setAvailableTo(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* ─── Conditional fields by type ─── */}
        {listingType === "lot" && (
          <div className="flex flex-col gap-3.5 rounded-xl border border-border bg-card/50 p-4">
            <div className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Lot Details</div>
            <div>
              <label className={labelCls}>Grade</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className={inputCls}>
                <option>A</option><option>B</option><option>C</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Harvest Date</label>
              <input type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Packaging</label>
              <select value={packaging} onChange={(e) => setPackaging(e.target.value)} className={inputCls}>
                <option value="crates">Crates</option><option value="sacks">Sacks</option><option value="loose">Loose</option>
              </select>
            </div>
          </div>
        )}

        {listingType === "buyer_request" && (
          <div className="flex flex-col gap-3.5 rounded-xl border border-border bg-card/50 p-4">
            <div className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Buyer Request Details</div>
            <div>
              <label className={labelCls}>Delivery Region</label>
              <select value={deliveryRegion} onChange={(e) => setDeliveryRegion(e.target.value)} className={inputCls}>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Price Ceiling (PKR/kg)</label>
              <input type="number" value={priceCeiling} onChange={(e) => setPriceCeiling(e.target.value)} placeholder="e.g. 100" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Needed By</label>
              <input type="date" value={neededBy} onChange={(e) => setNeededBy(e.target.value)} className={inputCls} />
            </div>
          </div>
        )}

        {listingType === "transport_slot" && (
          <div className="flex flex-col gap-3.5 rounded-xl border border-border bg-card/50 p-4">
            <div className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Transport Details</div>
            <div>
              <label className={labelCls}>Vehicle Type</label>
              <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className={inputCls}>
                <option>Open Mazda</option><option>Covered Mazda</option><option>Shehzore</option>
                <option>Refrigerated Truck</option><option>Mini Loader</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" checked={refrigerated} onChange={(e) => setRefrigerated(e.target.checked)} className="peer sr-only" />
                <div className="h-6 w-11 rounded-full bg-muted peer-checked:bg-primary-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
              </label>
              <span className="text-[13px] font-medium text-foreground">Refrigerated</span>
            </div>
          </div>
        )}

        {listingType === "storage_slot" && (
          <div className="flex flex-col gap-3.5 rounded-xl border border-border bg-card/50 p-4">
            <div className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Storage Details</div>
            <div>
              <label className={labelCls}>Facility Type</label>
              <select value={facilityType} onChange={(e) => setFacilityType(e.target.value)} className={inputCls}>
                <option value="cold_storage">Cold Storage</option>
                <option value="dry_warehouse">Dry Warehouse</option>
                <option value="controlled_atmosphere">Controlled Atmosphere</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Temp Min (C)</label>
                <input type="number" value={tempMin} onChange={(e) => setTempMin(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Temp Max (C)</label>
                <input type="number" value={tempMax} onChange={(e) => setTempMax(e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary-600 text-[14px] font-bold text-white shadow-glow transition-colors hover:bg-primary-700 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Creating…" : "Create Listing"}
        </button>
      </form>
    </div>
  )
}
