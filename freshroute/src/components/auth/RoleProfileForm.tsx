import { useState } from "react"
import type {
  UserRoleType,
  FarmerProfile,
  BuyerProfile,
  TransporterProfile,
  StorageProviderProfile,
  RoleProfileData,
} from "@/types"

const CITIES = ["Multan", "Lahore", "Faisalabad", "Islamabad", "Karachi", "Rawalpindi", "Vehari", "Khanewal", "Sahiwal", "Other"]
const CROPS = ["Tomato", "Potato", "Onion", "Mango", "Kinnow", "Banana", "Green Chili", "Okra", "Leafy Vegetables"]

interface Props {
  role: UserRoleType
  initialData?: RoleProfileData
  onSubmit: (data: RoleProfileData) => void | Promise<void>
  submitLabel?: string
}

/**
 * Generic role-profile form that renders different field sets based on the role.
 * Used during onboarding and in profile settings.
 */
export function RoleProfileForm({ role, initialData, onSubmit, submitLabel = "Save Profile" }: Props) {
  const [saving, setSaving] = useState(false)

  if (role === "farmer") {
    return <FarmerFields initial={initialData as FarmerProfile | undefined} onSubmit={onSubmit} saving={saving} setSaving={setSaving} label={submitLabel} />
  }
  if (role === "buyer") {
    return <BuyerFields initial={initialData as BuyerProfile | undefined} onSubmit={onSubmit} saving={saving} setSaving={setSaving} label={submitLabel} />
  }
  if (role === "transporter") {
    return <TransporterFields initial={initialData as TransporterProfile | undefined} onSubmit={onSubmit} saving={saving} setSaving={setSaving} label={submitLabel} />
  }
  if (role === "storage_provider") {
    return <StorageFields initial={initialData as StorageProviderProfile | undefined} onSubmit={onSubmit} saving={saving} setSaving={setSaving} label={submitLabel} />
  }
  return null
}

/* ─── shared input class ─── */
const inputCls =
  "h-11 w-full rounded-xl border border-input bg-background px-4 text-[14px] font-medium text-foreground outline-none ring-primary-400 transition-shadow placeholder:text-muted-foreground/60 focus:ring-2"
const labelCls = "mb-1.5 block text-[12px] font-bold text-foreground"
const btnCls =
  "mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 text-[14px] font-bold text-white shadow-glow transition-colors hover:bg-primary-700 disabled:opacity-60"

/* ──────────────────────────── Farmer ──────────────────────────── */

function FarmerFields({
  initial,
  onSubmit,
  saving,
  setSaving,
  label,
}: {
  initial?: FarmerProfile
  onSubmit: (d: RoleProfileData) => void | Promise<void>
  saving: boolean
  setSaving: (b: boolean) => void
  label: string
}) {
  const [farmLocation, setFarmLocation] = useState(initial?.farmLocation ?? "Multan")
  const [primaryCrops, setPrimaryCrops] = useState<string[]>(initial?.primaryCrops ?? ["Tomato"])

  const toggleCrop = (crop: string) => {
    setPrimaryCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSubmit({ farmLocation, primaryCrops })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div>
        <label className={labelCls}>Farm Location</label>
        <select value={farmLocation} onChange={(e) => setFarmLocation(e.target.value)} className={inputCls}>
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>Primary Crops</label>
        <div className="flex flex-wrap gap-2">
          {CROPS.map((crop) => (
            <button
              key={crop}
              type="button"
              onClick={() => toggleCrop(crop)}
              className={
                primaryCrops.includes(crop)
                  ? "rounded-full bg-primary-600 px-3 py-1 text-[12px] font-bold text-white"
                  : "rounded-full border border-border bg-background px-3 py-1 text-[12px] font-medium text-muted-foreground hover:border-primary-300"
              }
            >
              {crop}
            </button>
          ))}
        </div>
      </div>
      <button type="submit" disabled={saving} className={btnCls}>
        {saving ? "Saving…" : label}
      </button>
    </form>
  )
}

/* ──────────────────────────── Buyer ──────────────────────────── */

function BuyerFields({
  initial,
  onSubmit,
  saving,
  setSaving,
  label,
}: {
  initial?: BuyerProfile
  onSubmit: (d: RoleProfileData) => void | Promise<void>
  saving: boolean
  setSaving: (b: boolean) => void
  label: string
}) {
  const [orgName, setOrgName] = useState(initial?.orgName ?? "")
  const [typicalCommodities, setTypicalCommodities] = useState<string[]>(initial?.typicalCommodities ?? ["Tomato"])
  const [deliveryRegions, setDeliveryRegions] = useState<string[]>(initial?.deliveryRegions ?? ["Lahore"])
  const [priceCeiling, setPriceCeiling] = useState(initial?.priceCeiling?.toString() ?? "")

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((c) => c !== item) : [...list, item])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSubmit({
        orgName,
        typicalCommodities,
        deliveryRegions,
        priceCeiling: priceCeiling ? Number(priceCeiling) : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div>
        <label className={labelCls}>Organization Name</label>
        <input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. Metro Fresh Retail" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Commodities of Interest</label>
        <div className="flex flex-wrap gap-2">
          {CROPS.map((crop) => (
            <button
              key={crop}
              type="button"
              onClick={() => toggleItem(typicalCommodities, setTypicalCommodities, crop)}
              className={
                typicalCommodities.includes(crop)
                  ? "rounded-full bg-primary-600 px-3 py-1 text-[12px] font-bold text-white"
                  : "rounded-full border border-border bg-background px-3 py-1 text-[12px] font-medium text-muted-foreground hover:border-primary-300"
              }
            >
              {crop}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={labelCls}>Delivery Regions</label>
        <div className="flex flex-wrap gap-2">
          {CITIES.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => toggleItem(deliveryRegions, setDeliveryRegions, city)}
              className={
                deliveryRegions.includes(city)
                  ? "rounded-full bg-primary-600 px-3 py-1 text-[12px] font-bold text-white"
                  : "rounded-full border border-border bg-background px-3 py-1 text-[12px] font-medium text-muted-foreground hover:border-primary-300"
              }
            >
              {city}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={labelCls}>Price Ceiling (PKR/kg, optional)</label>
        <input type="number" value={priceCeiling} onChange={(e) => setPriceCeiling(e.target.value)} placeholder="e.g. 100" className={inputCls} />
      </div>
      <button type="submit" disabled={saving} className={btnCls}>
        {saving ? "Saving…" : label}
      </button>
    </form>
  )
}

/* ──────────────────────────── Transporter ──────────────────────────── */

function TransporterFields({
  initial,
  onSubmit,
  saving,
  setSaving,
  label,
}: {
  initial?: TransporterProfile
  onSubmit: (d: RoleProfileData) => void | Promise<void>
  saving: boolean
  setSaving: (b: boolean) => void
  label: string
}) {
  const [vehicleType, setVehicleType] = useState(initial?.vehicleType ?? "Open Mazda")
  const [capacityKg, setCapacityKg] = useState(initial?.capacityKg?.toString() ?? "1500")
  const [refrigerated, setRefrigerated] = useState(initial?.refrigerated ?? false)
  const [serviceArea, setServiceArea] = useState(initial?.serviceArea ?? "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSubmit({
        vehicleType,
        capacityKg: Number(capacityKg) || undefined,
        refrigerated,
        serviceArea,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div>
        <label className={labelCls}>Vehicle Type</label>
        <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className={inputCls}>
          <option>Open Mazda</option>
          <option>Covered Mazda</option>
          <option>Shehzore</option>
          <option>Refrigerated Truck</option>
          <option>Mini Loader</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Capacity (kg)</label>
        <input type="number" value={capacityKg} onChange={(e) => setCapacityKg(e.target.value)} placeholder="e.g. 1500" className={inputCls} />
      </div>
      <div className="flex items-center gap-3">
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={refrigerated}
            onChange={(e) => setRefrigerated(e.target.checked)}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-muted peer-checked:bg-primary-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
        </label>
        <span className="text-[13px] font-medium text-foreground">Refrigerated vehicle</span>
      </div>
      <div>
        <label className={labelCls}>Service Area / Routes</label>
        <input value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} placeholder="e.g. Multan–Lahore corridor" className={inputCls} />
      </div>
      <button type="submit" disabled={saving} className={btnCls}>
        {saving ? "Saving…" : label}
      </button>
    </form>
  )
}

/* ──────────────────────────── Storage Provider ──────────────────────────── */

function StorageFields({
  initial,
  onSubmit,
  saving,
  setSaving,
  label,
}: {
  initial?: StorageProviderProfile
  onSubmit: (d: RoleProfileData) => void | Promise<void>
  saving: boolean
  setSaving: (b: boolean) => void
  label: string
}) {
  const [facilityType, setFacilityType] = useState(initial?.facilityType ?? "cold_storage")
  const [capacityUnits, setCapacityUnits] = useState(initial?.capacityUnits?.toString() ?? "")
  const [tempMin, setTempMin] = useState(initial?.tempRange?.min?.toString() ?? "2")
  const [tempMax, setTempMax] = useState(initial?.tempRange?.max?.toString() ?? "8")
  const [certifications, setCertifications] = useState(initial?.certifications?.join(", ") ?? "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSubmit({
        facilityType,
        capacityUnits: capacityUnits ? Number(capacityUnits) : undefined,
        tempRange: { min: Number(tempMin), max: Number(tempMax) },
        certifications: certifications
          ? certifications.split(",").map((c) => c.trim()).filter(Boolean)
          : [],
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div>
        <label className={labelCls}>Facility Type</label>
        <select value={facilityType} onChange={(e) => setFacilityType(e.target.value)} className={inputCls}>
          <option value="cold_storage">Cold Storage</option>
          <option value="dry_warehouse">Dry Warehouse</option>
          <option value="controlled_atmosphere">Controlled Atmosphere</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Capacity (units)</label>
        <input type="number" value={capacityUnits} onChange={(e) => setCapacityUnits(e.target.value)} placeholder="e.g. 5000" className={inputCls} />
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
      <div>
        <label className={labelCls}>Certifications (comma-separated)</label>
        <input value={certifications} onChange={(e) => setCertifications(e.target.value)} placeholder="e.g. ISO 22000, HACCP" className={inputCls} />
      </div>
      <button type="submit" disabled={saving} className={btnCls}>
        {saving ? "Saving…" : label}
      </button>
    </form>
  )
}
