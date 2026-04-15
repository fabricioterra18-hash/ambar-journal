export default function Loading() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-sand-200 border-t-coral-500 rounded-full animate-spin" />
        <p className="text-charcoal-400 font-sans text-sm font-medium">Carregando...</p>
      </div>
    </main>
  )
}
