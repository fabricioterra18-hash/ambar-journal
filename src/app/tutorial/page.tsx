import Link from 'next/link'
import { ArrowLeft, Compass, Sparkles, ListChecks, PenLine } from 'lucide-react'

export default function TutorialPage() {
  return (
    <main className="flex-1 flex flex-col p-5 pb-32">
      <header className="pt-6 pb-5">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-xs font-sans text-charcoal-500 hover:text-charcoal-700 mb-3"
        >
          <ArrowLeft size={12} /> Voltar
        </Link>
        <p className="text-charcoal-400 font-sans font-medium text-xs tracking-widest uppercase mb-1">
          Tutorial
        </p>
        <h1 className="text-2xl font-heading text-charcoal-900">
          Aprender a usar
        </h1>
      </header>

      <Section id="como" icon={<Compass size={16} className="text-coral-500" />} title="Como funciona o Âmbar">
        <p>
          O Âmbar é um bullet journal digital: você captura pensamentos, tarefas e eventos num fluxo rápido e
          organiza depois. Toque no botão <b>+</b> para capturar algo em segundos.
        </p>
        <ul>
          <li><b>Tarefa</b> — algo a fazer.</li>
          <li><b>Evento</b> — algo que tem hora/data.</li>
          <li><b>Nota</b> — uma ideia ou observação.</li>
          <li><b>Insight</b> — uma reflexão sua.</li>
        </ul>
        <p>
          Pendências do dia anterior aparecem no topo em &ldquo;Pendências&rdquo;. Um toque em
          &ldquo;Mover p/ hoje&rdquo; e pronto — sem acumular culpa.
        </p>
      </Section>

      <Section id="escrever" icon={<PenLine size={16} className="text-sky-500" />} title="Escreva do seu jeito">
        <p>
          O compositor aceita texto livre. Você pode organizar manualmente escolhendo o tipo (tarefa, evento,
          nota) ou deixar a IA interpretar para você.
        </p>
        <p>
          <b>Dica:</b> frases como <i>&ldquo;amanhã 15h reunião com o time&rdquo;</i> já viram eventos prontos.
        </p>
      </Section>

      <Section id="ia" icon={<Sparkles size={16} className="text-lavender-500" />} title="O que a IA faz">
        <p>
          A IA é opcional e serve para te ajudar — nunca substitui você. Ela pode:
        </p>
        <ul>
          <li>organizar o que você escreveu em tarefas, eventos e notas;</li>
          <li>quebrar uma tarefa grande em passos menores;</li>
          <li>sugerir o próximo passo quando você trava;</li>
          <li>resumir seu dia e detectar padrões (se você permitir).</li>
        </ul>
        <p>
          Ligue ou desligue cada parte nas <Link href="/settings" className="text-coral-500 underline">configurações</Link>.
        </p>
      </Section>

      <Section id="microtasks" icon={<ListChecks size={16} className="text-honey-500" />} title="Como usar microtarefas">
        <p>
          Tarefas grandes travam. Microtarefas existem para <b>destravar</b>.
        </p>
        <ol>
          <li>Toque na tarefa para abrir as ações.</li>
          <li>Clique em <b>IA Steps</b> — a IA sugere 3 a 6 passos concretos.</li>
          <li>Vá marcando cada passo conforme avança. Se travar, use <b>Próximo passo</b>.</li>
        </ol>
        <p>
          Você pode <b>Regenerar</b>, <b>Simplificar</b> ou <b>Expandir</b> qualquer passo individualmente.
        </p>
      </Section>

      <div className="bg-coral-50 border border-coral-100 rounded-2xl p-4 mt-4">
        <p className="text-xs font-sans text-charcoal-700 leading-relaxed">
          Algo confuso? Mande feedback nas <Link href="/settings" className="text-coral-600 font-semibold underline">configurações</Link>.
        </p>
      </div>
    </main>
  )
}

function Section({ id, icon, title, children }: { id: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-6 scroll-mt-20">
      <div className="flex items-center gap-2 mb-3 px-1">
        {icon}
        <h2 className="font-heading text-lg text-charcoal-900">{title}</h2>
      </div>
      <div className="bg-surface rounded-2xl card-shadow border border-sand-200/40 p-4 text-sm font-sans text-charcoal-700 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_b]:text-charcoal-900 [&_b]:font-semibold">
        {children}
      </div>
    </section>
  )
}
