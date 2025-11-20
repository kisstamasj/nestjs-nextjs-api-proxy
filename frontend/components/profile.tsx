"use client";

import { SIGN_OUT_ENDPOINT } from "@/lib/config";
import { User } from "@/lib/session";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Profile = ({ session }: { session: User | null }) => {
  const router = useRouter();
  const [profileData, setProfileData] = useState<User | null>(null);
  const [profileFetchedCount, setProfileFetchedCount] = useState(0);

  const signOut = async () => {
    await fetch(`/api${SIGN_OUT_ENDPOINT}`, {
      method: "POST",
    });
    router.refresh();
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      const data = await response.json();
      setProfileData(data);
      console.log("Profile data:", data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  // Fetch profile multiple times parallelly
  const fetchProfileLoop = async (times: number) => {
    const fetchPromises = Array.from({ length: times }, () => fetchProfile());
    await Promise.all(fetchPromises);
    setProfileFetchedCount((count) => count + times);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      <p>
        {session
          ? `Signed in as ${session.firstName} ${session.lastName} (${session.email})`
          : "Not signed in."}
      </p>
      {session && (
        <>
          <div className="flex flex-row gap-4 justify-center items-center">
            <button
              onClick={signOut}
              className="mt-4 rounded bg-red-500 px-4 py-2 text-white"
            >
              Sign Out
            </button>
            <button
              onClick={fetchProfile}
              className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
            >
              Fetch Profile Data
            </button>
            <button
              onClick={() => fetchProfileLoop(2)}
              className="mt-4 rounded bg-green-500 px-4 py-2 text-white"
            >
              Fetch Profile Data 2 Times
            </button>
            <div>Profile fetched count: {profileFetchedCount}</div>
          </div>
          {profileData && (
            <>
              <h3 className="text-xl font-semibold mt-6">Profile Data:</h3>
              <p>
                id: {profileData.id} <br />
                email: {profileData.email} <br />
                firstName: {profileData.firstName} <br />
                lastName: {profileData.lastName} <br />
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;
