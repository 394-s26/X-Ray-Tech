import { useState } from 'react'

type OverlayType = 'bottom' | 'center' | null

function App() {
  const [overlay, setOverlay] = useState<OverlayType>(null)
  const [overlaySize, setOverlaySize] = useState<'lg' | 'md' | 'sm'>('md')

  function openOverlay(type: OverlayType, size: 'lg' | 'md' | 'sm' = 'md') {
    setOverlaySize(size)
    setOverlay(type)
  }

  return (
    <div className="min-h-screen p-8 font-sans">
      <h1 className="text-2xl font-bold text-primary mb-1">UI Component Demo</h1>
      <p className="text-gray-500 mb-10 text-sm">Showcasing buttons and overlays from index.css</p>

      {/* Buttons */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Buttons</h2>
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <button className="global-btn default-btn">Primary</button>
          <button className="global-btn red-btn">Destructive</button>
          <button className="global-btn orange-btn">Warning</button>
          <button className="global-btn cancel-btn">Cancel</button>
          <button className="global-btn default-btn" disabled>Disabled</button>
          <button className="global-btn red-btn" disabled>Disabled Red</button>
          <button className="global-btn default-btn outline">Primary Outline</button>
          <button className="global-btn red-btn outline">Red Outline</button>
          <button className="global-btn orange-btn outline">Orange Outline</button>
        </div>
      </section>

      {/* Cards */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Cards</h2>
        <div className="flex flex-col gap-4 max-w-sm">
          <div className="card card--sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Small</p>
            <p className="text-gray-700 text-sm">Compact card for tight layouts or inline info.</p>
          </div>
          <div className="card card--md">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Medium</p>
            <p className="text-gray-700 text-sm">Standard card size — good for most content blocks.</p>
          </div>
          <div className="card card--lg">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Large</p>
            <p className="text-gray-700 text-sm">Spacious card for featured or detail-heavy content.</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 max-w-sm mt-4">
          <div className="card card--md card--primary">
            <p className="text-xs font-semibold text-primary/60 uppercase tracking-wide mb-1">Primary</p>
            <p className="text-primary text-sm">Tinted with the brand's primary color.</p>
          </div>
          <div className="card card--md card--orange">
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-1">Orange</p>
            <p className="text-orange-800 text-sm">Warm orange tint for warnings or highlights.</p>
          </div>
          <div className="card card--md card--red">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Red</p>
            <p className="text-red-800 text-sm">Red tint for errors or destructive context.</p>
          </div>
        </div>
      </section>

      {/* Bottom sheet overlays */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Bottom Sheet Overlays</h2>
        <div className="grid grid-cols-3 gap-4 max-w-sm">
          <button className="global-btn default-btn" onClick={() => openOverlay('bottom', 'sm')}>Small</button>
          <button className="global-btn default-btn" onClick={() => openOverlay('bottom', 'md')}>Medium</button>
          <button className="global-btn default-btn" onClick={() => openOverlay('bottom', 'lg')}>Large</button>
        </div>
      </section>

      {/* Center overlays */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Center Overlays</h2>
        <div className="grid grid-cols-3 gap-4 max-w-sm">
          <button className="global-btn orange-btn" onClick={() => openOverlay('center', 'sm')}>Small</button>
          <button className="global-btn orange-btn" onClick={() => openOverlay('center', 'md')}>Medium</button>
          <button className="global-btn orange-btn" onClick={() => openOverlay('center', 'lg')}>Large</button>
        </div>
      </section>

      {/* Bottom sheet overlay */}
      {overlay === 'bottom' && (
        <div className="overlay-bottom">
          <div className="overlay-scrim" onClick={() => setOverlay(null)} />
          <div className={`overlay-panel overlay-panel--${overlaySize} animate-slide-up rounded-t-2xl p-6`}>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Bottom Sheet — {overlaySize.toUpperCase()}</h3>
            <p className="text-gray-500 text-sm mb-6">
              This panel slides up from the bottom. The scrim behind it is clickable to dismiss.
            </p>
            <div className="flex gap-3">
              <button className="global-btn default-btn">Confirm</button>
              <button className="global-btn cancel-btn" onClick={() => setOverlay(null)}>Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* Center overlay */}
      {overlay === 'center' && (
        <div className="overlay-center" onClick={() => setOverlay(null)}>
          <div
            className={`overlay-panel overlay-panel--${overlaySize} rounded-2xl p-6`}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Center Dialog — {overlaySize.toUpperCase()}</h3>
            <p className="text-gray-500 text-sm mb-6">
              This dialog is centered on screen with a dark scrim. Click outside to close.
            </p>
            <div className="flex gap-3">
              <button className="global-btn red-btn">Delete</button>
              <button className="global-btn cancel-btn" onClick={() => setOverlay(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
