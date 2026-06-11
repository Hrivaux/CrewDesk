# CrewDesk

« Les Sims de la productivité IA » — vous parlez à **un seul agent**, Atlas.
Il cadre votre besoin, le découpe en tâches sur le kanban intégré, assigne
chaque tâche à un agent spécialiste, et l'équipe travaille sous vos yeux
dans un diorama isométrique animé.

## Démarrage

```bash
npm install
npm run dev          # http://localhost:3000 — mode simulation
```

## Mode live (vrais agents, vrais livrables)

1. Copier `.env.example` vers `.env.local`
2. Renseigner `ANTHROPIC_API_KEY` (https://platform.claude.com/)
3. Relancer `npm run dev` — le badge passe à **Live · Claude**

En live :

- **Atlas** (bouton en bas à droite) pose ses questions de cadrage, puis
  propose un plan validable (tâches, agents, estimations, dépendances).
- À la validation, les cartes se créent, les agents partent travailler et
  **produisent de vrais livrables** (markdown : analyses, textes, code…).
- Les dépendances sont respectées : le rédacteur reçoit le livrable du
  chercheur en contexte. Maximum 2 exécutions API en parallèle.
- Cliquer une carte ouvre le détail : consigne, prérequis, **livrable**
  (avec bouton copier).
- Tout est suivi en temps réel : diorama, kanban, flux d'activité, toasts.

Sans clé, l'app tourne en **simulation** complète (zéro coût) : mêmes
écrans, orchestrateur mocké, progression factice.

## Coûts et garde-fous

- Modèle par défaut : `claude-opus-4-8` (`CREWDESK_MODEL` pour changer).
- Les tâches de démonstration ne déclenchent jamais d'appel API ; seules
  les tâches issues d'un plan validé (ou déplacées à la main) s'exécutent.
- Une tâche qui échoue deux fois n'est plus relancée automatiquement.

## Architecture

- Next.js (App Router) + TypeScript strict + Tailwind + Framer Motion + Zustand
- Scène isométrique en DOM/CSS (boucle rAF hors React)
- `src/services/orchestrator.ts` — interface `IOrchestrator` : mock en
  simulation, API Anthropic en live (routes `src/app/api/*`, clé côté
  serveur uniquement — prêt pour un déploiement multi-utilisateurs)
- Données persistées en localStorage (v1 personnelle)

## Captures

```bash
npm run build && npm start &
node scripts/screenshot.cjs   # captures headless dans /tmp/shots
```
