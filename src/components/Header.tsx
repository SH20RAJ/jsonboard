interface HeaderProps {}

export function Header({}: HeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="text-2xl">🧩</div>
        <div>
          <h1 className="text-xl font-semibold">JsonBoard</h1>
          <p className="text-sm text-muted-foreground">Visual JSON Database</p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-sm text-muted-foreground">
          Local-first • Auto-save enabled
        </div>
      </div>
    </header>
  );
}
