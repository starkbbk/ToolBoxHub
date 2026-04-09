export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card/30 backdrop-blur-md py-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-muted-foreground text-sm">
          Built with ❤️ | © {new Date().getFullYear()} ToolboxHub
        </p>
      </div>
    </footer>
  );
}
