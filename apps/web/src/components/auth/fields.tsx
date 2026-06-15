'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
      <p className="text-sm text-muted">{subtitle}</p>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}

export function AuthField({ id, label, value, onChange, onBlur, error, type = 'text', autoComplete, placeholder }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`w-full rounded-lg border bg-app-card-alt px-3.5 py-2.5 text-sm text-white placeholder:text-faint transition-colors focus:outline-none focus:ring-1 ${
          error ? 'border-red-500/50 focus:ring-red-500/40' : 'border-app-border focus:border-brand/60 focus:ring-brand/30'
        }`}
      />
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

export function AuthPasswordField(props: Omit<FieldProps, 'type'>) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={props.id} className="text-xs font-medium text-muted">
        {props.label}
      </label>
      <div className="relative">
        <input
          id={props.id}
          type={show ? 'text' : 'password'}
          value={props.value}
          autoComplete={props.autoComplete}
          placeholder={props.placeholder}
          onChange={(e) => props.onChange(e.target.value)}
          onBlur={props.onBlur}
          className={`w-full rounded-lg border bg-app-card-alt px-3.5 py-2.5 pr-10 text-sm text-white placeholder:text-faint transition-colors focus:outline-none focus:ring-1 ${
            props.error ? 'border-red-500/50 focus:ring-red-500/40' : 'border-app-border focus:border-brand/60 focus:ring-brand/30'
          }`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-dim transition-colors hover:text-white"
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {props.error && <p className="text-[11px] text-red-400">{props.error}</p>}
    </div>
  );
}

export function AuthButton({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(0,85,255,0.6)] transition-all hover:bg-brand/90 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
