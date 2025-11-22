import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NextTopLoader from "nextjs-toploader";
// const inter = Inter({ subsets: ["latin"] });
import { Toaster } from "../components/ui/sonner"
import { Montserrat  } from 'next/font/google';


const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
  weight: ['700', '600', '500', '400'],
});

// export const metadata: Metadata = {
//   metadataBase: new URL('https://karmarealestates.com'),
//   alternates: {
//     canonical: '/',
//     languages: {
//       'en-US': '/en-US',
//     },
//   },
//   openGraph: {
//     images: '/opengraph-image.png',
//   },
//   title: {
//     default: "Realty Karma - Find Your Dream Property",
//     template: '%s | Realty Karma',
//   },
//   description: "Discover the best properties for sale and rent. Browse featured listings, premium properties, and find your perfect home or investment opportunity.",
//   twitter: {
//     card: "summary_large_image",
//     site: 'https://karmarealestates.com',
//     creator: 'Realty Karma',
//     images: '/opengraph-image.png',
//     title: "Realty Karma - Find Your Dream Property",
//     description: "Discover the best properties for sale and rent. Browse featured listings, premium properties, and find your perfect home or investment opportunity."
//   },
// }

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body
        className={`${montserrat.className} bg-gray-50 antialiased`}
      >
        <NextTopLoader
          color="#7C3AED"
        />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
