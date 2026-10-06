import { useEffect, useState } from 'react'
export const PRESETS = {
  Padrão: {}, Ocean: { '--ac': '#0ea5e9', '--ac2': '#14b8a6', '--bg': '#07202b', '--card': '#0d2f3f', '--ink': '#e6f6fb', '--mut': '#8fb8c7' },
  Purple: { '--ac': '#a855f7', '--ac2': '#ec4899', '--bg': '#150d24', '--card': '#21153a', '--ink': '#f3e8ff', '--mut': '#b9a3d6' },
  Emerald: { '--ac': '#10b981', '--ac2': '#84cc16', '--bg': '#07231a', '--card': '#0c3325', '--ink': '#e7fbf1', '--mut': '#93c5ad' },
  Sunset: { '--ac': '#f97316', '--ac2': '#e11d48', '--bg': '#fff4ec', '--card': '#ffffff', '--ink': '#3b1d12', '--mut': '#8a5a46' },
  Midnight: { '--ac': '#6366f1', '--ac2': '#38bdf8', '--bg': '#05070f', '--card': '#0e1324', '--ink': '#e5e7f5', '--mut': '#8b93b0' },
}
export const FIELDS = [['--ac', 'Cor principal'], ['--ac2', 'Cor secundária'], ['--bg', 'Fundo'], ['--card', 'Cards'], ['--ink', 'Texto'], ['--mut', 'Texto secundário']]
export function useGlobalTheme() {
  const [t, setT] = useState(() => localStorage.getItem('tema') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
  useEffect(() => { document.documentElement.dataset.theme = t; localStorage.setItem('tema', t) }, [t])
  return [t, () => setT(t === 'dark' ? 'light' : 'dark')]
}
export function ThemeToggle() {
  const [t, flip] = useGlobalTheme()
  return <button className="g" onClick={flip} aria-label="Alternar tema">{t === 'dark' ? '☀ Claro' : '☾ Escuro'}</button>
}
