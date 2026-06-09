"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Check, AlertCircle, X } from "lucide-react";
import { useGetRegisters } from "@/hooks/useRegisters";


export default function Consolidate() {
    const { data: activeRegisters, isLoading: loadingRegisters } = useGetRegisters({
        size: 1000,
        status: "ACTIVE"
    });
    const [mode, setMode] = useState("single");
    const [sourcesLoaded, setSourcesLoaded] = useState(false);


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Account Consolidation
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Merge duplicate shareholder accounts into a single surviving account
                    </p>
                </div>
            </div>



            {/* {rejectedId && (
              <Card className="mrpsl-card p-4 border-l-4 border-l-red-500 bg-red-50/40 border-red-200 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="font-semibold text-sm text-red-800">
                    Request Rejected — ID: {rejectedId}
                  </div>
                  <div className="text-[13px] text-red-700">
                    {rejectedComment || "No comment provided."}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setRejectedId(null);
                    setRejectedComment("");
                  }}
                  className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </Card>
            )} */}
            <div className="flex gap-4">
                <Select>
                    <SelectTrigger className="w-64 mrpsl-input">
                        <SelectValue placeholder="Register *" />
                    </SelectTrigger>
                    <SelectContent>
                        {activeRegisters?.content.map((r) => (
                            <SelectItem key={r.registerId} value={r.registerId}>
                                {r.registerName} - {r.symbol}
                            </SelectItem>
                        ))}
                        {loadingRegisters && (
                            <SelectItem disabled>
                                Loading....
                            </SelectItem>
                        )}
                    </SelectContent>
                </Select>

                <div className="border rounded-md flex p-1 bg-muted/20">
                    <Button
                        variant={mode === "single" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setMode("single")}
                    >
                        Single
                    </Button>
                    <Button
                        variant={mode === "bulk" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setMode("bulk")}
                    >
                        Bulk Upload
                    </Button>
                </div>
            </div>

            {mode === "single" && (
                <div className="grid grid-cols-5 gap-6">
                    <div className="col-span-3 space-y-4">
                        <h3 className="font-semibold text-sm">
                            1. Source Accounts (To be deactivated)
                        </h3>
                        <Card className="mrpsl-card p-4 space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Account No or Surname"
                                    className="mrpsl-input"
                                />
                                <Button onClick={() => setSourcesLoaded(true)}>
                                    Add
                                </Button>
                            </div>
                            {sourcesLoaded && (
                                <table className="w-full text-left text-sm">
                                    <thead className="mrpsl-table-header">
                                        <tr>
                                            <th className="p-2">
                                                <Checkbox defaultChecked />
                                            </th>
                                            <th className="p-2">ACCT NO</th>
                                            <th className="p-2">NAME</th>
                                            <th className="p-2">HOLDINGS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y font-mono text-[13px]">
                                        <tr>
                                            <td className="p-2">
                                                <Checkbox defaultChecked />
                                            </td>
                                            <td className="p-2 text-muted-foreground">
                                                DANGCEM-001
                                            </td>
                                            <td className="p-2 font-sans font-medium">
                                                BINTA LAWAL
                                            </td>
                                            <td className="p-2 text-right">5,000</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2">
                                                <Checkbox defaultChecked />
                                            </td>
                                            <td className="p-2 text-muted-foreground">
                                                DANGCEM-089
                                            </td>
                                            <td className="p-2 font-sans font-medium">
                                                B. LAWAL
                                            </td>
                                            <td className="p-2 text-right">10,000</td>
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                        </Card>
                    </div>

                    <div className="col-span-2 space-y-4">
                        <h3 className="font-semibold text-sm">
                            2. Destination Account (Surviving)
                        </h3>
                        <Card className="mrpsl-card p-4 space-y-4">
                            <Select disabled={!sourcesLoaded}>
                                <SelectTrigger className="mrpsl-input">
                                    <SelectValue placeholder="Select surviving account" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">
                                        DANGCEM-001 - BINTA LAWAL
                                    </SelectItem>
                                    <SelectItem value="2">
                                        DANGCEM-089 - B. LAWAL
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {sourcesLoaded && (
                                <div className="bg-muted/20 p-4 rounded-md space-y-3">
                                    <div className="text-[13px] text-muted-foreground">
                                        Merging 2 accounts into Destination.
                                    </div>
                                    <div className="text-sm font-bold">
                                        Total Holdings after merge:{" "}
                                        <span className="font-mono text-primary">15,000</span>
                                    </div>
                                    <div className="text-[13px] text-muted-foreground">
                                        Certificates and Dividend History will be unified.
                                    </div>
                                    <Textarea
                                        placeholder="Comment / Reason *"
                                        className="mt-2 focus-visible:ring-primary"
                                    />
                                    <Button
                                        className="w-full mt-2"
                                        onClick={() =>
                                            toast.success(
                                                "Consolidation submitted for authorizer review.",
                                            )
                                        }
                                    >
                                        Submit for Authorisation
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            )}

            {mode === "bulk" && (
                <Card className="mrpsl-card p-12 text-center text-muted-foreground">
                    Bulk upload CSV interface.
                </Card>
            )}

        </div>
    );
}
