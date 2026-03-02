export function convertRatingToBaseVote(
  rating: number | string | undefined
): number {
  const r: number =
    typeof rating === "string" ? Number(rating) : Number(rating);

  if (r < 4.5) return 4.0;
  else if (4.5 <= r && r < 5.0) return 4.5;
  else if (5.0 <= r && r < 5.5) return 5.0;
  else if (5.5 <= r && r < 6.0) return 5.5;
  else if (6.0 <= r && r < 6.5) return 6.0;
  else if (6.5 <= r && r < 7.0) return 6.5;
  else if (7.0 <= r && r < 7.5) return 7.0;
  else if (7.5 <= r && r < 8.2) return 7.5;
  else if (8.2 <= r) return 8.0;
}