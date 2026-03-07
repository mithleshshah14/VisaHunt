import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://www.visa-hunt.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/jobs", "/visa-guides", "/salary-comparison", "/sponsors", "/blog"],
        disallow: [
          "/api/",
          "/dashboard",
          "/admin",
          "/login",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
