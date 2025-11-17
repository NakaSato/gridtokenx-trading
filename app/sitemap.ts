import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://trading.gridtokenx.com";
  const currentDate = new Date();

  // Main pages
  const routes = [
    "",
    "/portfolio",
    "/futures",
    "/options-chain",
    "/earn",
    "/borrow",
    "/analytics",
    "/leaderboards",
    "/moonrekt",
    "/create-options-pool",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  return routes;
}
