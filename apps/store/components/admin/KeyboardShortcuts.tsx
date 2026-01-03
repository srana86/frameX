"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CommandShortcut } from "@/components/ui/command";

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  { keys: ["⌘", "K"], description: "Open Command Palette", category: "Navigation" },
  { keys: ["⌘", "B"], description: "Toggle Sidebar", category: "Navigation" },
  { keys: ["/"], description: "Focus Search", category: "Navigation" },
  { keys: ["Esc"], description: "Close Dialog/Modal", category: "General" },
  { keys: ["⌘", "Enter"], description: "Save Form", category: "Forms" },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "?" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Speed up your workflow with these keyboard shortcuts</DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          {Object.entries(groupedShortcuts).map(([category, items]) => (
            <div key={category}>
              <h3 className='text-sm font-semibold mb-2 text-muted-foreground'>{category}</h3>
              <div className='space-y-2'>
                {items.map((shortcut, index) => (
                  <div key={index} className='flex items-center justify-between py-2 border-b last:border-0'>
                    <span className='text-sm'>{shortcut.description}</span>
                    <div className='flex items-center gap-1'>
                      {shortcut.keys.map((key, keyIndex) => (
                        <Badge key={keyIndex} variant='outline' className='font-mono text-xs'>
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className='text-xs text-muted-foreground text-center pt-4 border-t'>
          Press{" "}
          <Badge variant='outline' className='font-mono'>
            ⌘?
          </Badge>{" "}
          to open this dialog
        </div>
      </DialogContent>
    </Dialog>
  );
}
