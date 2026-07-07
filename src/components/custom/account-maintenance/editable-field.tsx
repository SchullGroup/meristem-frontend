"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PenLine, Loader2, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { KycChange } from "@/types/account-maintenance";
import { formatDate } from "@/lib/utils/format";

interface EditableFieldProps {
  label: string;
  currentValue: string;
  fieldKey: string;
  inputType?: "text" | "textarea" | "select";
  selectOptions?: { value: string; label: string }[];
  pendingChange: KycChange | null;
  readOnly?: boolean;
  extraInput?: React.ReactNode;
  onSubmit: (newValue: string, reason: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function EditableField({
  label,
  currentValue,
  inputType = "text",
  selectOptions,
  pendingChange,
  readOnly = false,
  extraInput,
  onSubmit,
  isSubmitting: _isSubmitting = false, // kept for parent-driven loading if needed
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [reason, setReason] = useState("");
  const [localSubmitting, setLocalSubmitting] = useState(false);

  const isSubmitting = localSubmitting || _isSubmitting;
  const hasPending = !!pendingChange;
  const isDisabled = hasPending || readOnly;

  const handleStartEdit = () => {
    if (isDisabled) return;
    setNewValue("");
    setReason("");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewValue("");
    setReason("");
  };

  const handleSubmit = async () => {
    if (!reason.trim() || !newValue.trim()) return;
    setLocalSubmitting(true);
    try {
      await onSubmit(newValue.trim(), reason.trim());
      setIsEditing(false);
      setNewValue("");
      setReason("");
    } catch {
      // Error toast already shown by parent — keep editing open so user can retry
    } finally {
      setLocalSubmitting(false);
    }
  };

  const canSubmit = newValue.trim().length > 0 && reason.trim().length > 0;

  const renderInput = () => {
    switch (inputType) {
      case "textarea":
        return (
          <Textarea
            className="mrpsl-input text-sm"
            placeholder={`Enter new ${label.toLowerCase()}`}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            rows={2}
          />
        );
      case "select":
        return (
          <Select value={newValue} onValueChange={(v) => setNewValue(v || "")}>
            <SelectTrigger className="mrpsl-input">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {selectOptions?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            className="mrpsl-input"
            placeholder={`Enter new ${label.toLowerCase()}`}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
        );
    }
  };

  return (
    <div
      className={cn(
        "grid grid-cols-[200px_1fr_1fr] gap-6 items-start py-3 border-b border-border/20 last:border-0 transition-all",
        isEditing &&
          "border-l-2 border-l-primary pl-3 -ml-3 bg-primary/2 rounded-r-md",
        hasPending &&
          !isEditing &&
          "border-l-2 border-l-amber-400 pl-3 -ml-3 bg-amber-50/20 rounded-r-md",
      )}
    >
      {/* Column 1: Label */}
      <div className="flex items-center gap-2 pt-0.5">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      </div>

      {/* Column 2: Current Value */}
      <div className="flex items-center gap-2 flex-wrap pt-0.5">
        <span className="text-sm font-medium">{currentValue || "—"}</span>
        {hasPending && (
          <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] h-5 px-1.5 font-bold uppercase">
            Pending
          </Badge>
        )}
      </div>

      {/* Column 3: New Value / Actions */}
      <div>
        {isEditing ? (
          <div className="space-y-2.5">
            {extraInput && <div>{extraInput}</div>}
            {renderInput()}
            <Input
              className="mrpsl-input text-sm"
              placeholder="Reason for change (required)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex items-center gap-2 pt-0.5">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="h-7 text-[12px]"
              >
                {isSubmitting && (
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                )}
                Submit for approval
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                className="h-7 text-[12px] text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : hasPending ? (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {pendingChange.initiatorName || "—"} ·{" "}
              {formatDate(pendingChange.createdAt)}
            </span>
          </div>
        ) : !readOnly ? (
          <button
            type="button"
            onClick={handleStartEdit}
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-primary/5"
          >
            <PenLine className="h-3.5 w-3.5" />
            Edit
          </button>
        ) : (
          <span className="text-[12px] text-muted-foreground/50 italic">
            Contact admin to update
          </span>
        )}
      </div>
    </div>
  );
}
