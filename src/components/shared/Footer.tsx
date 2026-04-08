export default function Footer() {
  return (
    <footer className="w-full border-t border-[#2a2a2a] bg-[#0a0a0a] py-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-zinc-500 text-sm">
          Built with ❤️ | © {new Date().getFullYear()} ToolboxHub
        </p>
      </div>
    </footer>
  );
}
