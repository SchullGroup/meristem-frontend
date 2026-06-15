"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RepushQueue } from "@/components/custom/dividend-payments/re-push-queue";
import { NewMandatePayment } from "@/components/custom/dividend-payments/new-mandate";
import { PaymentHistory } from "@/components/custom/dividend-payments/payment-history";
import DeclarationPayment from "@/components/custom/dividend-payments/declaration-payment";
import { IcuApproval } from "@/components/custom/dividend-payments/icu-approval";

export default function PaymentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dividend Payment</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Initiate and track dividend disbursement via NIBSS and Remita
        </p>
      </div>

      <Tabs defaultValue="decl" className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="decl"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Declaration Payments
          </TabsTrigger>
          <TabsTrigger
            value="icu"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            ICU Approval
          </TabsTrigger>
          <TabsTrigger
            value="new"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            New Mandate Payments
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Payment History
          </TabsTrigger>
          <TabsTrigger
            value="repush"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Re-Push Queue
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="decl" className="space-y-6">
            <DeclarationPayment tab="decl" />
          </TabsContent>

          <TabsContent value="icu" className="space-y-4">
            <IcuApproval />
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <NewMandatePayment tab="new" />
          </TabsContent>

          <TabsContent value="history">
            <PaymentHistory tab="history" />
          </TabsContent>

          <TabsContent value="repush" className="space-y-4">
            <RepushQueue tab="repush" />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
