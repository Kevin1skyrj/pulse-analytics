# Pulse design system

The interface is dark-primary, compact, and designed around operational investigation. Color is functional: violet for selected navigation/actions, green for healthy/processed, amber for warning/degraded, red for failed/critical and blue for informational signals. Status text accompanies color.

Tokens live in `src/index.css`; Tailwind v4 `@theme inline` exposes the semantic values to utility classes. Dark/light modes switch the same token names, not component markup.

| Token       | Dark    | Light   |
| ----------- | ------- | ------- |
| Canvas      | #111216 | #f5f6fa |
| Surface     | #191b21 | #ffffff |
| Raised      | #20232b | #edf0f6 |
| Border      | #30333e | #d8dce7 |
| Text        | #edeef3 | #20232f |
| Muted text  | #a0a6b8 | #5b6477 |
| Accent text | #b6a3ff | #6544be |

System sans-serif avoids external font requests. Monospace is reserved for IDs, timestamps and measured values. Body text is 14px; labels are 12px; h1 is 26px (24px mobile); KPI values are 28–30px. Spacing generally follows 4px increments, with denser 6/10/14px control gaps where helpful. Controls use 6px corners, panels 8px and dialogs 10px. Surfaces use borders instead of decorative shadows.

The desktop sidebar is 232px, collapsible to 76px. Below 768px, a modal navigation menu replaces it. Metrics use four, two or one column; page panels collapse to one column at 1100px to preserve usable tablet widths beside the sidebar. Event tables scroll inside their panel so the page itself does not overflow. Widget resizing switches between one and two grid columns rather than arbitrary pixel resizing. Event volume and recent activity span the full grid by default.

Layering is deliberately small: page content, sticky table header, native modal top layer. No complex z-index registry. Motion is limited to the loading indicator; reduced-motion removes it. Focus rings are 2px with 4px offsets. Page headings receive route focus without drawing an interactive-control ring.
