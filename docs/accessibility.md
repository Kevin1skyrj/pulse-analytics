# Accessibility

Target: applicable WCAG 2.2 AA behaviors. This is a target and tested subset, not a certification.

- Landmarks: sidebar/navigation, header, main and footer. Skip link targets main.
- One page h1; panel h2s and subordinate item headings preserve hierarchy.
- Active links use NavLink's aria-current. Icon-only controls have accessible names.
- Visible focus rings, native form controls and real buttons/links support keyboard operation.
- Native dialogs provide background inertness and the modal top layer. Explicit Tab/Shift+Tab wrapping provides consistent containment; Escape dismisses and restores the trigger. Pointer button focus is normalized for WebKit. Event drawers preserve list scroll so virtualized triggers remain present.
- Every form control has a label. Errors are alerts; pending/result feedback uses status regions. Feed contents are not announced continuously, avoiding screen-reader flooding.
- Color never carries severity alone. Charts have summary text and exact-data alternatives. Recharts accessibility support remains enabled.
- Dashboard reorder and width controls provide button alternatives to drag gestures. Visibility and restore-default controls are keyboard usable.
- Theme tokens are designed for readable contrast. Reduced-motion disables animation.

Automated coverage scans all six routes with axe's WCAG 2 A/AA, 2.1 AA and 2.2 AA tags in dark/light at 375, 768 and 1440 px on Chromium, Firefox and WebKit: 108 route/theme/width scans. Keyboard tests exercise forward/backward dialog wrapping, Escape/focus restoration, visible focus outline, command navigation and mobile route-heading focus. Reduced-motion emulation checks that the actual loading indicator has no animation. [Recorded outcomes](testing.md).

The audit found and corrected two cross-engine focus defects: native dialog tab order could reach browser chrome in Chromium/WebKit, and WebKit pointer clicks did not establish the opener as the focus-restoration target. These are behavioral fixes; the existing colors, spacing and density remain intact. Public editing restrictions have explanatory text as well as disabled controls.

Manual screen-reader testing with NVDA/VoiceOver and testing across every browser/assistive-technology combination remain outside this local verification. Virtualized tables expose row counts/indices, but only mounted rows are in the accessibility tree; pagination and the keyboard-scrollable region make additional rows reachable.
