"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { AppPersona } from "@/lib/auth/persona";
import { canAccessPath } from "@/lib/auth/persona";

type AccessGuardProps = {
  persona: AppPersona;
  children: React.ReactNode;
};

export function AccessGuard({ persona, children }: AccessGuardProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!canAccessPath(persona, pathname)) {
      router.replace("/dashboard");
    }
  }, [persona, pathname, router]);

  return children;
}
