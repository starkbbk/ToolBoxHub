import Link from "next/link";

interface ComingSoonProps {
  icon: string;
  name: string;
}

export default function ComingSoon({ icon, name }: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="mb-8 text-8xl animate-bounce">
        {icon}
      </div>
      <h1 className="mb-4 text-4xl font-bold text-white">{name}</h1>
      <h2 className="mb-6 text-2xl font-semibold text-indigo-400 animate-pulse">
        Coming Soon!
      </h2>
      <p className="mb-10 max-w-md text-zinc-400">
        We're working hard to bring you this tool. Stay tuned for updates!
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          href="/" 
          className="rounded-xl border border-[#2a2a2a] bg-zinc-900 px-8 py-3 font-medium text-white transition-colors hover:bg-zinc-800"
        >
          ← Back to Tools
        </Link>
        <button className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-8 py-3 font-medium text-white transition-opacity hover:opacity-90">
          Get Notified
        </button>
      </div>
    </div>
  );
}
