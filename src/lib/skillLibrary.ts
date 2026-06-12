import type { AgentId } from "@/services/types";

/**
 * Bibliothèque de skills prêts à l'emploi, par agent.
 * Installés en un clic dans l'entraînement, puis librement modifiables.
 */

export interface LibrarySkill {
  name: string;
  description: string;
  content: string;
}

export const SKILL_LIBRARY: Record<AgentId, LibrarySkill[]> = {
  atlas: [
    {
      name: "Plans orientés résultat",
      description: "Pour des plans plus actionnables",
      content: `## Méthode de planification
- Découpe en tâches de 20 à 45 minutes maximum : une tâche = un livrable vérifiable.
- Toujours commencer par une tâche de cadrage/recherche si le sujet a un marché ou un public (Sonar).
- Le design (Pixel) précède l'intégration (Forge) ; le contenu (Plume) peut être parallèle au design.
- Chaque description de tâche doit contenir : le livrable attendu, les fichiers à produire, les contraintes, et ce que la tâche suivante en fera.
- Termine toujours par une tâche de finalisation : cohérence, README, instructions de lancement testées.`,
    },
    {
      name: "Sites statiques d'abord",
      description: "Stack par défaut des projets web",
      content: `## Stack par défaut pour les projets web
- HTML/CSS/JS statique, sans framework ni étape de build, sauf demande explicite contraire.
- Structure imposée : index.html à la racine, css/, js/, assets/, docs/.
- Pas de CDN obligatoires : le site doit s'ouvrir hors-ligne en double-cliquant index.html.
- Responsive mobile-first, une seule feuille de style principale.
- Si l'utilisateur demande une app complexe, propose d'abord la version statique et mentionne l'alternative dans le plan.`,
    },
  ],
  pixel: [
    {
      name: "Design premium par défaut",
      description: "Anti-design générique",
      content: `## Standards visuels
- Jamais de design générique : pas de dégradés violets sur fond blanc, pas de Inter/Roboto par défaut, pas de sections interchangeables.
- Choisis une direction artistique assumée par projet : palette précise (5 couleurs max, codes hex), une typo display + une typo texte, et tiens-la partout.
- Hiérarchie claire : un seul message principal par écran, espaces généreux (sections aérées, marges ≥ 80px desktop).
- Micro-détails qui font premium : transitions douces (150-250ms), états hover travaillés, ombres subtiles cohérentes, coins arrondis constants.
- Toujours définir la DA dans docs/direction-artistique.md avant de produire les maquettes.`,
    },
    {
      name: "Accessibilité AA",
      description: "À appliquer sur tout livrable UI",
      content: `## Règles d'accessibilité
- Contrastes AA minimum : 4.5:1 pour le texte courant, 3:1 pour les grands titres.
- Tout élément interactif : focus visible, zone de clic ≥ 44px, libellé explicite (pas de « cliquez ici »).
- Images : alt descriptif ou alt="" si décorative. Icônes seules : aria-label.
- Navigation possible entièrement au clavier ; ordre de tabulation logique.
- Respecter prefers-reduced-motion : couper les animations décoratives.`,
    },
    {
      name: "Landing qui convertit",
      description: "Pour les pages d'atterrissage",
      content: `## Structure d'une landing efficace
1. Hero : promesse en une phrase (bénéfice, pas fonctionnalité) + CTA unique au-dessus de la ligne de flottaison.
2. Preuve sociale tôt (logos, chiffres, témoignages).
3. 3 bénéfices max, chacun illustré — pas de liste de fonctionnalités exhaustive.
4. Objections traitées (FAQ courte, garanties).
5. CTA répété : même verbe d'action partout, contraste maximal.
- Un seul objectif de conversion par page ; tout ce qui n'y contribue pas dégage.`,
    },
  ],
  forge: [
    {
      name: "Code propre et lançable",
      description: "Standards de production",
      content: `## Standards de code
- Le projet doit se lancer immédiatement : aucun import cassé, aucun chemin absolu, aucune dépendance non documentée.
- HTML sémantique (header/main/section/footer), CSS en variables custom properties pour la palette, JS en modules ES sans variables globales.
- Nommage cohérent : kebab-case pour fichiers et classes CSS, camelCase pour le JS.
- Commentaires uniquement quand le code ne peut pas se l'expliquer ; pas de code mort ni de TODO.
- Avant de terminer : relis chaque fichier référencé (liens, src, href) et vérifie qu'il existe.`,
    },
    {
      name: "SEO technique",
      description: "Pour tout site public",
      content: `## Checklist SEO de base
- <title> unique et descriptif (< 60 caractères), meta description (< 155).
- Open Graph : og:title, og:description, og:image.
- Un seul h1 par page, hiérarchie h2/h3 logique.
- Images : attributs width/height, loading="lazy" sous la ligne de flottaison.
- HTML valide, liens internes en chemins relatifs, page 404 si multi-pages.`,
    },
    {
      name: "Performance d'abord",
      description: "Budget de poids strict",
      content: `## Budget performance
- Page < 500 Ko tout compris ; pas de librairie JS si le vanilla suffit (un carrousel = 30 lignes, pas une lib).
- CSS critique inline si < 10 Ko, sinon une seule feuille.
- Polices : 2 familles max, woff2, font-display: swap — ou polices système.
- Pas d'images décoratives lourdes : SVG ou CSS quand c'est possible.
- Animations en transform/opacity uniquement.`,
    },
  ],
  sonar: [
    {
      name: "Analyse concurrentielle structurée",
      description: "Format des benchmarks",
      content: `## Format d'analyse concurrentielle
Pour chaque concurrent : positionnement en une phrase, cible, pricing, 2 forces, 2 faiblesses, ce qu'on lui pique.
- Toujours un tableau comparatif final + 3 recommandations actionnables classées par impact.
- Sources citées en fin de document (URL + date de consultation) ; utilise la recherche web pour des données actuelles, jamais de chiffres inventés.
- Si une donnée est introuvable, dis-le explicitement plutôt que d'estimer.
- Conclusion orientée décision : « ce que ça change pour notre projet ».`,
    },
    {
      name: "Personas express",
      description: "Cadrage d'audience",
      content: `## Méthode personas
- 2 à 3 personas maximum, chacun : prénom, contexte en 2 lignes, problème principal, déclencheur d'achat, objection n°1, canal où le toucher.
- Basés sur des signaux réels (recherche web : forums, avis, études) — citer les sources.
- Terminer par les implications concrètes : ton à adopter, arguments à mettre en avant, ce qu'il faut éviter.`,
    },
  ],
  plume: [
    {
      name: "Ton naturel, zéro jargon IA",
      description: "Style d'écriture par défaut",
      content: `## Règles d'écriture
- Bannis : « plonger dans », « élever votre », « dans un monde où », « révolutionner », « libérer le potentiel », les tirets cadratins à répétition, les triades systématiques.
- Phrases courtes. Une idée par phrase. Voix active.
- Concret avant abstrait : un chiffre, un exemple, une situation — pas des généralités.
- Parle au lecteur (« vous » ou « tu », cohérent sur tout le projet) de son problème, pas de « nous » et nos qualités.
- Relis à voix haute mentalement : si une phrase ne se dit pas naturellement, réécris-la.`,
    },
    {
      name: "Copywriting AIDA",
      description: "Pour les pages de vente et emails",
      content: `## Structure AIDA
- Attention : ouvre sur le problème du lecteur ou un fait surprenant, jamais sur l'entreprise.
- Intérêt : développe le coût du statu quo, avec du concret.
- Désir : la solution en bénéfices (gain de temps, d'argent, de statut), preuves à l'appui.
- Action : un seul CTA, verbe d'action, urgence honnête (pas de fausse rareté).
- Titres : 6-10 mots, bénéfice ou curiosité, jamais de jeu de mots obscur.`,
    },
    {
      name: "Posts LinkedIn qui vendent un SaaS",
      description: "Pour le contenu réseaux orienté acquisition",
      content: `## Posts LinkedIn pour vendre un SaaS
- 1re ligne = tout : une accroche qui arrête le scroll (problème vécu, résultat chiffré, opinion tranchée). Pas de « Je suis ravi de… ».
- Format : phrases courtes, beaucoup de retours à la ligne, 800-1300 caractères, lisible au pouce.
- 1 idée par post rattachée à un pilier (éduquer / prouver / coulisses / social proof / offre).
- Vends le résultat, pas la fonctionnalité : « passe de X à Y », pas « notre outil fait Z ».
- CTA doux et varié : question en fin de post, « DM si… », lien en commentaire (jamais en plein post).
- Preuves concrètes : chiffres, captures décrites, témoignages, avant/après.
- Bannir le jargon corporate et les hashtags en pagaille (3 max, pertinents).`,
    },
    {
      name: "Hooks X/Twitter",
      description: "Accroches et threads pour l'acquisition",
      content: `## Tweets & threads
- Le 1er tweet doit pouvoir vivre seul : promesse claire ou tension. Si on n'a pas envie de lire la suite, réécris.
- Une idée par tweet, ligne courte, pas de remplissage.
- Threads : 5-7 tweets, 1 idée chacun, le dernier récapitule + CTA.
- Modèles d'accroche : « J'ai [résultat] en [temps]. Voici comment : », « La plupart des [cible] font [erreur]. Fais ça à la place : », « [Chiffre] leçons après [expérience] ».
- Montre, ne te vante pas : exemples, captures décrites, mini études de cas.`,
    },
  ],
  vega: [
    {
      name: "Plan de lancement type",
      description: "Structure des plans marketing",
      content: `## Plan de lancement
- 3 phases : avant (teasing, liste d'attente), jour J (annonces coordonnées), après (relances, social proof).
- Chaque action : canal, date relative (J-7, J0, J+3), responsable, message clé, métrique de succès.
- Prioriser 2 canaux maîtrisés plutôt que 6 survolés ; justifier le choix selon la cible.
- Toujours inclure : 3 variantes de message court (réseau social), 1 email d'annonce, 1 relance.
- Livrer en tableau markdown chronologique dans docs/plan-lancement.md.`,
    },
    {
      name: "Calendrier éditorial",
      description: "Pour le contenu récurrent",
      content: `## Calendrier éditorial
- 4 semaines, 2-3 contenus/semaine max (tenable > ambitieux).
- Chaque entrée : date, canal, format, angle, accroche proposée, CTA.
- Alterner les intentions : éduquer / prouver / convertir (ratio 3-2-1).
- Recycler : 1 contenu pilier → 3 déclinaisons courtes.
- Inclure une colonne « indicateur à suivre » par contenu.`,
    },
    {
      name: "Piliers de contenu SaaS",
      description: "Stratégie de contenu pour vendre un SaaS",
      content: `## Piliers de contenu pour vendre un SaaS
- 5 piliers à alterner : Éduquer (résoudre un problème de la cible), Prouver (résultats, chiffres, études de cas), Coulisses (build in public, roadmap), Social proof (témoignages, avis), Offre (essai, démo, promo) — ratio conseillé 2-1-1-0,5-0,5 par semaine.
- Chaque post part d'une douleur précise de l'acheteur, pas d'une fonctionnalité.
- Toujours un seul objectif par post (notoriété OU clic OU inscription) et une métrique associée.
- Construire une routine d'engagement (commenter d'autres comptes de la niche) en plus de la publication.
- Réutiliser : un contenu pilier (article, étude) se décline en 5-8 posts courts.`,
    },
  ],
};
