import { sb } from './supabase'
export const ago = d => { if (!d) return '—'; const s = (Date.now() - new Date(d)) / 1000; if (s < 60) return 'agora'; if (s < 3600) return `há ${Math.floor(s / 60)} min`; if (s < 86400) return `há ${Math.floor(s / 3600)} h`; return `há ${Math.floor(s / 86400)} d` }
export const dia = d => { const n = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 864e5); return n <= 0 ? 'Hoje' : n === 1 ? 'Ontem' : `${n} dias atrás` }
export const parseRepo = s => { const m = (s || '').trim().match(/(?:github\.com\/)?([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[\/#?].*)?$/); return m ? `${m[1]}/${m[2]}` : null }
export const logAct = (project_id, tipo, texto) => sb.from('atividades').insert({ project_id, tipo, texto })
export function Cover({ p, h = 110 }) {
  if (p.capa) return <img src={p.capa} alt="" loading="lazy" style={{ width: '100%', height: h, objectFit: 'cover', borderRadius: 10, display: 'block' }} />
  let n = 0; for (const c of p.nome) n = (n * 31 + c.charCodeAt(0)) % 360
  return (<svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: h, borderRadius: 10, display: 'block' }} aria-hidden="true">
    <defs><linearGradient id={'g' + p.id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={`hsl(${n} 80% 55%)`} /><stop offset="1" stopColor={`hsl(${(n + 60) % 360} 80% 45%)`} /></linearGradient></defs>
    <rect width="200" height="110" fill={`url(#g${p.id})`} /><circle cx={40 + n % 120} cy="30" r="46" fill="#fff" opacity=".14" /><rect x={100 - n % 60} y="55" width="90" height="90" rx="22" fill="#fff" opacity=".1" transform={`rotate(${n % 40} 150 80)`} /></svg>)
}
