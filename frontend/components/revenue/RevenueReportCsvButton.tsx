"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadRevenueReportCsv, type RevenueReportQuery, type RevenueReportRow } from "@/lib/api";
import { downloadRevenueCsvFromRows } from "@/lib/revenueCsvClient";

type Scope = "admin" | "vendor";

export function RevenueReportCsvButton({
    scope,
    query,
    dummyMode,
    dummyRows,
    className,
}: {
    scope: Scope;
    /** Same filters as the visible report table (ignored when dummyMode) */
    query?: RevenueReportQuery;
    /** When true, CSV is built from dummyRows in the browser */
    dummyMode?: boolean;
    dummyRows?: RevenueReportRow[];
    className?: string;
}) {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        if (dummyMode && dummyRows) {
            downloadRevenueCsvFromRows(scope, dummyRows);
            return;
        }
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
            disabled={loading || (dummyMode && !dummyRows)}
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
