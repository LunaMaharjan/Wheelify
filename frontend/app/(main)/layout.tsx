import Navigation from "../../components/Navigation";
// import SWRProvider from "@/components/SWRProvider";
import { Suspense } from "react";

export default function MainLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
            <div className="min-h-screen flex flex-col">
                <Navigation />
                <main className="flex-1">
                    {children}
                </main>
                <Suspense fallback={<div className="w-full h-40 bg-muted animate-pulse mt-12" />}>
                    {/* <Footer /> */}
                </Suspense>
            </div>
    );
} 