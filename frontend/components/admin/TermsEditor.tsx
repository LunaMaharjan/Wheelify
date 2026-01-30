"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Editor } from "@/components/ui/editor";
import { getTerms, updateTerms } from "@/lib/api";

export default function TermsEditor() {
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        getTerms()
            .then((res) => {
                if (!mounted) return;
                setContent(res.terms || "");
            })
            .catch((err) => {
                console.error(err);
                setMessage("Failed to load terms");
            })
            .finally(() => mounted && setLoading(false));
        return () => { mounted = false; };
    }, []);

    const onSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await updateTerms(content);
            setMessage(res.message || "Saved");
        } catch (err: any) {
            console.error(err);
            setMessage(err?.response?.data?.message || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
            <CardDescription>Manage the public Terms of Service shown on /terms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Editor content={content} onChange={(val) => setContent(val)} />
                    <p className="text-sm text-muted-foreground mt-1">Use the editor to create formatted Terms. The public page will render HTML.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button onClick={onSave} disabled={saving || loading}>
                        {saving ? "Saving..." : "Save Terms"}
                    </Button>
                    {message && <span className="text-sm text-muted-foreground">{message}</span>}
                </div>
            </CardContent>
        </Card>
    );
}
