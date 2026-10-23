# Component design

`Shell` persists across routes. Route modules are lazy loaded, with Suspense fallback and a real not-found destination. `PageTitle` establishes one h1 and focuses it when a page mounts. The sidebar's NavLink handles active location state.

`Panel` composes a title, optional action and body. `Badge` maps status to semantic color while preserving text. `QueryState` distinguishes pending, empty and retryable failure. These shared components encode recurring behavior without a large component framework.

`Dialog` uses native `showModal()`: focus containment and background inertness come from the platform. Escape and Close dismiss it; unmount restores the triggering element. The event drawer, mobile navigation, command palette and alert editor reuse it.

Overview widgets render from the persisted layout order. Charts are shared by Overview and Analytics and receive validated aggregates. They never generate unrelated random numbers. Chart alternatives expose exact counts and a time-bucket table.

The event explorer keeps filter state in the URL and selection/column visibility locally. Its table virtualizes one server page. Selection is useful through Copy selected IDs. Opening an event changes the URL without changing the list query or scroll position, preserving the trigger for focus restoration.

RuleEditor owns an unsaved form. API functions serialize requests; mutation status determines pending and error feedback. The enable switch uses a transient local pending value for immediate controlled-input feedback, then returns to the refreshed server value. Failed requests therefore roll back.
