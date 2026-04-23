"use client"

/** Valores fijos por barra: el SSR y el cliente deben coincidir (no usar Math.random en render). */
const BAR_HEIGHTS_PX = [14, 20, 11, 18, 16]
const BAR_DURATION_S = [0.92, 1.05, 0.88, 1.12, 0.97]

export function SoundWave() {
  return (
    <div className="flex items-center gap-0.5 h-6">
      {BAR_HEIGHTS_PX.map((heightPx, i) => (
        <div
          key={i}
          className="w-1 bg-primary rounded-full animate-pulse"
          style={{
            height: `${heightPx}px`,
            animationDelay: `${i * 0.15}s`,
            animationDuration: `${BAR_DURATION_S[i]}s`,
          }}
        />
      ))}
    </div>
  )
}
