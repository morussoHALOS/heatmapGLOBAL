"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PasswordLogin from "@/components/PasswordLogin";

export default function HomePage() {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);

    const handleSuccess = () => {
      setUnlocked(true);
      router.push("/map");
    };

  return unlocked ? (
    <main className="p-6">
    </main>
  ) : (
    <PasswordLogin onSuccess={handleSuccess} />
  );
}
