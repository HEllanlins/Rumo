const S = { width: '100%', height: 170, display: 'block', marginBottom: 10 }
export const Kanban = () => (<svg viewBox="0 0 320 170" style={S} className="shot" aria-hidden="true">
  {[0, 1, 2].map(c => <g key={c}><rect x={12 + c * 102} y="12" width="94" height="146" rx="10" fill="var(--ln)" />
    {[0, 1, 2].slice(0, 3 - c % 2).map(r => <rect key={r} x={20 + c * 102} y={24 + r * 42} width="78" height="34" rx="7" fill={r === 0 ? 'var(--ac)' : 'var(--card)'} opacity={r === 0 ? .85 : 1} />)}</g>)}</svg>)
export const Chart = () => (<svg viewBox="0 0 320 170" style={S} className="shot" aria-hidden="true">
  {[40, 70, 55, 95, 120, 105].map((h, i) => <rect key={i} x={24 + i * 46} y={150 - h} width="28" height={h} rx="6" fill="var(--ac)" opacity={.45 + i * .1} />)}
  <polyline points="38,100 84,70 130,84 176,48 222,26 268,38" fill="none" stroke="var(--ac2)" strokeWidth="3" strokeLinecap="round" /></svg>)
export const Timeline = () => (<svg viewBox="0 0 320 170" style={S} className="shot" aria-hidden="true">
  <line x1="40" y1="20" x2="40" y2="150" stroke="var(--ln)" strokeWidth="3" />
  {[0, 1, 2, 3].map(i => <g key={i}><circle cx="40" cy={28 + i * 38} r="8" fill={i === 0 ? 'var(--ac2)' : 'var(--ac)'} /><rect x="64" y={16 + i * 38} width={190 - i * 24} height="12" rx="6" fill="var(--ln)" /><rect x="64" y={32 + i * 38} width="70" height="8" rx="4" fill="var(--ln)" opacity=".6" /></g>)}</svg>)
