export default function Loading() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-3 border-amber-700/20 border-t-amber-700 rounded-full animate-spin" />
        <p className="text-ink-600 font-sans text-sm">Carregando...</p>
      </div>
    </main>
  )
}
