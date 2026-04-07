interface PageHeaderProps {
  icon: string;
  title: string;
  description?: string;
}

export default function PageHeader({ icon, title, description }: PageHeaderProps) {
  return (
    <header className="mb-12">
      <div className="flex items-center gap-4 mb-3">
        <span className="text-4xl">{icon}</span>
        <h1 className="text-4xl font-bold text-white">{title}</h1>
      </div>
      {description && (
        <p className="text-zinc-400 text-lg">
          {description}
        </p>
      )}
    </header>
  );
}
