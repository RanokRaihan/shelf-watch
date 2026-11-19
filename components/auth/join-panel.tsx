"use client";

import { useState } from "react";

import { JoinForm } from "@/components/auth/join-form";
import { RejoinForm } from "@/components/auth/rejoin-form";
import { Button } from "@/components/ui/button";

// Switches the join page between joining (new member) and logging in (existing member).
export function JoinPanel({ token, storeName }: { token: string; storeName: string }) {
  const [mode, setMode] = useState<"join" | "login">("join");
  const isJoin = mode === "join";

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
          {isJoin ? `Join ${storeName}` : `Log in to ${storeName}`}
        </h1>
        <p className="text-base text-muted-foreground">
          {isJoin
            ? "Your manager will approve you before you can start."
            : "Already a member? Use your username and PIN."}
        </p>
      </div>
      {isJoin ? <JoinForm token={token} /> : <RejoinForm token={token} />}
      <p className="text-center text-base text-muted-foreground">
        {isJoin ? "Already a member?" : "New to this store?"}{" "}
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-base font-medium text-foreground underline underline-offset-4"
          onClick={() => setMode(isJoin ? "login" : "join")}
        >
          {isJoin ? "Log in" : "Join instead"}
        </Button>
      </p>
    </>
  );
}
