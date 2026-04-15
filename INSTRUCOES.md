# Âmbar Journal - Guia de Execução

Sua fundação frontend mobile-first foi construída com sucesso! 🎉

## Como testar agora:

1. Abra o terminal nesta pasta:
   ```bash
   cd "c:/Users/Fabrício Terra/Documents/Projetos/Bujo/ambar-journal"
   ```
2. Instale dependências (caso falte alguma na sua máquina):
   ```bash
   npm install
   ```
3. Rode o servidor de dev:
   ```bash
   npm run dev
   ```
4. Navegue até o link local `http://localhost:3000` em um simulador de celular ou inspecione no Chrome/Safari em modo de "Device Toolbar" (Mobile responsive) já que a UI é estritamente travada para max-w-md para garantir a sensação mobile.

## Rotas para testar:
- `/` - Hoje (Visão principal)
- `/journal` - Daily Log (A timeline baseada no conceito do Bujo)
- `/collections` - Coleções
- `/insights` - Busca + Resumos Reflexivos de IA
- `/onboarding` - Fluxo de introdução

## Interações:
- O botão (FAB) no bottom bar abre a **Capture Sheet** animada (para testes das anotações rápidas).

A estrutura atual foca na **velocidade visual, design design tokens ("Digital Vellum" style)** e usa Next.js Server & Client Components separados da maneira recomendada. A próxima fase integrará o **Supabase** de verdade com schema SQL.
