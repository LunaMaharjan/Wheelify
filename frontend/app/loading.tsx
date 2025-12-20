import Image from "next/image";
import Logo from "@/assets/branding/logo.png";

export default function Loading() {
    return (
        <div className="min-h-dvh flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-6 animate-in fade-in-0 zoom-in-95 duration-300">
                <Image
                    src={Logo}
                    alt="Site logo"
                    priority
                    className="h-48 w-auto opacity-90 animate-pulse"

                />
            </div>
        </div>
    );
}


