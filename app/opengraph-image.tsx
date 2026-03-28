import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Connect2Kehilla — SMS Business Directory'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #1e40af 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            fontSize: 80,
            marginBottom: 20,
            display: 'flex',
          }}
        >
          📱
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: 'white',
            textAlign: 'center',
            letterSpacing: '-2px',
            display: 'flex',
          }}
        >
          Connect2Kehilla
        </div>
        <div
          style={{
            fontSize: 28,
            color: 'rgba(255,255,255,0.85)',
            textAlign: 'center',
            marginTop: 16,
            maxWidth: 700,
            display: 'flex',
          }}
        >
          SMS Business Directory for the Jewish Community
        </div>
        <div
          style={{
            display: 'flex',
            gap: 32,
            marginTop: 40,
            color: 'rgba(255,255,255,0.7)',
            fontSize: 20,
          }}
        >
          <span style={{ display: 'flex' }}>Text Your Need</span>
          <span style={{ display: 'flex' }}>·</span>
          <span style={{ display: 'flex' }}>Get Contacts</span>
          <span style={{ display: 'flex' }}>·</span>
          <span style={{ display: 'flex' }}>Instant Results</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
