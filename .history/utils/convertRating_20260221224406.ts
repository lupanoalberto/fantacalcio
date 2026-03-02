export function convertRatingToBaseVote(
  rating: number | string | null | undefined
): number | null {

  if (rating < 4.5) return 4.0;
  else if (4.5 <= rating && rating < 5.0) return 4.5;
  else if (5.0 <= rating && rating < 5.5) return 5.0;
  else if (5.5 <= rating && rating < 6.0) return 5.5;
  else if (6.0 <= rating && rating < 6.5) return 6.0;
  else if (6.5 <= rating && rating < 7.0) return 6.5;
  else if (7.0 <= rating && rating < 7.5) return 7.0;
  else if (7.5 <= rating && rating < 8.2) return 7.5;
  else if (8.2 <= rating && rating <= 9.0) return 8.0;
  else if (9.0 < rating && rating <= 10.0) return 8.5;
  else return null;
}