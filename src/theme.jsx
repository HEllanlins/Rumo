import { useEffect, useState } from 'react'
export const PRESETS = {
  'Night Blue': { '--bg': '#0a1020', '--card': '#131c33', '--ink': '#e6ecfb', '--mut': '#93a2c6', '--ac': '#4f7cff', '--ac2': '#7aa2ff' },
  Ocean: { '--bg': '#06202b', '--card': '#0c3140', '--ink': '#e4f6fb', '--mut': '#8dbac9', '--ac': '#06b6d4', '--ac2': '#3b82f6' },
  Emerald: { '--bg': '#07211a', '--card': '#0d3226', '--ink': '#e6faf1', '--mut': '#92c4ad', '--ac': '#10b981', '--ac2': '#34d399' },
  Violet: { '--bg': '#130c24', '--card': '#1f1438', '--ink': '#f1e9ff', '--mut': '#b4a1d8', '--ac': '#8b5cf6', '--ac2': '#c084fc' },
  Graphite: { '--bg': '#16181c', '--card': '#20242a', '--ink': '#e8eaed', '--mut': '#9aa1ab', '--ac': '#8a94a6', '--ac2': '#b0b8c6' },
  Custom: null,
}
export const MODES = {
  Ambiental: { ui: { fx: true, lights: { on: true, int: 0.3, size: 60, anim: false } }, glass: 0.72, r: '14px' },
  Minimalista: { ui: { fx: false, lights: { on: false } }, glass: 0.92, r: '10px' },
  Futurista: { ui: { fx: true, lights: { on: true, int: 0.5, size: 70, anim: true } }, glass: 0.6, r: '18px' },
  Clássico: { ui: { fx: false, lights: { on: false } }, glass: 1, r: '6px' },
}
export const FIELDS = [['--ac', 'Destaque principal e botões'], ['--ac2', 'Destaque secundário'], ['--link', 'Links'], ['--sel', 'Foco e seleção'], ['--bg', 'Fundo'], ['--card', 'Cartões e painéis'], ['--ink', 'Texto principal'], ['--mut', 'Texto secundário']]
export function useGlobalTheme() {
  const [t, setT] = useState(() => localStorage.getItem('tema') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
  useEffect(() => { document.documentElement.dataset.theme = t; localStorage.setItem('tema', t) }, [t])
  return [t, () => setT(t === 'dark' ? 'light' : 'dark')]
}
export function ThemeToggle() {
  const [t, flip] = useGlobalTheme()
  return <button className="g" onClick={flip} aria-label="Alternar tema">{t === 'dark' ? '☀ Claro' : '☾ Escuro'}</button>
}
