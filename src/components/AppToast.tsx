"use client";

import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning";

interface AppToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
}

const titles: Record<ToastType, string> = {
  success: "Success",
  error: "Couldn't save",
  warning: "Please check the form",
};

export default function AppToast({ type, message, onClose }: AppToastProps) {
  const Icon =
    type === "success" ? CheckCircle2 : type === "warning" ? AlertTriangle : AlertCircle;

  return (
    <div className={`app-toast app-toast-${type}`} role="status" aria-live="polite">
      <div className="app-toast-icon">
        <Icon />
      </div>
      <div className="app-toast-copy">
        <p className="app-toast-title">{titles[type]}</p>
        <p className="app-toast-msg">{message}</p>
      </div>
      <button type="button" className="app-toast-close" onClick={onClose} aria-label="Dismiss">
        <X />
      </button>
    </div>
  );
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
