import { useState, useEffect } from 'react'
import type { User } from 'firebase/auth'
import { FormSelect } from '../components/FormSelect'
import TimeSelect from '../components/TimeSelect'
import { currentTimeRounded } from '../components/timeUtils'
import { subscribeToAuthState } from '../services/authService'
import { LoginPage } from './LoginPage'

type OverlayType = 'bottom' | 'center' | null

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [overlay, setOverlay] = useState<OverlayType>(null)
  const [overlaySize, setOverlaySize] = useState<'lg' | 'md' | 'sm'>('md')
  const [startTime, setStartTime] = useState(currentTimeRounded)
  const [endTime, setEndTime] = useState(currentTimeRounded)

  useEffect(() => {
    return subscribeToAuthState((u) => {
      setUser(u)
      setAuthLoading(false)
    })
  }, [])

  if (authLoading) return null
  if (!user) return <LoginPage />

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
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Cards — Sizes</h2>
        <div className="flex flex-col gap-4 max-w-sm">
          <div className="card card--sm">
            <p className="card-header">Small</p>
            <p className="text-gray-700 text-sm">Compact card for tight layouts or inline info.</p>
          </div>
          <div className="card card--md">
            <p className="card-header">Medium</p>
            <p className="text-gray-700 text-sm">Standard card size — good for most content blocks.</p>
          </div>
          <div className="card card--lg">
            <p className="card-header">Large</p>
            <p className="text-gray-700 text-sm">Spacious card for featured or detail-heavy content.</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-700 mt-8 mb-4">Cards — Colors</h2>
        <div className="flex flex-col gap-4 max-w-sm">
          <div className="card card--md card--primary">
            <p className="card-header">Primary</p>
            <p className="text-primary text-sm">Tinted with the brand's primary color.</p>
          </div>
          <div className="card card--md card--orange">
            <p className="card-header">Orange</p>
            <p className="text-orange-800 text-sm">Warm orange tint for warnings or highlights.</p>
          </div>
          <div className="card card--md card--red">
            <p className="card-header">Red</p>
            <p className="text-red-800 text-sm">Red tint for errors or destructive context.</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-700 mt-8 mb-4">Cards — Image positions</h2>
        <div className="flex flex-col gap-4 max-w-sm">
          <div className="card card--md">
            <img className="card-img card-img--top h-32" src="https://picsum.photos/seed/top/400/200" alt="" />
            <p className="card-header">Image top</p>
            <p className="text-gray-700 text-sm">Image is flush against the top edge.</p>
          </div>
          <div className="card card--md">
            <p className="card-header">Image bottom</p>
            <p className="text-gray-700 text-sm">Image is flush against the bottom edge.</p>
            <img className="card-img card-img--bottom h-32" src="https://picsum.photos/seed/bottom/400/200" alt="" />
          </div>
          <div className="card card--md card--row">
            <img className="card-img card-img--left w-24" src="https://picsum.photos/seed/left/200/300" alt="" />
            <div className="card-body">
              <p className="card-header">Image left</p>
              <p className="text-gray-700 text-sm">Image is flush against the left edge.</p>
            </div>
          </div>
          <div className="card card--md card--row">
            <div className="card-body">
              <p className="card-header">Image right</p>
              <p className="text-gray-700 text-sm">Image is flush against the right edge.</p>
            </div>
            <img className="card-img card-img--right w-24" src="https://picsum.photos/seed/right/200/300" alt="" />
          </div>
        </div>
      </section>

      {/* Forms */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Form Inputs</h2>
        <div className="flex flex-col gap-5 max-w-sm">

          <div className="form-field">
            <label className="form-label">Text input</label>
            <input className="form-input" type="text" placeholder="Enter some text…" />
          </div>

          <div className="form-field">
            <label className="form-label">Text input (disabled)</label>
            <input className="form-input" type="text" placeholder="Not editable" disabled />
          </div>

          <div className="form-field">
            <label className="form-label">Textarea</label>
            <textarea className="form-textarea" rows={3} placeholder="Write something longer…" />
          </div>

          <div className="form-field">
            <label className="form-label">Number</label>
            <input className="form-number" type="number" placeholder="0" />
          </div>

          <div className="form-field">
            <label className="form-label">Dropdown</label>
            <FormSelect
              options={[
                { value: 'a', label: 'Option A' },
                { value: 'b', label: 'Option B' },
                { value: 'c', label: 'Option C' },
              ]}
              placeholder="Select an option…"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Dropdown (disabled)</label>
            <FormSelect
              options={[{ value: 'x', label: 'Not selectable' }]}
              disabled
            />
          </div>

          <div className="form-field">
            <label className="form-label">Searchable dropdown</label>
            <FormSelect
              searchable
              options={[
                { value: 'a', label: 'Option A' },
                { value: 'b', label: 'Option B' },
                { value: 'c', label: 'Option C' },
                { value: 'd', label: 'Option D' },
                { value: 'e', label: 'Option E' },
              ]}
              placeholder="Type to filter…"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Time</label>
            <TimeSelect value={startTime} onChange={setStartTime} />
          </div>

          <div className="form-field">
            <label className="form-label">Time range</label>
            <div className="flex items-center gap-2">
              <TimeSelect value={startTime} onChange={setStartTime} />
              <span className="text-gray-400 text-sm">to</span>
              <TimeSelect value={endTime} onChange={setEndTime} />
            </div>
          </div>

          <div className="form-field">
            <p className="form-label">Checkboxes</p>
            <label className="form-check-row">
              <input className="form-checkbox" type="checkbox" defaultChecked />
              Option A (checked)
            </label>
            <label className="form-check-row">
              <input className="form-checkbox" type="checkbox" />
              Option B
            </label>
            <label className="form-check-row">
              <input className="form-checkbox" type="checkbox" disabled />
              Option C (disabled)
            </label>
          </div>

          <div className="form-field">
            <p className="form-label">Radio buttons</p>
            <label className="form-check-row">
              <input className="form-radio" type="radio" name="demo-radio" defaultChecked />
              Choice 1 (selected)
            </label>
            <label className="form-check-row">
              <input className="form-radio" type="radio" name="demo-radio" />
              Choice 2
            </label>
            <label className="form-check-row">
              <input className="form-radio" type="radio" name="demo-radio" disabled />
              Choice 3 (disabled)
            </label>
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
