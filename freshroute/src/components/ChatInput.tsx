import { useState, useRef, useCallback, useEffect } from "react"
import { Mic, Paperclip, Send, Square, AlertCircle } from "lucide-react"
import { onUserText, onVoiceNote } from "@/store/director"
import { useApp } from "@/store/useApp"
import { t } from "@/i18n"

/* Extend Window for Web Speech API */
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

export function ChatInput() {
  const [value, setValue] = useState("")
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [voiceError, setVoiceError] = useState("")
  const lang = useApp((s) => s.lang)
  const setSheet = useApp((s) => s.setSheet)
  const recognitionRef = useRef<any>(null)

  const send = () => {
    const v = value.trim()
    if (!v) return
    setValue("")
    onUserText(v)
  }

  const speechSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)

  const startRecording = useCallback(() => {
    if (!speechSupported) {
      setVoiceError("Speech recognition is not supported in this browser. Try Chrome or Edge.")
      // Fall back to demo voice
      onVoiceNote()
      return
    }

    setVoiceError("")
    setTranscript("")
    setRecording(true)

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.lang = lang === "ur" ? "ur-PK" : "en-PK"
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    let finalTranscript = ""

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " "
        } else {
          interim += result[0].transcript
        }
      }
      setTranscript(finalTranscript + interim)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") {
        setVoiceError("No speech detected. Please try again and speak clearly.")
      } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setVoiceError("Microphone access denied. Please allow microphone access in your browser settings.")
      } else if (event.error === "audio-capture") {
        setVoiceError("No microphone found. Please connect a microphone and try again.")
      } else {
        setVoiceError(`Speech recognition error: ${event.error}`)
      }
      setRecording(false)
    }

    recognition.onend = () => {
      setRecording(false)
      if (finalTranscript.trim()) {
        // Populate the input field with the transcript for review before sending
        setValue(finalTranscript.trim())
        setTranscript("")
      } else if (!voiceError) {
        setVoiceError("No speech was captured. Please try again.")
      }
    }

    try {
      recognition.start()
    } catch {
      setVoiceError("Failed to start speech recognition. Please try again.")
      setRecording(false)
    }
  }, [lang, speechSupported, voiceError])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setRecording(false)
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  return (
    <footer className="relative z-10 border-t border-border/70 bg-card px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
      {/* Voice error banner */}
      {voiceError && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-risk/10 px-3 py-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-risk" />
          <p className="flex-1 text-[11px] font-medium text-risk">{voiceError}</p>
          <button onClick={() => setVoiceError("")} className="text-[11px] font-bold text-risk hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          onClick={() => setSheet("photos")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary-700 transition-all hover:bg-primary-100 active:scale-95"
          aria-label="Attach photos"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        {recording ? (
          <div className="flex h-11 flex-1 items-center gap-3 rounded-full border border-risk/40 bg-risk/5 px-4">
            <span className="h-2.5 w-2.5 animate-pulse-dot rounded-full bg-risk" />
            <span className="text-[13px] font-bold text-risk">Listening…</span>
            <div className="flex flex-1 items-center gap-[3px]">
              {Array.from({ length: 14 }).map((_, i) => (
                <span
                  key={i}
                  className="w-[3px] animate-pulse-dot rounded-full bg-risk/60"
                  style={{ height: `${6 + Math.abs(Math.sin(i * 1.3)) * 14}px`, animationDelay: `${i * 0.07}s` }}
                />
              ))}
            </div>
            {transcript && (
              <span className="max-w-[120px] truncate text-[11px] text-risk/70">{transcript}</span>
            )}
            <button onClick={stopRecording} className="flex h-7 w-7 items-center justify-center rounded-full bg-risk text-white" aria-label="Stop recording">
              <Square className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={t(lang, "inputPlaceholder")}
            className="h-11 min-w-0 flex-1 rounded-full border border-input bg-background px-4 text-[14px] font-medium text-foreground outline-none ring-primary-400 transition-shadow placeholder:text-muted-foreground/70 focus:ring-2"
          />
        )}

        {value.trim() && !recording ? (
          <button
            onClick={send}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white shadow-glow transition-all hover:bg-primary-700 active:scale-95"
            aria-label="Send"
          >
            <Send className="h-5 w-5" />
          </button>
        ) : (
          !recording && (
            <button
              onClick={startRecording}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary-700 transition-all hover:bg-primary-100 active:scale-95"
              aria-label="Voice note"
            >
              <Mic className="h-5 w-5" />
            </button>
          )
        )}
      </div>
    </footer>
  )
}
