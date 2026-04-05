"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadRevenueReportCsv, type RevenueReportQuery } from "@/lib/api";

type Scope = "admin" | "vendor";

export function RevenueReportCsvButton({
    scope,
    query,
    className,
}: {
    scope: Scope;
    /** Same filters as the visible report table */
    query?: RevenueReportQuery;
    className?: string;
}) {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true);
        try {
            await downloadRevenueReportCsv(scope, query);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            className={className}
            onClick={handleClick}
            disabled={loading}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Download className="h-4 w-4" />
            )}
            <span className="ml-2">{loading ? "Preparing…" : "Download CSV"}</span>
        </Button>
    );
}
