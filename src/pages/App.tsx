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
    <div className="min-h-screen bg-neutral p-8 font-sans">
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
