interface PageHeaderProps {
  icon: any; // Support both strings and Lucide components
  title: string;
  description?: string;
}

export default function PageHeader({ icon, title, description }: PageHeaderProps) {
  return (
    <div className="mb-12 flex flex-col items-center text-center animate-in fade-in slide-in-from-top-4 duration-1000">
      <div className="mb-6 relative">
        {/* Soft Glow Background */}
        <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
        
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-card border border-border shadow-xl shadow-primary/5 text-4xl transition-transform hover:scale-110 hover:rotate-3 duration-500">
          {typeof icon === "string" ? icon : (() => {
            const Icon = icon;
            return <Icon className="h-10 w-10 text-primary" />;
          })()}
        </div>
      </div>
      
      <h1 className="mb-3 text-4xl font-black tracking-tighter text-foreground sm:text-5xl lg:text-6xl animate-gradient-text bg-gradient-to-r from-foreground via-foreground/80 to-foreground bg-clip-text">
        {title}
      </h1>
      
      {description && (
        <p className="max-w-2xl text-sm font-medium text-muted-foreground uppercase tracking-[0.2em] opacity-80">
          {description}
        </p>
      )}
    </div>
  );
}
