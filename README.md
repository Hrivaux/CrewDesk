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
- À la validation, un **vrai dossier projet** est créé sur ton disque
  (`~/CrewDesk-Projets/<nom-du-projet>/`, configurable via
  `CREWDESK_WORKSPACE`). Les agents y travaillent comme Claude Code :
  ils listent, lisent et **écrivent les fichiers réels** du projet.
  À la fin, le projet est prêt à être lancé (README inclus).
- Les dépendances sont respectées (le rapport du chercheur nourrit le
  rédacteur), un seul agent à la fois par dossier, 2 exécutions API max
  en parallèle.
- Cliquer une carte ouvre le détail : consigne, prérequis, **fichiers
  créés** et rapport de l'agent.
- `CREWDESK_ALLOW_COMMANDS=1` autorise en plus les agents à exécuter
  des commandes dans le dossier (npm install, build…). Désactivé par
  défaut : ils documentent alors les commandes dans le README du projet.
- Les agents ont la **recherche web** (web_search/web_fetch) pour des
  données à jour — coupable via `CREWDESK_WEB_TOOLS=0`.
- **Aperçu intégré** : bouton « ▶ Aperçu » sur la carte projet — le site
  produit s'affiche dans l'app (iframe), rechargeable, ouvrable dans un
  onglet.
- **Retouches** : sur une carte en Revue/Terminé, écris ton retour —
  l'agent reprend ses fichiers et corrige sans repartir de zéro.
- Tout est suivi en temps réel : diorama, kanban, flux d'activité, toasts.

Sans clé, l'app tourne en **simulation** complète (zéro coût) : mêmes
écrans, orchestrateur mocké, progression factice.

## Coûts et garde-fous

- Modèle par défaut : `claude-opus-4-8` (`CREWDESK_MODEL` pour changer).
- Les tâches de démonstration ne déclenchent jamais d'appel API ; seules
  les tâches issues d'un plan validé (ou déplacées à la main) s'exécutent.
- Une tâche qui échoue deux fois n'est plus relancée automatiquement.
- **Budget** : le compteur de la barre suit la consommation réelle ($ et
  tokens). Dès qu'un budget est défini et atteint, **plus aucune nouvelle
  exécution API n'est lancée** — les tâches restent en file jusqu'à
  relèvement du budget.

## Persistance

- État (projets, tâches, skills, budget…) persisté **côté serveur** dans
  `<workspace>/.crewdesk/state-default.json` ; le localStorage sert de
  cache de chargement instantané et de repli hors-ligne.
- Durable (survit à un nettoyage de cache), prêt pour le multi-appareils.
- L'interface `StateStore` (`src/services/server/store.ts`) est la couture
  où une base (Postgres/Supabase, scopée par utilisateur) se branchera le
  jour J — sans toucher au reste de l'application.

## Qualité

```bash
npm run typecheck   # TypeScript strict, zéro any
npm test            # Vitest — logique pure (iso, xp, pricing, slug)
npm run build
```

CI : `.github/workflows/ci.yml` enchaîne typecheck + tests + build à
chaque push.

## Architecture

- Next.js (App Router) + TypeScript strict + Tailwind + Framer Motion + Zustand
- Scène isométrique en DOM/CSS (boucle rAF hors React)
- `src/services/orchestrator.ts` — interface `IOrchestrator` : mock en
  simulation, API Anthropic en live (routes `src/app/api/*`, clé côté
  serveur uniquement — prêt pour un déploiement multi-utilisateurs)
- Persistance derrière `StateStore` (fichier en v1, DB le jour J)

## Captures

```bash
npm run build && npm start &
node scripts/screenshot.cjs   # captures headless dans /tmp/shots
```
