"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md text-center border-border">
        <CardHeader className="space-y-2 pb-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Access Denied</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Your current role does not have permission to view this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mt-2">
            If you believe this is an error, please contact the System Administrator or IT Support to request additional permissions.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            Go Back
          </Button>
          <Button onClick={() => router.push("/")} className="ml-2">
            Dashboard Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}