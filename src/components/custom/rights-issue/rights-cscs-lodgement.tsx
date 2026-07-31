"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { downloadRightsLodgement } from "@/actions/rightsActions";

export function RightsCscsLodgement({ declarationId }: { declarationId?: string }) {
  const [format, setFormat] = useState<"RIN_AT_CSCS" | "RIN_NOT_AT_CSCS">("RIN_AT_CSCS");
  const [downloading, setDownloading] = useState(false);

  if (!declarationId) {
    return (
      <Card className="mrpsl-card p-8 text-center text-sm text-muted-foreground">
        Select a rights issue above to download the CSCS lodgement file.
      </Card>
    );
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await downloadRightsLodgement(declarationId!, format);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rights_lodgement_${declarationId}_${format.toLowerCase()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error((e as Error).message || "Failed to download lodgement file.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">CSCS Lodgement</h3>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Download the approved allotment in the CSCS-accepted fixed-width format (DEMATWITHNEWSHARES, 143-char records).
        </p>
      </div>

      <Card className="mrpsl-card p-5 space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Lodgement format:</span>
          <RadioGroup
            value={format}
            onValueChange={(v) => setFormat(v as "RIN_AT_CSCS" | "RIN_NOT_AT_CSCS")}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="RIN_AT_CSCS" id="r-at" />
              <label htmlFor="r-at" className="text-sm cursor-pointer">RIN at CSCS</label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="RIN_NOT_AT_CSCS" id="r-not" />
              <label htmlFor="r-not" className="text-sm cursor-pointer">RIN NOT at CSCS</label>
            </div>
          </RadioGroup>
          <Button className="gap-2 ml-auto" disabled={downloading} onClick={handleDownload}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download CSCS Lodgement File
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Only ICU-approved allotments are included. Each record is a fixed-width positional line
          (Member Code · CHN · Investor&apos;s Name · Certificate Number · Registrar Acct · Symbol · Volume).
        </p>
      </Card>
    </div>
  );
}
