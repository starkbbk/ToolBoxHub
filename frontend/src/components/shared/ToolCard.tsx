import { cn } from "@/lib/utils";
import Link from "next/link";

interface ToolCardProps {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<LucideProps>;
  route: string;
  status: string;
  glowColor?: string;
}

import { ComponentType } from "react";
import { LucideProps } from "lucide-react";
import LiquidGlassIcon from "./LiquidGlassIcon";

export default function ToolCard({ name, description, icon: Icon, route, status, glowColor }: ToolCardProps) {
  const isActive = status === "active";

  const CardContent = (
    <div className={cn(
      "group relative flex flex-col items-center rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-8 text-center transition-all duration-300",
      isActive ? "hover:scale-[1.02] hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]" : "opacity-60 cursor-not-allowed"
    )}>
      <LiquidGlassIcon glowColor={glowColor} className="mb-8">
        <Icon className="h-8 w-8" />
      </LiquidGlassIcon>
      <h3 className="mb-2 text-xl font-bold text-white">{name}</h3>
      <p className="mb-6 text-zinc-400 text-sm leading-relaxed">
        {description}
      </p>
      
      <div className="flex items-center gap-2">
        {isActive ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-green-500">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Active
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
            Coming Soon
          </span>
        )}
      </div>

      {isActive && (
        <div className="mt-6 flex items-center text-sm font-semibold text-indigo-400">
          Open Tool →
        </div>
      )}
    </div>
  );

  return isActive ? (
    <Link href={route}>{CardContent}</Link>
  ) : (
    <div>{CardContent}</div>
  );
}
