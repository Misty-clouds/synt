'use client';

import type { EntityType } from '@synt/shared';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Cpu, File, Globe, Network, Server, User, type LucideIcon } from 'lucide-react';
import { entityColor } from '../lib/ui';

const ICON: Record<EntityType, LucideIcon> = {
  user: User,
  host: Server,
  ip: Network,
  domain: Globe,
  process: Cpu,
  file: File,
};

export interface EntityNodeData {
  type: EntityType;
  label: string;
  suspicious: boolean;
  focus: boolean;
  [key: string]: unknown;
}

export function EntityNode({ data }: NodeProps & { data: EntityNodeData }) {
  const color = entityColor[data.type] ?? '#9ca3af';
  const Icon = ICON[data.type] ?? Network;

  return (
    <div className="synt-node-in flex flex-col items-center">
      <Handle type="target" position={Position.Top} className="!h-1 !w-1 !border-0 !bg-transparent" />
      <Handle type="source" position={Position.Bottom} className="!h-1 !w-1 !border-0 !bg-transparent" />

      <div
        className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 bg-app-card"
        style={{ borderColor: data.suspicious ? '#ef4444' : color }}
      >
        {data.focus && (
          <span
            className="absolute inset-[-6px] rounded-full"
            style={{ boxShadow: '0 0 0 2px #0055FF, 0 0 16px 2px rgba(0,85,255,0.6)' }}
          />
        )}
        {data.suspicious && (
          <span className="synt-pulse absolute inset-[-4px] rounded-full border border-red-500/50" />
        )}
        <Icon size={18} style={{ color }} />
      </div>

      <div className="mt-1.5 max-w-[120px] text-center">
        <p className="truncate text-[11px] font-medium text-zinc-200">{data.label}</p>
        <p className="text-[8px] uppercase tracking-wide text-zinc-600">{data.type}</p>
      </div>
    </div>
  );
}
