import { notFound } from "next/navigation";
import { GAME_IDS, isGameId } from "../../../lib/types";
import { GameRouter } from "../../../games/GameRouter";

// Statically generate the six known games; anything else 404s (→ redirect to /).
export function generateStaticParams() {
  return GAME_IDS.map((game) => ({ game }));
}

export const dynamicParams = true;

export default async function PlayPage({
  params,
}: {
  params: Promise<{ game: string }>;
}) {
  const { game } = await params;
  if (!isGameId(game)) notFound();
  return <GameRouter game={game} />;
}
