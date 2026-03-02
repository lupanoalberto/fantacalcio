export function convertRatingToBaseVote(
  rating: number | string | null | undefined,
  minutes?: number | null
): number | null {
  const r = typeof rating === "string" ? Number(r) : rating;

  if (!Number.isFinite(r)) {
    if (minutes && minutes > 0) return 6.0;
    return null;
  }

  if (r < 4.5) return 4.0;
  if (r < 5.0) return 4.5;
  if (r < 5.5) return 5.0;
  if (r < 6.0) return 5.5;
  if (r < 6.5) return 6.0;
  if (r < 7.0) return 6.5;
  if (r < 7.5) return 7.0;
  if (r < 8.2) return 7.5;

  return 8.0;
}