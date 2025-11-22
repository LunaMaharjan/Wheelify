import Navbar from "@/components/Navigation";

export default function AuthLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <div className="">
            {/* <Navbar /> */}
            
            {children}
        </div>
    );
} 