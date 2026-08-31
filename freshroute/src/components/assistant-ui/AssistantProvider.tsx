"use client";

import type { ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
} from "@assistant-ui/react";
import { geminiChatAdapter } from "@/lib/assistant-adapter";

export function AssistantProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const runtime = useLocalRuntime(geminiChatAdapter);
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
