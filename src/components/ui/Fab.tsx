'use client';

import { Plus } from 'lucide-react';

interface FabProps {
    onClick: () => void;
}

export function Fab({ onClick }: FabProps) {
    return (
        <button
            onClick={onClick}
            className="h-16 w-16 bg-amber-700 border-2 border-ink-900 rounded-full flex items-center justify-center text-sunlight-50 shadow-[4px_4px_0_0_#1F1B16] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_0_#1F1B16] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all outline-none"
            aria-label="Capturar"
        >
            <Plus size={32} strokeWidth={2} />
        </button>
    );
}
