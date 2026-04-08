"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { clipmaster } from "@/lib/api";
import { Rubric } from "@/lib/types";
import { 
  Plus, 
  ScrollText, 
  Trash2, 
  Edit3, 
  History,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function RubricsPage() {
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRubrics = async () => {
    try {
      const resp = await clipmaster.getRubrics();
      setRubrics(resp.data);
    } catch (err) {
      toast.error("Failed to fetch rubrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRubrics();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this rubric?")) return;
    try {
      await clipmaster.deleteRubric(id);
      setRubrics(rubrics.filter(r => r.id !== id));
      toast.success("Rubric deleted");
    } catch (err) {
      toast.error("Failed to delete rubric");
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <PageHeader
          icon="📋"
          title="Clipping Rubrics"
          description="Define custom AI analysis rules to focus on specific types of content."
        />
        
        <button className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
          <Plus className="h-5 w-5" />
          Create Rubric
        </button>
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
        </div>
      ) : rubrics.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[40vh] rounded-3xl border-2 border-dashed border-[#2a2a2a] p-12 text-center">
          <div className="rounded-full bg-zinc-900 p-6 mb-6">
            <ScrollText className="h-12 w-12 text-zinc-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No custom rubrics yet</h3>
          <p className="text-zinc-500 max-w-sm mb-8">
            Rubrics allow you to tell the AI exactly what kind of moments to look for in your videos.
          </p>
          <button className="text-indigo-400 font-bold text-sm hover:underline">
            Learn more about rubrics →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rubrics.map((rubric) => (
            <div 
              key={rubric.id}
              className="flex flex-col rounded-3xl border border-[#2a2a2a] bg-[#1a1a1a] p-8 transition-all hover:border-[#3a3a3a] hover:bg-[#202020]"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400">
                    <History className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-white text-lg">{rubric.name}</h3>
                </div>
                {rubric.is_default && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-green-500 bg-green-500/10 px-2 py-1 rounded-md">
                    Default
                  </span>
                )}
              </div>

              <p className="text-sm text-zinc-400 mb-8 leading-relaxed italic">
                {rubric.description || "No description provided."}
              </p>

              <div className="space-y-3 mb-8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Active Rules</p>
                {rubric.rules.map((rule, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-indigo-500 flex-shrink-0" />
                    <span className="text-sm text-zinc-300">{rule}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto flex items-center justify-end gap-2 border-t border-[#2a2a2a] pt-6">
                <button className="rounded-xl border border-[#2a2a2a] bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors">
                  <Edit3 className="h-4 w-4" />
                </button>
                <button 
                   onClick={() => handleDelete(rubric.id)}
                   className="rounded-xl border border-[#2a2a2a] bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
