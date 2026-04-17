"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const maxWidthClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-xl",
  xl: "max-w-2xl",
  "2xl": "max-w-3xl",
};

export function Dialog({ open, onClose, children, maxWidth = "lg" }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-[10vh] sm:pt-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[85vh] sm:max-h-[90vh]",
          "border-2 border-purple-200",
          "ring-1 ring-purple-100",
          maxWidthClasses[maxWidth]
        )}
      >
        {/* Purple top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 rounded-t-2xl flex-shrink-0" />
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-purple-200 flex-shrink-0 bg-white rounded-t-2xl",
      className
    )}>
      {children}
    </div>
  );
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-xl font-bold text-gray-900", className)}>{children}</h2>;
}

export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-5 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1", className)}>{children}</div>;
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "flex items-center justify-end gap-2 sm:gap-3 px-5 sm:px-6 py-3 sm:py-4 border-t border-purple-100 flex-shrink-0 bg-purple-50/40 rounded-b-2xl",
      className
    )}>
      {children}
    </div>
  );
}

export function DialogCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="p-1.5 rounded-lg hover:bg-purple-100 text-purple-300 hover:text-purple-600 transition-colors"
    >
      <X className="w-4 h-4" />
    </button>
  );
}
