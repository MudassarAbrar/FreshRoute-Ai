export type Lang = "en" | "ur"

type Dict = Record<string, { en: string; ur: string }>

const D: Dict = {
  inputPlaceholder: { en: "Message FreshRoute…", ur: "FreshRoute کو پیغام لکھیں…" },
  online: { en: "online", ur: "آن لائن" },
  aiAgent: { en: "AI Selling Agent", ur: "AI سیلنگ ایجنٹ" },
  proceed: { en: "Proceed with recommendation", ur: "تجویز مان لیں" },
  showNumbers: { en: "Show all numbers", ur: "تمام اعداد دکھائیں" },
  whyBuyer: { en: "Why this buyer?", ur: "یہ خریدار کیوں؟" },
  attach: { en: "Attach photos", ur: "تصاویر بھیجیں" },
  skip: { en: "Skip photos", ur: "تصاویر چھوڑیں" },
  approve: { en: "Approve & send", ur: "منظور اور بھیجیں" },
  reject: { en: "Not now", ur: "ابھی نہیں" },
  book: { en: "Approve & book", ur: "منظور اور بک کریں" },
  newLot: { en: "Start a new lot", ur: "نئی فصل شروع کریں" },
  tomatoes: { en: "800 kg tomatoes in Multan", ur: "ملتان میں 800 کلو ٹماٹر" },
  voice: { en: "Send a voice note", ur: "آواز کا پیغام بھیجیں" },
  prices: { en: "Show mandi prices", ur: "منڈی کے ریٹ دکھائیں" },
  whereTruck: { en: "Where is my truck?", ur: "میرا ٹرک کہاں ہے؟" },
  whereLot: { en: "Where is my lot?", ur: "میری فصل کہاں ہے؟" },
  auditLog: { en: "Action log", ur: "کارروائی کا ریکارڈ" },
  settings: { en: "Settings", ur: "سیٹنگز" },
  demoMode: { en: "Demo mode", ur: "ڈیمو موڈ" },
  liveMode: { en: "Live Gemini", ur: "لائیو Gemini" },
  confirm: { en: "Confirm", ur: "تصدیق کریں" },
  great: { en: "Great", ur: "بہت خوب" },
  verified: { en: "Verified", ur: "تصدیق شدہ" },
  // Agent messages
  readingMessage: { en: "Reading your message…", ur: "آپ کا پیغام پڑھ رہا ہوں…" },
  checkingPrices: { en: "Checking prices in 5 markets…", ur: "5 منڈیوں میں ریٹ چیک کر رہا ہوں…" },
  analyzingPhotos: { en: "Analyzing photos…", ur: "تصاویر کا تجزیہ کر رہا ہوں…" },
  lotCreated: { en: "Lot created ✓", ur: "لاٹ بن گئی ✓" },
  orderConfirmed: { en: "Order confirmed ✓", ur: "آرڈر کی تصدیق ہوگئی ✓" },
  saleCompleted: { en: "Sale completed 🎉", ur: "فروخت مکمل 🎉" },
  noPhotosEstimate: { en: "No problem — I'll estimate from your description only. Confidence will be lower.", ur: "کوئی مسئلہ نہیں — میں صرف آپ کی تفصیل سے تخمینہ لگاؤں گا۔ اعتماد کم ہوگا۔" },
  clarifyQuestions: { en: "A few quick questions to price this accurately:", ur: "درست قیمت کے لیے چند مختصر سوالات:" },
  comparingMarkets: { en: "Confirmed ✓ Comparing markets, buyer demand, transport and spoilage…", ur: "تصدیق ✓ منڈیوں، خریداروں، ٹرانسپورٹ اور خرابی کا موازنہ کر رہا ہوں…" },
  transcribed: { en: "Transcribed ✓", ur: "تبدیل ✓" },
  demoMarketData: { en: "Demo market data", ur: "ڈیمو منڈی ڈیٹا" },
  liveMarketData: { en: "Live market data", ur: "لائیو منڈی ڈیٹا" },
}

export function t(lang: Lang, key: keyof typeof D | string): string {
  const entry = D[key as keyof typeof D]
  if (!entry) return key
  return entry[lang]
}
