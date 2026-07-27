import { IBM_Plex_Mono, Press_Start_2P } from "next/font/google";

// Loaded once here and shared. page.tsx needs the generated family name for
// ctx.font — next/font hashes it, so the literal "Press Start 2P" would not
// resolve on the canvas.

/** Display / bitmap face. Non-variable: weight 400 is the only one that exists. */
export const pressStart2P = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

/** Long lines only — hints, messages, the board subtitle. */
export const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});
