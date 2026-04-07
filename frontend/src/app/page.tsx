import ToolCard from "@/components/shared/ToolCard";
import { TOOLS } from "@/constants/tools";

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="mb-20 text-center">
        <h1 className="mb-6 text-6xl font-extrabold tracking-tight sm:text-7xl">
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 bg-clip-text text-transparent">
            ToolboxHub
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-zinc-400">
          Your All-in-One Online Tool Suite — Free, Fast, and Powered by Professional AI.
        </p>
        
        {/* Subtle Animated Background Accent */}
        <div className="absolute top-[-10%] left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
      </section>

      {/* Tools Grid */}
      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <ToolCard
            key={tool.id}
            {...tool}
          />
        ))}
      </div>
    </div>
  );
}
