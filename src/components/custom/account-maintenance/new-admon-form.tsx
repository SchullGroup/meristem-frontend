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
import { Switch } from "@/components/ui/switch";
import {
    Loader2,
} from "lucide-react";
import { NIGERIA_STATE_NAMES } from "@/lib/mocks/nigeria-geo";
import { format } from "date-fns";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { DocUploadZone } from "@/components/custom/doc-upload-zone";
import { getDocType } from "@/lib/mocks/doc-types";
import DateInput from "@/components/ui/date-input";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useGetAccount, useCreateAdmon } from "@/hooks/useAccountMaintenance";

export default function NewAdmonForm() {
    const { data: activeRegisters } = useGetRegisters({
        size: 100,
        status: "ACTIVE"
    });

    const { currentUser } = useStore();

    const [registerId, setRegisterId] = useState("");
    const [search, setSearch] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [accountLoaded, setAccountLoaded] = useState(false);

    // Form states
    const [isExecutor, setIsExecutor] = useState(false);
    const [adminName, setAdminName] = useState("");
    const [probateCourt, setProbateCourt] = useState("");
    const [probateNumber, setProbateNumber] = useState("");
    const [probatePage, setProbatePage] = useState("");
    const [date1, setDate1] = useState<Date>(new Date());
    const [date2, setDate2] = useState<Date>(new Date());
    const [adminAddress, setAdminAddress] = useState("");
    const [adminCity, setAdminCity] = useState("");
    const [adminState, setAdminState] = useState("");
    const [memo, setMemo] = useState("");
    const [changeAddressToAdmin, setChangeAddressToAdmin] = useState(true);
    const [changeNameToEstate, setChangeNameToEstate] = useState(true);
    const [probateDocUrl, setProbateDocUrl] = useState("");

    const { data: accountRes, isLoading: isLoadingAccount } = useGetAccount(searchQuery, {
        enabled: !!searchQuery,
    });
    const account = accountRes?.data;

    const createAdmonMutation = useCreateAdmon();

    const handleSearch = () => {
        if (!search.trim()) {
            toast.error("Please enter an account number");
            return;
        }
        setSearchQuery(search);
        setAccountLoaded(true);
    };

    const handleSubmit = () => {
        if (!account) {
            toast.error("Please load a deceased account first");
            return;
        }
        if (!adminName.trim()) {
            toast.error("Please enter administrator name");
            return;
        }
        if (!probateCourt.trim()) {
            toast.error("Please enter probate court");
            return;
        }
        if (!probateNumber.trim()) {
            toast.error("Please enter probate number");
            return;
        }
        if (!probatePage.trim()) {
            toast.error("Please enter probate page");
            return;
        }
        if (!adminAddress.trim()) {
            toast.error("Please enter admin address");
            return;
        }
        if (!adminCity.trim()) {
            toast.error("Please enter admin city");
            return;
        }
        if (!adminState) {
            toast.error("Please select admin state");
            return;
        }
        if (!currentUser) {
            toast.error("Your session has expired. Please login again.");
            return;
        }

        createAdmonMutation.mutate({
            registerId: registerId || account.registerId,
            deceasedAccountIds: [account.id],
            admonType: isExecutor ? "EXECUTOR" : "ADMINISTRATOR",
            adminName,
            probateCourt,
            probateNumber,
            probateDate: format(date1, "yyyy-MM-dd"),
            probatePage,
            lodgementDate: format(date2, "yyyy-MM-dd"),
            adminAddress,
            adminCity,
            adminState,
            memo,
            changeAddressToAdmin,
            changeNameToEstate,
            probateDocUrl,
            initiatedBy: currentUser.email
        }, {
            onSuccess: () => {
                toast.success("Administration request submitted. Approver has been notified.");
                // Reset form
                setAccountLoaded(false);
                setSearchQuery("");
                setSearch("");
                setAdminName("");
                setProbateCourt("");
                setProbateNumber("");
                setProbatePage("");
                setAdminAddress("");
                setAdminCity("");
                setAdminState("");
                setMemo("");
                setProbateDocUrl("");
            },
            onError: (err) => {
                toast.error(err.message || "Failed to submit request");
            }
        });
    };

    return (
        <>
            <Card className="mrpsl-card p-6 space-y-4">
                <h3 className="font-semibold text-sm border-b pb-2">
                    1. Deceased Account Selection
                </h3>
                <div className="flex gap-4">
                    <Select
                        value={registerId}
                        onValueChange={(v) => setRegisterId(v || "")}
                    >
                        <SelectTrigger className="w-44 mrpsl-input">
                            <SelectValue placeholder="All Registers" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Registers</SelectItem>
                            {activeRegisters?.content?.map((r) => (
                                <SelectItem key={r.registerId} value={r.symbol}>
                                    {r.registerName} · {r.symbol}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex gap-2 flex-1">
                        <Input
                            value={search}
                            type="search"
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Deceased Account No"
                            className="mrpsl-input"
                        />
                        <Button disabled={isLoadingAccount} onClick={handleSearch}>
                            {isLoadingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Search
                        </Button>
                    </div>
                </div>
                {accountLoaded && (
                    <table className="w-full text-left text-sm mt-4">
                        <thead className="mrpsl-table-header">
                            <tr>
                                <th className="p-2 w-12">
                                    <Checkbox checked={!!account} disabled />
                                </th>
                                <th className="p-2">ACCT NO</th>
                                <th className="p-2">HOLDER NAME</th>
                                <th className="p-2">CHN</th>
                                <th className="p-2">HOLDINGS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y font-mono text-[13px] border-b">
                            {isLoadingAccount ? (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                        Loading account details...
                                    </td>
                                </tr>
                            ) : account ? (
                                <tr className="hover:bg-accent/5">
                                    <td className="p-2">
                                        <Checkbox checked defaultChecked disabled />
                                    </td>
                                    <td className="p-2">{account.accountNumber}</td>
                                    <td className="p-2 font-sans font-medium text-destructive">
                                        {account.firstName} {account.lastName} (DECEASED)
                                    </td>
                                    <td className="p-2">{account.chn || "-"}</td>
                                    <td className="p-2 text-right">{account.holdings?.toLocaleString()}</td>
                                </tr>
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                        No account found with this account number.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </Card>

            {accountLoaded && account && (
                <Card className="mrpsl-card p-6 space-y-6 animate-in fade-in">
                    <h3 className="font-semibold text-sm border-b pb-2">
                        2. Administrator Details
                    </h3>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="exec"
                            checked={isExecutor}
                            onCheckedChange={(c) => setIsExecutor(!!c)}
                        />
                        <label
                            htmlFor="exec"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                            Is this an Executor (not Administrator)?
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <label className="mrpsl-label">Administrator / Executor Name *</label>
                            <Input
                                value={adminName}
                                onChange={(e) => setAdminName(e.target.value)}
                                placeholder="Estate of..."
                                className="mrpsl-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="mrpsl-label">Probate Court *</label>
                            <Input
                                value={probateCourt}
                                onChange={(e) => setProbateCourt(e.target.value)}
                                className="mrpsl-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <DateInput date={date1} setDate={setDate1} label="Probate Date *" />
                        </div>
                        <div className="space-y-2">
                            <label className="mrpsl-label">Probate Number *</label>
                            <Input
                                value={probateNumber}
                                onChange={(e) => setProbateNumber(e.target.value)}
                                className="mrpsl-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="mrpsl-label">Probate Page *</label>
                            <Input
                                value={probatePage}
                                onChange={(e) => setProbatePage(e.target.value)}
                                className="mrpsl-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <DateInput date={date2} setDate={setDate2} label="Lodgement Date *" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2 col-span-3">
                            <label className="mrpsl-label">Admin Address *</label>
                            <Textarea
                                value={adminAddress}
                                onChange={(e) => setAdminAddress(e.target.value)}
                                className="mrpsl-input"
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="mrpsl-label">Admin City *</label>
                            <Input
                                value={adminCity}
                                onChange={(e) => setAdminCity(e.target.value)}
                                className="mrpsl-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="mrpsl-label">Admin State *</label>
                            <Select value={adminState} onValueChange={(value) => setAdminState(value || "")}>
                                <SelectTrigger className="mrpsl-input">
                                    <SelectValue placeholder="State" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {NIGERIA_STATE_NAMES.map((s) => (
                                        <SelectItem
                                            key={s}
                                            value={s}
                                        >
                                            {s}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="mrpsl-label">Memo</label>
                            <Textarea
                                value={memo}
                                onChange={(e) => setMemo(e.target.value)}
                                className="mrpsl-input"
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2">
                            {(() => {
                                const probate = getDocType(
                                    "Probate / Letters of Administration",
                                );
                                return (
                                    <DocUploadZone
                                        label="Probate / Letters of Administration"
                                        required
                                        fileTypes={probate?.fileTypes ?? ["PDF"]}
                                        maxSizeMB={probate?.maxSizeMB ?? 10}
                                        onUploadSuccess={(url) => setProbateDocUrl(url)}
                                    />
                                );
                            })()}
                        </div>
                    </div>

                    <div className="p-4 bg-muted/20 border rounded-md space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                                Change Holder Address to Admin Address
                            </span>
                            <Switch
                                checked={changeAddressToAdmin}
                                onCheckedChange={setChangeAddressToAdmin}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                                Change Holder Name to Estate Name
                            </span>
                            <Switch
                                checked={changeNameToEstate}
                                onCheckedChange={setChangeNameToEstate}
                            />
                        </div>
                        <div className="bg-background border p-3 rounded text-sm text-center font-mono">
                            <span className="text-muted-foreground line-through mr-2">
                                {account.firstName} {account.lastName}
                            </span>{" "}
                            →{" "}
                            <span className="font-bold text-primary">
                                Estate of {account.firstName} {account.lastName}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            size="lg"
                            disabled={createAdmonMutation.isPending}
                            onClick={handleSubmit}
                        >
                            {createAdmonMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit for Authorisation
                        </Button>
                    </div>
                </Card>
            )}
        </>
    );
}
