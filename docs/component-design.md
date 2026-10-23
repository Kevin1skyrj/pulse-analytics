# Component design

`Shell` persists across routes. Route modules are lazy loaded, with Suspense fallback and a real not-found destination. `PageTitle` establishes one h1 and focuses it when a page mounts. The sidebar's NavLink handles active location state.

`Panel` composes a title, optional action and body. `Badge` maps status to semantic color while preserving text. `QueryState` distinguishes pending, empty and retryable failure. These shared components encode recurring behavior without a large component framework.

`Dialog` uses native `showModal()` for the top layer and background inertness. Explicit Tab/Shift+Tab wrapping keeps keyboard focus inside the controls in all tested engines. Escape and Close dismiss it; unmount restores the triggering element, or the route heading if the trigger was removed. Shell capture focuses pointer-clicked buttons before opening dialogs, including in WebKit. The event drawer, mobile navigation, command palette and alert editor reuse this behavior.

Overview widgets render from the persisted layout order. Charts are shared by Overview and Analytics and receive validated aggregates. They never generate unrelated random numbers. Chart alternatives expose exact counts and a time-bucket table.

The event explorer keeps filter state in the URL and selection/column visibility locally. Its table virtualizes one server page. Selection is useful through Copy selected IDs. Opening an event changes the URL without changing the list query or scroll position, preserving the trigger for focus restoration.

RuleEditor owns an unsaved form. API functions serialize requests; mutation status determines pending and error feedback. The enable switch uses a transient local pending value for immediate controlled-input feedback, then returns to the refreshed server value. Failed requests therefore roll back.

`useCapabilities` supplies the server's public/local mode. Alert and simulation controls stay disabled until mutations are explicitly allowed. The server independently enforces that restriction; disabling buttons is only presentation. Open incident details derive from the current query snapshot so polling cannot leave stale transition buttons visible.
