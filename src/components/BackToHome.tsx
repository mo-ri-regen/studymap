"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** 計画がないときは、初めて開いたときの画面へ */
export function BackToHome() {
  const router = useRouter();
  useEffect(() => router.replace("/"), [router]);
  return null;
}
