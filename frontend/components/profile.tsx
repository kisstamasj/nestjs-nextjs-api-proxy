"use client";

import { SessionPayload } from "@/lib/session";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Profile = ({ session }: { session: SessionPayload | null }) => {
  const [error, setError] = useState(null);
  const router = useRouter();

  const signOut = async () => {
    await fetch("/api/auth/sign-out", {
      method: "POST",
    });
    setError(null);
    router.refresh();
  };

  return (
    <div>
      {error && (
        <p className="text-red-500">
          {JSON.stringify(error) || "An error occurred"}
        </p>
      )}
      <p>
        {session
          ? `Signed in as ${session.firstName} ${session.lastName} (${session.email})`
          : "Not signed in."}
      </p>
      {session && (
        <button
          onClick={signOut}
          className="mt-4 rounded bg-red-500 px-4 py-2 text-white"
        >
          Sign Out
        </button>
      )}
    </div>
  );
};

export default Profile;
