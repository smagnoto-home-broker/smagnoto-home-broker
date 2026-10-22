export default function CarregandoLeads() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-28 rounded bg-cream" />
          <div className="h-4 w-52 rounded bg-cream mt-2" />
        </div>
        <div className="h-9 w-32 rounded-xl bg-cream" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card p-4">
            <div className="h-7 w-12 rounded bg-cream" />
            <div className="h-3 w-24 rounded bg-cream mt-2" />
          </div>
        ))}
      </div>
      <div className="card p-4">
        <div className="h-4 w-40 rounded bg-cream" />
      </div>
      <p className="text-sm text-mute">Carregando leads…</p>
    </div>
  );
}
