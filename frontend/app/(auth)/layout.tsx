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
  return <>{children}</>;
}
