import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { fetchListings } from "@/lib/db"
import { useApp } from "@/store/useApp"
import { Plus, Filter, Loader2 } from "lucide-react"
import type { Listing, ListingType } from "@/types"

const TYPE_LABELS: Record<ListingType, string> = {
  lot: "Produce Lot",
  storage_slot: "Storage Slot",
  transport_slot: "Transport Slot",
  buyer_request: "Buyer Request",
}

const TYPE_COLORS: Record<ListingType, string> = {
  lot: "bg-green-100 text-green-800",
  storage_slot: "bg-blue-100 text-blue-800",
  transport_slot: "bg-amber-100 text-amber-800",
  buyer_request: "bg-purple-100 text-purple-800",
}

const FILTERS: { value: ListingType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "lot", label: "Lots" },
  { value: "buyer_request", label: "Buyer Requests" },
  { value: "transport_slot", label: "Transport" },
  { value: "storage_slot", label: "Storage" },
]

export default function BrowseListingsPage() {
  const navigate = useNavigate()
  const userRoles = useApp((s) => s.userRoles)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ListingType | "all">("all")

  useEffect(() => {
    setLoading(true)
    const typeFilter = filter === "all" ? undefined : filter
    fetchListings({ listingType: typeFilter, status: "active", limit: 50 })
      .then(setListings)
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }, [filter])

  const roles = userRoles.map((r) => r.role)
  const showCreateHint =
    roles.includes("farmer") ? "Post your harvest as a lot" :
    roles.includes("buyer") ? "Post a buyer request" :
    roles.includes("transporter") ? "Offer transport capacity" :
    roles.includes("storage_provider") ? "Offer storage space" :
    null

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-foreground">Marketplace</h1>
        <button
          onClick={() => navigate("/listings/new")}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-primary-600 px-4 text-[13px] font-bold text-white shadow-glow hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          New Listing
        </button>
      </div>

      <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={
              filter === f.value
                ? "shrink-0 rounded-full bg-primary-600 px-3 py-1 text-[12px] font-bold text-white"
                : "shrink-0 rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium text-muted-foreground hover:border-primary-300"
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="text-4xl">📦</div>
          <p className="text-[14px] font-medium text-muted-foreground">No active listings found.</p>
          {showCreateHint && (
            <button
              onClick={() => navigate("/listings/new")}
              className="mt-2 rounded-xl bg-primary-600 px-5 py-2 text-[13px] font-bold text-white hover:bg-primary-700"
            >
              {showCreateHint}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}

function ListingCard({ listing }: { listing: Listing }) {
  const attrs = listing.attributes ?? {}
  return (
    <div className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TYPE_COLORS[listing.listingType]}`}>
              {TYPE_LABELS[listing.listingType]}
            </span>
            <span className="text-[13px] font-bold text-foreground">{listing.commodity}</span>
          </div>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {listing.quantity.toLocaleString()} {listing.unit} &middot; {listing.locationGeo}
          </p>
        </div>
        {listing.price != null && (
          <div className="text-right">
            <div className="text-[15px] font-extrabold text-foreground">PKR {listing.price}</div>
            <div className="text-[10px] text-muted-foreground">per {listing.unit}</div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {!!attrs.grade && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">Grade {String(attrs.grade)}</span>}
        {!!attrs.packaging && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">{String(attrs.packaging)}</span>}
        {attrs.refrigerated === true && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">Refrigerated</span>}
        {!!attrs.facilityType && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">{String(attrs.facilityType).replace(/_/g, " ")}</span>}
        {!!attrs.deliveryRegion && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">{`Delivery: ${String(attrs.deliveryRegion)}`}</span>}
      </div>
      <div className="text-[10px] text-muted-foreground/70">
        {new Date(listing.createdAt).toLocaleDateString()}
      </div>
    </div>
  )
}
