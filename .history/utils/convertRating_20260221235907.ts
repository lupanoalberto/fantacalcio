export function convertRatingToBaseVote(rating?: number): number | null {
  const r = Number(rating);

  if (r < 4.5) return 4.0;
  else if (4.5 <= r && r < 5.5) return 4.5;
  else if (5.5 <= r && r < 6.0) return 5.0;
  else if (5.5 <= r && r < 6.3) return 5.5;
  else if (6.3 <= r && r < 6.8) return 6.0;
  else if (6.8 <= r && r < 7.1) return 6.5;
  else if (7.1 <= r && r < ) return 7.0;
  else if (8.0 <= r && r < 9.0) return 7.5;
  else if (9.0 <= r && r <= 10.0) return 8.0;
  else return null;
}
