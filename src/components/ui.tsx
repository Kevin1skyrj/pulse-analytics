import { useEffect, useId, useRef, type ReactNode } from "react";
import { X, RefreshCw, AlertCircle } from "lucide-react";

export function Badge({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge tone-${tone}`}>{children}</span>;
}
export function PageTitle({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="page-title">
      <div>
        <h1 ref={heading} tabIndex={-1}>
          {title}
        </h1>
        <p>{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  );
}
export function Panel({
  title,
  children,
  actions,
  className = "",
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <h2>{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}
export function QueryState({
  pending,
  error,
  retry,
  empty = false,
  emptyTitle = "No matching activity",
  emptyDescription = "Choose a different time range or clear your filters.",
}: {
  pending?: boolean;
  error?: Error | null;
  retry?: () => void;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (pending)
    return (
      <div role="status" className="state">
        <RefreshCw className="loading-icon" size={20} />
        Loading workspace data…
      </div>
    );
  if (error)
    return (
      <div role="alert" className="state">
        <AlertCircle size={22} />
        <h2>Unable to load data</h2>
        <p>{error.message}</p>
        {retry && (
          <button className="button" onClick={retry}>
            Try again
          </button>
        )}
      </div>
    );
  if (empty)
    return (
      <div className="state">
        <h2>{emptyTitle}</h2>
        <p>{emptyDescription}</p>
      </div>
    );
  return null;
}
export function Dialog({
  title,
  children,
  onClose,
  drawer = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  drawer?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    label = useId();
  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previous?.isConnected) previous.focus();
      else document.querySelector<HTMLElement>("main h1")?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={label}
      className={drawer ? "dialog drawer" : "dialog"}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            "a[href], button, input, select, textarea, [tabindex]",
          ),
        ).filter(
          (element) =>
            element.tabIndex >= 0 &&
            !element.matches(":disabled") &&
            element.getClientRects().length > 0,
        );
        const first = controls[0],
          last = controls.at(-1);
        if (!first || !last) {
          event.preventDefault();
          return;
        }
        // Native modal inertness does not prevent Tab reaching browser chrome.
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="panel-heading">
        <h2 id={label}>{title}</h2>
        <button
          aria-label="Close dialog"
          className="icon-button"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}
