export default function Splash({ p, erro }) {
  const C = 2 * Math.PI * 54
  return (
    <div className="splash" role="status" aria-live="polite">
      <div className="sp-glow" aria-hidden="true" />
      <div className="sp-ring"><svg viewBox="0 0 120 120" width="160" height="160" aria-hidden="true"><defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4f6bff" /><stop offset="1" stopColor="#a78bfa" /></linearGradient></defs>
        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="3" />
        <circle cx="60" cy="60" r="54" fill="none" stroke="url(#sg)" strokeWidth="3" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - p)} transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset .4s' }} />
        <circle className="rot" cx="60" cy="60" r="59" fill="none" stroke="url(#sg)" strokeWidth="1.5" strokeDasharray="30 340" strokeLinecap="round" /></svg>
        <img src="/favicon.svg" alt="Rumo" width="68" height="68" /></div>
      {erro ? <><p>Não foi possível carregar tudo. Verifique a conexão.</p><button onClick={() => location.reload()}>Tentar novamente</button></> : <small>{Math.round(p * 100)}%</small>}
    </div>)
}
