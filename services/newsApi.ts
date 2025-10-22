import Constants from "expo-constants";

export async function getFootballNews(league?: string) {
  const API_KEY =
    ((Constants.expoConfig?.extra as any)?.NEWS_API_KEY as string) ||
    process.env.NEWS_API_KEY;

  // Se non viene passato il campionato, mostriamo calcio generico
  const query = league
    ? encodeURIComponent(`${league} football OR soccer`)
    : "football OR soccer";

  const url = `https://newsapi.org/v2/everything?q=${query}&language=en&pageSize=10&sortBy=publishedAt&apiKey=${API_KEY}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Errore API news: ${res.status}`);
    const data = await res.json();
    return data.articles ?? [];
  } catch (err) {
    console.error("❌ Errore fetch notizie globali:", err);
    return [];
  }
}