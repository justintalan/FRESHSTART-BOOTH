"use client";

import type { GameId } from "../lib/types";
import PathSorter from "./path-sorter/PathSorter";
import TerminalReveal from "./terminal-reveal/TerminalReveal";
import DebugArcade from "./debug-arcade/DebugArcade";
import ThisOrThat from "./this-or-that/ThisOrThat";
import BuildSetup from "./build-setup/BuildSetup";
import SpotPhish from "./spot-phish/SpotPhish";

// Client dispatcher: renders the self-contained game for a validated GameId.
export function GameRouter({ game }: { game: GameId }) {
  switch (game) {
    case "path-sorter":
      return <PathSorter />;
    case "terminal-reveal":
      return <TerminalReveal />;
    case "debug-arcade":
      return <DebugArcade />;
    case "this-or-that":
      return <ThisOrThat />;
    case "build-setup":
      return <BuildSetup />;
    case "spot-phish":
      return <SpotPhish />;
  }
}
