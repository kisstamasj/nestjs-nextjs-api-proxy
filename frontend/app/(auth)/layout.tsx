import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";

import React from "react";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getUserSession();
  if (session) {
    redirect("/");
  }
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
