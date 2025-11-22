import React from "react";
import ForgotPasswordForm from "../../../components/auth/ForgotPasswordForm";


export const metadata = {
    title: "Forgot Password",
};

export default function Page() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-semibold">Forgot your password?</h1>
                    <p className="text-sm text-muted-foreground">Enter your email to receive a reset link.</p>
                </div>
                <ForgotPasswordForm />
            </div>
        </div>
    );
}

