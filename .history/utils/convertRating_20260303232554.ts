export function convertRatingToBaseVote(rating?: number): number | null {
  const r = Number(rating);

  if (r < 4.5) return 4.0;
  else if (4.5 <= r && r < 5.0) return 4.5;
  else if (5.5 <= r && r < 6.0) return 5.0;
  else if (6.0 <= r && r < 6.5) return 5.5;
  else if (6.5 <= r && r < 7.0) return 6.0;
  else if (7.0 <= r && r < 7.5) return 6.5;
  else if (7.5 <= r && r < 8.0) return 7.0;
  else if (8.0 <= r && r < 9.0) return 7.5;
  else if (9.0 <= r && r <= 10.0) return 8.0;
  else return null;
}

export function calcPlayerBreakdown(stat: PlayerStatRow | undefined, scoring: any) {
  const minMinutes = safeNum(scoring?.rules?.min_minutes_for_vote ?? 0, 0);
  const minutes = safeNum(stat?.minutes, 0);

  const base = safeNum(stat?.rating, 0);

  const events = scoring?.events ?? {};
  const goalPts = safeNum(events?.goal?.value, 3);
  const assistPts = safeNum(events?.assist?.value, 1);
  const yellowPts = safeNum(events?.yellow?.value, -0.5);
  const redPts = safeNum(events?.red?.value, -1);

  const goals = safeNum(stat?.goals, 0);
  const assists = safeNum(stat?.assists, 0);
  const yellow = safeNum(stat?.yellow, 0);
  const red = safeNum(stat?.red, 0);

  const disabled = minutes < minMinutes;

  const breakdown = [
    { label: "Gol", qty: goals, ptsEach: goalPts, subtotal: goals * goalPts },
    { label: "Assist", qty: assists, ptsEach: assistPts, subtotal: assists * assistPts },
    { label: "Giallo", qty: yellow, ptsEach: yellowPts, subtotal: yellow * yellowPts },
    { label: "Rosso", qty: red, ptsEach: redPts, subtotal: red * redPts },
  ].filter((x) => x.qty !== 0);

  const total = disabled ? 0 : Number((base + breakdown.reduce((s, x) => s + x.subtotal, 0)).toFixed(2));

  return { minutes, minMinutes, disabled, base, breakdown, total };
}