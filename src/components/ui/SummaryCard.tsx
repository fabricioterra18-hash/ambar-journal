interface SummaryCardProps {
    eventsCount: number;
    tasksCount: number;
}

export function SummaryCard({ eventsCount, tasksCount }: SummaryCardProps) {
    return (
        <div className="bg-sunlight-200 rounded-2xl p-5 mb-8 border-2 border-ink-900 shadow-[4px_4px_0_0_#1F1B16]">
            <p className="text-ink-900 text-sm leading-relaxed font-sans font-medium">
                Você tem <strong>{eventsCount} eventos</strong> hoje e <strong>{tasksCount} tarefas</strong> pendentes do seu último log.
            </p>
        </div>
    );
}
