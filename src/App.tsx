import { useState } from 'react'

// Static fixtures keep this module focused on layout and accessible HTML.
type Metric = {
  label: string
  value: string
  change: string
  description: string
}

const metrics: Metric[] = [
  { label: 'Active Users', value: '24,892', change: '+12.8%', description: 'vs. previous 24 hours' },
  { label: 'Total Events', value: '148,206', change: '+8.2%', description: 'vs. previous 24 hours' },
  { label: 'Error Rate', value: '0.12%', change: '−0.04 pp', description: 'vs. previous 24 hours' },
  { label: 'System Health', value: 'Healthy', change: 'All operational', description: 'All 6 services available' },
]

const navigation = [
  { label: 'Dashboard', href: '#dashboard', icon: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z' },
  { label: 'Analytics', href: '#analytics', icon: 'M4 20V10 M12 20V4 M20 20v-7' },
  { label: 'Events', href: '#events', icon: 'M13 2 4 14h7l-1 8 10-13h-7z' },
  { label: 'Settings', href: '#settings', icon: 'M4 7h16 M4 17h16 M8 4v6 M16 14v6' },
]

const events = [
  { id: 'evt-1048', name: 'Page viewed', source: 'Web application', time: '10:42:08', status: 'Processed' },
  { id: 'evt-1047', name: 'Account created', source: 'Authentication', time: '10:41:52', status: 'Processed' },
  { id: 'evt-1046', name: 'Request timed out', source: 'API gateway', time: '10:41:36', status: 'Error' },
  { id: 'evt-1045', name: 'Session started', source: 'Web application', time: '10:41:12', status: 'Processed' },
]

function App() {
  const [search, setSearch] = useState('')
  const visibleEvents = events.filter((event) =>
    `${event.name} ${event.source} ${event.status}`.toLowerCase().includes(search.trim().toLowerCase()),
  )

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 md:grid md:grid-cols-[240px_minmax(0,1fr)]">
      <a href="#dashboard" className="sr-only z-20 rounded-lg bg-indigo-700 px-4 py-3 font-medium text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to main content
      </a>

      <aside className="border-b border-slate-200 bg-white p-4 md:border-r md:border-b-0 md:p-6">
        <a href="#dashboard" aria-label="Pulse dashboard" className="inline-flex items-center gap-3 rounded-lg">
          <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-6">
              <path d="M2 12h5l3-8 4 16 3-8h5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-2xl font-bold tracking-tight">pulse<span className="text-indigo-600">.</span></span>
        </a>
        <p className="mt-9 hidden text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase md:block">Workspace</p>
        <nav aria-label="Primary navigation" className="mt-5">
          {/* Navigation stays in the document flow, including on small screens. */}
          <ul className="grid grid-cols-2 gap-2 md:grid-cols-1">
            {navigation.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-[18px] shrink-0">
                    <path d={item.icon} />
                  </svg>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-8 hidden rounded-xl border border-slate-200 bg-slate-50 p-4 md:block">
          <p className="text-sm font-semibold">Your workspace, at a glance.</p>
          <p className="mt-2 text-xs leading-5 text-slate-600">A clearer view of your users, events, and system health.</p>
          <span className="mt-4 inline-flex rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">Demo workspace</span>
        </div>
      </aside>

      <main id="dashboard" tabIndex={-1} className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
          <div>
            <p className="text-xs font-medium text-slate-500">Workspace / Overview</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Dashboard</h1>
          </div>
          <div className="flex w-full items-center gap-4 sm:w-auto">
            <div role="search" aria-label="Search demo events" className="relative min-w-0 flex-1 sm:w-64">
              <label htmlFor="event-search" className="sr-only">Search events by name, source, or status</label>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute top-3.5 left-3 size-4 text-slate-500">
                <circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" />
              </svg>
              <input id="event-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search events…" aria-controls="event-results" className="min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pr-3 pl-9 text-sm placeholder:text-slate-500" />
            </div>
            <span role="img" aria-label="Demo user avatar: RP" className="flex size-11 shrink-0 items-center justify-center rounded-full border-4 border-white bg-indigo-100 text-sm font-semibold text-indigo-800 ring-1 ring-slate-200">RP</span>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] space-y-7 p-5 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold tracking-tight">A little clarity. A lot of insight.</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Here’s a snapshot of your workspace activity.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-indigo-600" />
              Demo data · Last 24 hours
            </span>
          </div>

          <section id="analytics" aria-labelledby="metrics-title" className="scroll-mt-6">
            <h2 id="metrics-title" className="mb-4 text-sm font-semibold">Workspace overview</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <article key={metric.label} className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-medium text-slate-600">{metric.label}</h3>
                  <p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums">{metric.value}</p>
                  <p className="mt-4 text-xs font-semibold text-emerald-700">{metric.change}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{metric.description}</p>
                </article>
              ))}
            </div>
          </section>

          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <section id="events" aria-labelledby="events-title" className="min-w-0 scroll-mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-5">
                <div>
                  <h2 id="events-title" className="font-semibold">Recent events</h2>
                  <p className="mt-1 text-xs text-slate-500">Sample activity from across your workspace</p>
                </div>
                <p role="status" className="text-xs font-medium text-slate-500">{visibleEvents.length} of {events.length} events</p>
              </div>
              <ul id="event-results" className="divide-y divide-slate-100">
                {visibleEvents.map((event) => (
                  <li key={event.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${event.status === 'Error' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                      <div>
                        <h3 className="text-sm font-medium">{event.name}</h3>
                        <p className="mt-1 text-xs text-slate-500">{event.source} · <time dateTime={event.time}>{event.time}</time></p>
                      </div>
                    </div>
                    <span className={`rounded-md px-2 py-1 text-xs font-medium ${event.status === 'Error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{event.status}</span>
                  </li>
                ))}
              </ul>
              {visibleEvents.length === 0 && (
                <p className="px-5 py-10 text-center text-sm text-slate-600">No events match your search. Try “page” or “error”.</p>
              )}
            </section>

            <section id="settings" aria-labelledby="settings-title" className="scroll-mt-6 self-start rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 id="settings-title" className="font-semibold">Workspace settings</h2>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">Read only</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">Details for this sample workspace.</p>
              <dl className="mt-5 divide-y divide-slate-100 text-sm">
                <div className="flex flex-wrap justify-between gap-2 py-4"><dt className="text-slate-600">Workspace</dt><dd className="font-medium">Pulse demo</dd></div>
                <div className="flex flex-wrap justify-between gap-2 py-4"><dt className="text-slate-600">Environment</dt><dd className="font-medium">Demo</dd></div>
                <div className="flex flex-wrap justify-between gap-2 py-4"><dt className="text-slate-600">Time zone</dt><dd className="font-medium">Asia/Kolkata</dd></div>
                <div className="flex flex-wrap justify-between gap-2 py-4"><dt className="text-slate-600">Reporting period</dt><dd className="font-medium">Last 24 hours</dd></div>
              </dl>
            </section>
          </div>

          <footer className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">
            <p>Pulse Analytics</p>
            <p>Sample data for preview. No live connection.</p>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
