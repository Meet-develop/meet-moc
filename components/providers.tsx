"use client";

import { RelationshipProvider } from "@/contexts/relationship-context";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <RelationshipProvider>{children}</RelationshipProvider>;
}
