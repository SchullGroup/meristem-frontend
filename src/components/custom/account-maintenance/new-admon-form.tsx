"use client";

import { useEffect, useState } from "react";
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
import DateInput from "@/components/ui/date-input";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useCreateAdmon, useGetAccounts } from "@/hooks/useAccountMaintenance";
import { ShareholderAccount } from "@/types/account-maintenance";

const INITIAL_FORM = {
    isExecutor: false,
    adminName: "",
    probateCourt: "",
    probateNumber: "",
    probatePage: "",
    date1: new Date(),
    date2: new Date(),
    adminAddress: "",
    adminCity: "",
    adminState: "",
    memo: "",
    changeAddressToAdmin: true,
    changeNameToEstate: true,
    probateDocUrl: "",
}

export default function NewAdmonForm() {
    const { data: activeRegisters } = useGetRegisters({
        size: 100,
        status: "ACTIVE"
    });

    const { currentUser } = useStore();

    const [registerId, setRegisterId] = useState("");
    const [search, setSearch] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const [formData, setFormData] = useState(INITIAL_FORM)

    const { data: accountsRes, isLoading: isLoadingAccount } = useGetAccounts(
        { q: searchQuery, registerId: registerId || undefined },
        { enabled: !!searchQuery }
    );

    const [selectedAccounts, setSelectedAccounts] = useState<Map<string, ShareholderAccount>>(new Map());
    const [allDiscoveredAccounts, setAllDiscoveredAccounts] = useState<ShareholderAccount[]>([]);

    useEffect(() => {
        const newItems = accountsRes?.data?.data || [];
        if (newItems.length > 0) {

            //eslint-disable-next-line
            setAllDiscoveredAccounts((prev) => {
                // Filter out any accounts we have already pulled into the table view
                const uniqueNewItems = newItems.filter(
                    (newItem) => !prev.some((oldItem) => oldItem.id === newItem.id)
                );
                return [...prev, ...uniqueNewItems];
            });
        }
    }, [accountsRes]);


    const accountLoaded = selectedAccounts.size > 0 || allDiscoveredAccounts.length > 0;

    const createAdmonMutation = useCreateAdmon();

    const handleSearch = () => {
        if (!search.trim()) {
            toast.error("Please enter an account number");
            return;
        }
        setSearchQuery(search);
    };

    const handleSubmit = () => {
        if (selectedAccounts.size === 0) {
            toast.error("Please select at least one deceased account from the list below.");
            return;
        }

        const { memo, ...requiredFields } = formData;

        if (Object.values(requiredFields).some((value) => value === "" || value === null || value === undefined)) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (!currentUser) {
            toast.error("Your session has expired. Please login again.");
            return;
        }

        const deceasedAccountIds = Array.from(selectedAccounts.keys());

        createAdmonMutation.mutate({
            ...formData,
            registerId: registerId,
            deceasedAccountIds,
            admonType: formData?.isExecutor ? "EXECUTOR" : "ADMINISTRATOR",
            probateDate: format(formData?.date1, "yyyy-MM-dd"),
            lodgementDate: format(formData?.date2, "yyyy-MM-dd"),
            initiatedBy: currentUser.email
        }, {
            onSuccess: () => {
                toast.success("Administration request submitted. Approver has been notified.");
                // Reset form
                setSearchQuery("");
                setSearch("");
                setFormData(INITIAL_FORM)
            },
            onError: (err) => {
                toast.error(err.message || "Failed to submit request");
            }
        });
    };

    const allChecked = allDiscoveredAccounts.length > 0 &&
        allDiscoveredAccounts.every((a) => selectedAccounts.has(a.id));

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
                                    <Checkbox
                                        checked={allChecked}
                                        onCheckedChange={(checked) => {
                                            setSelectedAccounts((prev) => {
                                                const next = new Map(prev);
                                                if (checked) {
                                                    // Select all items currently visible in the accumulated table
                                                    allDiscoveredAccounts.forEach((acc) => next.set(acc.id, acc));
                                                } else {
                                                    // Deselect all items currently visible in the accumulated table
                                                    allDiscoveredAccounts.forEach((acc) => next.delete(acc.id));
                                                }
                                                return next;
                                            });
                                        }}
                                    />
                                </th>
                                <th className="p-2">ACCT NO</th>
                                <th className="p-2">HOLDER NAME</th>
                                <th className="p-2">CHN</th>
                                <th className="p-2">HOLDINGS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y font-mono text-[13px] border-b">
                            {isLoadingAccount && allDiscoveredAccounts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-muted-foreground">Loading...</td>
                                </tr>
                            ) : allDiscoveredAccounts.length > 0 ? (
                                // 2. Loop over the combined results state here 
                                allDiscoveredAccounts.map((account) => {
                                    const isChecked = selectedAccounts.has(account.id);

                                    return (
                                        <tr key={account.id} className="hover:bg-accent/5">
                                            <td className="p-2">
                                                <Checkbox
                                                    checked={isChecked}
                                                    onCheckedChange={(checked) => {
                                                        setSelectedAccounts((prev) => {
                                                            const next = new Map(prev);
                                                            if (checked) {
                                                                next.set(account.id, account);
                                                            } else {
                                                                next.delete(account.id);
                                                            }
                                                            return next;
                                                        });
                                                    }}
                                                />
                                            </td>
                                            <td className="p-2">{account.accountNumber}</td>
                                            <td className="p-2 font-sans font-medium text-destructive">
                                                {account.firstName} {account.lastName} (DECEASED)
                                            </td>
                                            <td className="p-2">{account.chn || "-"}</td>
                                            <td className="p-2 text-right">{account.holdings?.toLocaleString()}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-muted-foreground">No accounts found. Search to add rows.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </Card>

            {accountLoaded && selectedAccounts.size > 0 && (
                <Card className="mrpsl-card p-6 space-y-6 animate-in fade-in">
                    <h3 className="font-semibold text-sm border-b pb-2">
                        2. Administrator Details
                    </h3>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="exec"
                            checked={formData?.isExecutor}
                            onCheckedChange={(c) => setFormData((prev) => ({ ...prev, isExecutor: !!c }))}
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
                                value={formData?.adminName}
                                onChange={(e) => setFormData((prev) => ({ ...prev, adminName: e.target.value }))}
                                placeholder="Estate of..."
                                className="mrpsl-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="mrpsl-label">Probate Court *</label>
                            <Input
                                value={formData?.probateCourt}
                                onChange={(e) => setFormData((prev) => ({ ...prev, probateCourt: e.target.value }))}
                                className="mrpsl-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <DateInput date={formData?.date1} setDate={(d) => setFormData((prev) => ({ ...prev, date1: d }))} label="Probate Date *" />
                        </div>
                        <div className="space-y-2">
                            <label className="mrpsl-label">Probate Number *</label>
                            <Input
                                value={formData?.probateNumber}
                                onChange={(e) => setFormData((prev) => ({ ...prev, probateNumber: e.target.value }))}
                                className="mrpsl-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="mrpsl-label">Probate Page *</label>
                            <Input
                                value={formData?.probatePage}
                                onChange={(e) => setFormData((prev) => ({ ...prev, probatePage: e.target.value }))}
                                className="mrpsl-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <DateInput date={formData?.date2} setDate={(d) => setFormData((prev) => ({ ...prev, date2: d }))} label="Lodgement Date *" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2 col-span-3">
                            <label className="mrpsl-label">Admin Address *</label>
                            <Textarea
                                value={formData?.adminAddress}
                                onChange={(e) => setFormData((prev) => ({ ...prev, adminAddress: e.target.value }))}
                                className="mrpsl-input"
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="mrpsl-label">Admin City *</label>
                            <Input
                                value={formData?.adminCity}
                                onChange={(e) => setFormData((prev) => ({ ...prev, adminCity: e.target.value }))}
                                className="mrpsl-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="mrpsl-label">Admin State *</label>
                            <Select value={formData?.adminState} onValueChange={(value) => setFormData((prev) => ({ ...prev, adminState: value || "" }))}>
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
                                value={formData?.memo}
                                onChange={(e) => setFormData((prev) => ({ ...prev, memo: e.target.value }))}
                                className="mrpsl-input"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <DocUploadZone
                                label="Probate / Letters of Administration"
                                required
                                fileTypes={["PDF"]}
                                maxSizeMB={10}
                                onUploadSuccess={(url) => setFormData((prev) => ({ ...prev, probateDocUrl: url }))}
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-muted/20 border rounded-md space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                                Change Holder Address to Admin Address
                            </span>
                            <Switch
                                checked={formData?.changeAddressToAdmin}
                                onCheckedChange={(value) => setFormData((prev) => ({ ...prev, changeAddressToAdmin: value }))}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                                Change Holder Name to Estate Name
                            </span>
                            <Switch
                                checked={formData?.changeNameToEstate}
                                onCheckedChange={(value) => setFormData((prev) => ({ ...prev, changeNameToEstate: value }))}
                            />
                        </div>
                        {formData?.changeNameToEstate && <div className="bg-background border p-3 rounded text-sm text-center font-mono space-y-1">
                            {Array.from(selectedAccounts.values()).map((acc) => (
                                <div key={acc.id}>
                                    <span className="text-muted-foreground line-through mr-2">
                                        {acc.firstName} {acc.lastName}
                                    </span>{" "}
                                    →{" "}
                                    <span className="font-bold text-primary">
                                        {formData?.adminName}
                                    </span>
                                </div>
                            ))}
                        </div>}
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
