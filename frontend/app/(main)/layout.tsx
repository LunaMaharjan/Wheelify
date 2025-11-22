import Navigation from "../../components/Navigation";
// import SWRProvider from "@/components/SWRProvider";
import { Suspense } from "react";
import Script from "next/script";

export default function MainLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        // <SWRProvider>
            <div className="min-h-screen flex flex-col">
                <Navigation />
                <main className="flex-1">
                    {children}
                </main>
                <Suspense fallback={<div className="w-full h-40 bg-muted animate-pulse mt-12" />}>
                    {/* <Footer /> */}
                </Suspense>
            </div>
        // </SWRProvider>
    );
} 