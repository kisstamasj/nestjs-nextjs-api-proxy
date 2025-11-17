import SignInForm from "@/components/sign-in-form";
import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const session = await getUserSession();
  if (session) {
    redirect("/");
  }
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignInForm />
      </div>
    </div>
  );
}
