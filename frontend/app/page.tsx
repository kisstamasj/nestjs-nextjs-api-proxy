import Profile from "@/components/profile";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Health App",
};

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold">
          Welcome to the Health and Fitness App
        </h1>
      </div>
      <Profile session={session} />
    </main>
  );
}
