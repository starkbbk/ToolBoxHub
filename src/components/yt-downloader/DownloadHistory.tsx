"use client";

import React, { useEffect } from 'react';
import { useDownloadStore } from '@/stores/useDownloadStore';
import DownloadCard from './DownloadCard';
import { History, Trash2, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DownloadHistory() {
  const { history, fetchHistory, deleteRecord, clearHistory } = useDownloadStore();
  const [isOpen, setIsOpen] = React.useState(false);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (history.length === 0) return null;

  return (
    <div className="mt-12 mb-24">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full space-y-4"
      >
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="p-0 hover:bg-transparent group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-secondary/50 group-hover:bg-red-500/20 group-hover:text-red-500 transition-colors">
                  <History className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-white">Recent Downloads</h3>
                <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-black">{history.length}</span>
              </div>
            </Button>
          </CollapsibleTrigger>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-red-500"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-popover border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white font-black uppercase">Clear History?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground font-medium">
                  This will delete all download records and local files from the server. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-secondary border-white/5 font-bold uppercase tracking-widest text-[10px]">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={clearHistory}
                  className="bg-red-600 hover:bg-red-500 font-bold uppercase tracking-widest text-[10px]"
                >
                  Clear Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <CollapsibleContent className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {history.map((download) => (
              <DownloadCard 
                key={download.id} 
                download={download} 
                onDelete={deleteRecord} 
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
