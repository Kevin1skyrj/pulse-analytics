// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { QueryState } from "./ui";
afterEach(cleanup);
it("exposes a recoverable query failure to keyboard users", async () => {
  const retry = vi.fn(),
    user = userEvent.setup();
  render(<QueryState error={new Error("Simulation offline")} retry={retry} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Simulation offline");
  await user.tab();
  expect(screen.getByRole("button", { name: "Try again" })).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(retry).toHaveBeenCalledOnce();
});
it("announces pending data independently from empty results", () => {
  const { rerender } = render(<QueryState pending />);
  expect(screen.getByRole("status")).toHaveTextContent(
    "Loading workspace data",
  );
  rerender(<QueryState empty />);
  expect(
    screen.getByRole("heading", { name: "No matching activity" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
