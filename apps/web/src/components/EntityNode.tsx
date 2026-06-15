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
    <div className="synt-node-in flex w-[140px] flex-col items-center">
      <Handle type="target" position={Position.Top} className="!h-1 !w-1 !border-0 !bg-transparent" />
      <Handle type="source" position={Position.Bottom} className="!h-1 !w-1 !border-0 !bg-transparent" />

      <div
        className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 bg-app-card shadow-lg"
        style={{ borderColor: data.suspicious ? '#ef4444' : color }}
      >
        {data.focus && (
          <span
            className="absolute inset-[-7px] rounded-full"
            style={{ boxShadow: '0 0 0 2px #0055FF, 0 0 18px 3px rgba(0,85,255,0.6)' }}
          />
        )}
        {data.suspicious && (
          <span className="synt-pulse absolute inset-[-5px] rounded-full border border-red-500/50" />
        )}
        <Icon size={24} style={{ color }} />
      </div>

      <div className="mt-2 w-full text-center">
        <p className="truncate text-[13px] font-semibold text-ink">{data.label}</p>
        <p className="text-[9px] font-medium uppercase tracking-wide" style={{ color }}>
          {data.type}
        </p>
      </div>
    </div>
  );
}
