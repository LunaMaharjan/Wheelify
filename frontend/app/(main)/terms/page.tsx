import axiosInstance from "@/lib/axiosInstance";
import React from "react";

async function fetchTerms() {
   try {
       const res = await axiosInstance.get("/content/terms");
        return res.data.terms || "";
    } catch (err) {
        console.error("Failed to fetch terms:", err);
        return "";
    }
}
export default async function TermsPage() {
    const content = await fetchTerms();

    return (
        <div className="max-w-5xl mx-auto prose dark:prose-invert px-4 py-8">
            <h1 className="text-3xl font-bold mb-4">Terms &amp; Conditions</h1>
            <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
    );
}
