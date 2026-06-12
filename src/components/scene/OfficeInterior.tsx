const SCREEN_ROWS = [
  { y: 0, color: "#72E3F5", width: 54 },
  { y: 8, color: "#DCA35D", width: 42 },
  { y: 16, color: "#3CDFA0", width: 64 },
  { y: 24, color: "#5F93E8", width: 34 },
] as const;

function CodeScreen({ x, y, w = 48, h = 34 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g className="office-svg-screen" transform={`translate(${x} ${y})`}>
      <rect x={0} y={0} width={w} height={h} rx={4} />
      <rect className="office-svg-screen-glass" x={4} y={4} width={w - 8} height={h - 8} rx={2} />
      {SCREEN_ROWS.map((row) => (
        <rect
          key={`${row.y}-${row.color}`}
          className="office-svg-code-line"
          x={8}
          y={8 + row.y}
          width={Math.min(row.width, w - 16)}
          height={2}
          rx={1}
          fill={row.color}
        />
      ))}
      <path d={`M${w / 2 - 3} ${h}h6l3 12h-12z`} className="office-svg-screen-stand" />
    </g>
  );
}

function Plant({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g className="office-svg-plant" transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx={0} cy={14} rx={18} ry={6} className="office-svg-contact" />
      <path d="M-8 8h16l-3 18h-10z" className="office-svg-pot" />
      <ellipse cx={-9} cy={-2} rx={6} ry={18} transform="rotate(-34 -9 -2)" className="office-svg-leaf" />
      <ellipse cx={1} cy={-8} rx={6} ry={20} className="office-svg-leaf office-svg-leaf--alt" />
      <ellipse cx={10} cy={-1} rx={6} ry={17} transform="rotate(34 10 -1)" className="office-svg-leaf" />
    </g>
  );
}

function DeskPod({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  return (
    <g className="office-svg-deskpod" transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <ellipse cx={0} cy={42} rx={68} ry={18} className="office-svg-contact" />
      <polygon points="-62,12 0,-18 62,12 0,46" className="office-svg-desk-side" />
      <polygon points="-62,4 0,-26 62,4 0,38" className="office-svg-desk-top" />
      <CodeScreen x={-34} y={-54} w={52} h={36} />
      <CodeScreen x={20} y={-42} w={32} h={24} />
      <polygon points="-15,8 8,-4 31,8 8,20" className="office-svg-keyboard" />
      <ellipse cx={43} cy={14} rx={8} ry={4} className="office-svg-mouse" />
    </g>
  );
}

/**
 * Décor principal du plateau. Cette couche SVG remplace les petits props CSS
 * dispersés par une composition unique et maîtrisée.
 */
export function OfficeInterior() {
  return (
    <svg className="office-interior" viewBox="0 -118 560 398" aria-hidden="true">
      <defs>
        <linearGradient id="officeWood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D8A46F" />
          <stop offset="55%" stopColor="#B77C46" />
          <stop offset="100%" stopColor="#8C5B34" />
        </linearGradient>
        <linearGradient id="officeWhite" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="58%" stopColor="#E8EEF5" />
          <stop offset="100%" stopColor="#CAD4E1" />
        </linearGradient>
        <linearGradient id="officeGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.76" />
          <stop offset="50%" stopColor="#9FEAFF" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#5F93E8" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="officeScreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B1724" />
          <stop offset="100%" stopColor="#07101A" />
        </linearGradient>
        <filter id="officeSoftShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="12" stdDeviation="8" floodColor="#30405A" floodOpacity="0.2" />
        </filter>
        <filter id="officeCrispShadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="8" stdDeviation="4" floodColor="#30405A" floodOpacity="0.22" />
        </filter>
      </defs>

      <g className="office-zones">
        <polygon points="82,122 198,64 326,128 210,188" className="office-zone office-zone--studio" />
        <polygon points="316,102 438,42 512,80 390,142" className="office-zone office-zone--lab" />
        <polygon points="126,190 238,136 338,186 226,242" className="office-zone office-zone--lounge" />
      </g>

      <g className="office-glass-room" filter="url(#officeCrispShadow)">
        <polygon points="94,36 194,-14 300,38 200,90" className="office-room-floor" />
        <polygon points="94,36 194,-14 194,-82 94,-28" className="office-glass-pane" />
        <polygon points="194,-14 300,38 300,-30 194,-82" className="office-glass-pane office-glass-pane--right" />
        <path d="M144 10v-64M194-14v-68M248 12v-64" className="office-glass-ribs" />
        <path d="M206 -74v58l32 16" className="office-glass-door-line" />
      </g>

      <g className="office-wall-fixtures">
        <g className="office-whiteboard" transform="translate(264 -68)" filter="url(#officeCrispShadow)">
          <rect x={0} y={0} width={116} height={70} rx={8} />
          <rect x={12} y={14} width={68} height={4} rx={2} className="office-whiteboard-line office-whiteboard-line--a" />
          <rect x={12} y={28} width={92} height={4} rx={2} className="office-whiteboard-line office-whiteboard-line--b" />
          <rect x={12} y={42} width={48} height={4} rx={2} className="office-whiteboard-line office-whiteboard-line--c" />
          <circle cx={88} cy={17} r={7} className="office-whiteboard-pin office-whiteboard-pin--one" />
          <circle cx={104} cy={17} r={7} className="office-whiteboard-pin office-whiteboard-pin--two" />
        </g>

        <g className="office-kanban-screen" transform="translate(386 -44)" filter="url(#officeCrispShadow)">
          <rect x={0} y={0} width={112} height={68} rx={9} />
          <rect x={11} y={12} width={25} height={44} rx={4} className="office-kanban-column" />
          <rect x={44} y={12} width={25} height={44} rx={4} className="office-kanban-column office-kanban-column--hot" />
          <rect x={77} y={12} width={25} height={44} rx={4} className="office-kanban-column office-kanban-column--done" />
          <path d="M17 22h13M17 31h9M50 22h12M50 31h15M83 22h10M83 31h13" className="office-kanban-lines" />
        </g>
      </g>

      <g className="office-main-desk" transform="translate(255 105)" filter="url(#officeSoftShadow)">
        <ellipse cx={0} cy={55} rx={92} ry={22} className="office-svg-contact" />
        <polygon points="-86,12 0,-32 86,12 0,58" className="office-main-desk-side" />
        <polygon points="-86,0 0,-44 86,0 0,46" className="office-main-desk-top" />
        <CodeScreen x={-48} y={-82} w={64} h={43} />
        <CodeScreen x={22} y={-68} w={42} h={30} />
        <polygon points="-24,11 3,-2 31,12 3,25" className="office-svg-keyboard" />
        <ellipse cx={48} cy={18} rx={9} ry={5} className="office-svg-mouse" />
        <g className="office-lamp-svg" transform="translate(-63 -20)">
          <path d="M0 48L18 4" />
          <ellipse cx={23} cy={0} rx={18} ry={9} />
          <ellipse cx={0} cy={52} rx={16} ry={6} />
        </g>
      </g>

      <DeskPod x={132} y={100} />
      <DeskPod x={414} y={118} flip />
      <DeskPod x={348} y={198} />

      <g className="office-server" transform="translate(478 150)" filter="url(#officeCrispShadow)">
        <ellipse cx={0} cy={48} rx={28} ry={10} className="office-svg-contact" />
        <rect x={-22} y={-36} width={44} height={78} rx={7} />
        {Array.from({ length: 18 }, (_, i) => (
          <circle
            key={i}
            cx={-12 + (i % 3) * 12}
            cy={-24 + Math.floor(i / 3) * 10}
            r={2.4}
            className={`office-server-led office-server-led--${i % 4}`}
          />
        ))}
        <path d="M-12 30h24M-12 35h24" className="office-server-vents" />
      </g>

      <g className="office-lounge" transform="translate(128 184)" filter="url(#officeCrispShadow)">
        <ellipse cx={0} cy={40} rx={62} ry={16} className="office-svg-contact" />
        <polygon points="-58,10 -18,-11 38,17 -2,39" className="office-sofa-base" />
        <polygon points="-56,-4 -18,-24 38,4 0,25" className="office-sofa-back" />
        <path d="M-27 25L11 5M-1 38L38 17" className="office-sofa-stitch" />
        <polygon points="24,28 55,13 82,27 50,43" className="office-coffee-table" />
      </g>

      <g className="office-gate" transform="translate(394 206)" filter="url(#officeCrispShadow)">
        <ellipse cx={0} cy={22} rx={54} ry={12} className="office-svg-contact" />
        <rect x={-39} y={-34} width={13} height={56} rx={6} />
        <rect x={26} y={-34} width={13} height={56} rx={6} />
        <path d="M-19-10H19" className="office-gate-beam" />
      </g>

      <Plant x={70} y={112} scale={1.15} />
      <Plant x={500} y={92} scale={0.95} />
      <Plant x={204} y={238} scale={0.92} />
      <Plant x={462} y={214} scale={0.82} />
    </svg>
  );
}
