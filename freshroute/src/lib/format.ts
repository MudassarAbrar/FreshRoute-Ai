export const pkr = (n: number) =>
  "PKR " + Math.round(n).toLocaleString("en-PK")

export const pkrShort = (n: number) => {
  if (n >= 100000) return "PKR " + (n / 100000).toFixed(1) + " lac"
  return pkr(n)
}

export const clock = (t: number) => {
  const d = new Date(t)
  let h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, "0")
  const ap = h >= 12 ? "PM" : "AM"
  h = h % 12 || 12
  return `${h}:${m} ${ap}`
}

export const uid = () => Math.random().toString(36).slice(2, 9)

export const maund = (kg: number) => (kg / 37.32).toFixed(1)
