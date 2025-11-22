import serverAxiosInstance from "@/lib/serverApi"
import { resolveCountryId } from "@/lib/country"
import { getFeaturedProperties } from "@/lib/featuredProperties"
import { getPremiumProperties } from "@/lib/premiumProperties"
import { getAllRecommendationProperties } from "@/lib/recommendationProperties"
import type { Metadata } from "next"

// export const metadata: Metadata = {
//     title: "Home",
//     description: "Discover the best properties for sale and rent. Browse featured listings, premium properties, and find your perfect home or investment opportunity.",
//     openGraph: {
//         title: "Realty Karma - Find Your Dream Property",
//         description: "Discover the best properties for sale and rent. Browse featured listings, premium properties, and find your perfect home or investment opportunity.",
//         type: "website",
//         images: [{ url: 'https://karmarealestates.com/opengraph-image.png' }],
//     },
//     twitter: {
//         card: "summary_large_image",
//         title: "Realty Karma - Find Your Dream Property",
//         description: "Discover the best properties for sale and rent. Browse featured listings, premium properties, and find your perfect home or investment opportunity.",
//         images: [{ url: 'https://karmarealestates.com/opengraph-image.png' }],
//     },
// }



export default async function Home() {

  return (
    <div className="w-full">
      <h1 className="text-2xl">Home Page</h1>
    </div>
  )
}
