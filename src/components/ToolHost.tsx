'use client';

import { TOOL_REGISTRY } from '@/tools/registry';

export default function ToolHost({ toolKey }: { toolKey: string }) {
  const t = TOOL_REGISTRY[toolKey];
  if (!t) return null;
  const C = t.Component;
  return <C />;
}
