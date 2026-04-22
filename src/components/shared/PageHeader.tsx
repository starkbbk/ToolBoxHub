interface PageHeaderProps {
  icon: any; // Support both strings and Lucide components
  title: string;
  description?: string;
}

export default function PageHeader({ icon, title, description }: PageHeaderProps) {
  const Icon = icon;
  return (
    <header className="mb-12">
      <div className="flex items-center gap-4 mb-3">
        <span className="text-4xl">
          {typeof icon === "string" ? icon : <Icon className="h-10 w-10 text-indigo-500" />}
        </span>
        <h1 className="text-4xl font-bold text-foreground">{title}</h1>
      </div>
      {description && (
        <p className="text-muted-foreground text-lg">
          {description}
        </p>
      )}
    </header>
  );
}
