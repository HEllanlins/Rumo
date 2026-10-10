import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../App'
import { FEATURES, brl } from '../supabase'
import { ThemeToggle } from '../theme.jsx'
import { Kanban, Chart, Timeline } from '../arte.jsx'
const slots = [['img1', 'Gerenciamento de projetos', Kanban], ['img2', 'Gráficos e progresso', Chart], ['img3', 'Atividade do GitHub', Timeline]]

const recursos = [
  ['▦', 'Gerenciamento de projetos', 'Todos os projetos em um só lugar, cada um com capa, status, prazo e prioridade.'],
  ['◔', 'Acompanhamento', 'Percentual, status e evolução visíveis em cards e no painel geral.'],
  ['⎇', 'GitHub', 'Commits, branches, pull requests e releases de repositórios públicos, sem sair da plataforma.'],
  ['❏', 'Organização', 'Prompts, histórico e anotações do projeto centralizados na mesma pasta.'],
  ['↻', 'Sincronização automática', 'Ao abrir o projeto, os dados do GitHub são atualizados e novos commits viram atividade.'],
  ['⛨', 'Segurança', 'Login com e-mail ou Google; regras no banco isolam os dados de cada usuário.'],
]
const passos = ['Criar projeto', 'Acompanhar desenvolvimento', 'Conectar GitHub', 'Acompanhar progresso', 'Entregar projeto']
export default function Landing() {
  const { plans, session, site } = useApp()
  const raf = useRef()
  const mover = e => {
    if (e.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = e.currentTarget, r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5
    cancelAnimationFrame(raf.current); raf.current = requestAnimationFrame(() => { el.style.setProperty('--rx', x.toFixed(3)); el.style.setProperty('--ry', y.toFixed(3)) })
  }
  useEffect(() => {
    if (site.meta_titulo) document.title = site.meta_titulo
    if (site.meta_desc) { let m = document.querySelector('meta[name=description]'); if (!m) { m = document.createElement('meta'); m.name = 'description'; document.head.appendChild(m) } m.content = site.meta_desc }
  }, [site])
  return (
    <div className="bg" style={{ overflow: 'hidden' }}>
      <div className="nav"><div className="c row sp"><span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}><img src="/favicon.svg" alt="" width="28" height="28" /><b>Rumo</b></span>
        <div className="row"><ThemeToggle /><Link to={session ? '/app' : '/entrar'} className="btn g">Acesso</Link></div></div></div>
      <div className="c">
        <section className="hero2 fade" style={{ position: 'relative' }} onPointerMove={mover}>
          <i className="orb" style={{ width: 280, height: 280, left: -60, top: 20, background: 'var(--ac)' }} aria-hidden="true" /><i className="orb" style={{ width: 240, height: 240, right: -40, top: 120, background: 'var(--ac2)', animationDelay: '-4s' }} aria-hidden="true" />
          <h1>{site.txt_titulo || 'Seus projetos, prompts e commits. Sempre no rumo certo.'}</h1>
          <p className="mut">{site.txt_sub || 'Pare de se perder quando volta a um projeto. Veja onde parou, o que mudou e quanto falta, em um app que você instala no celular.'}</p>
          <div className="row" style={{ justifyContent: 'center' }}><Link to="/entrar" className="btn">{site.txt_cta || 'Começar agora'}</Link><a href="#como" className="btn g">Como funciona</a></div>
          <div className="card mock" aria-hidden="true" style={{ textAlign: 'left' }}>
            <div className="row" style={{ gap: 6 }}><i className="tag" /><i className="tag" /><i className="tag" /></div>
            <div className="grid" style={{ marginTop: 12 }}>{[['Ativos', 4], ['Concluídos', 2], ['Progresso médio', '63%']].map(([t, v]) => <div className="card" key={t}><span className="mut">{t}</span><div className="stat">{v}</div></div>)}</div>
            <div className="bar" style={{ marginTop: 16 }}><i style={{ width: '63%' }} /></div>
          </div>
          <div className="card fl float" style={{ left: 0, top: 150 }} aria-hidden="true">⎇ a82f91c · Atualização do dashboard</div>
          <div className="card fl float d2" style={{ right: 0, top: 110 }} aria-hidden="true">Projeto atualizado para 75%</div>
          <div className="card fl float d3" style={{ right: 40, top: 300 }} aria-hidden="true">Prompt 14 · lançado</div>
        </section>
        <section className="sec"><div className="grid">
          <div className="card"><h2>O que é</h2><p className="mut">O Rumo é um painel para organizar projetos de software: prompts, progresso, histórico e atividade do GitHub, tudo junto.</p></div>
          <div className="card"><h2>Para quem é</h2><p className="mut">Freelancers, desenvolvedores independentes, estudantes e quem constrói apps com ajuda de IA e muitos prompts.</p></div>
          <div className="card"><h2>Por que usar</h2><p className="mut">Você volta ao projeto depois de dias e sabe onde parou, sem bagunçar o que já funciona.</p></div></div></section>
        <section className="sec"><h2>Recursos</h2>
          <div className="grid">{recursos.map(([i, t, d]) => <div className="card" key={t}><span className="ic" aria-hidden="true">{i}</span><b>{t}</b><p className="mut">{d}</p></div>)}</div></section>
        <section className="sec"><h2>Veja por dentro</h2>
          <div className="grid">{slots.map(([k, t, Art]) => <div className="card" key={k}>{site[k] ? <img className="shot" src={site[k]} alt={t} loading="lazy" onError={e => { e.currentTarget.style.display = 'none' }} /> : <Art />}<b>{t}</b></div>)}</div></section>
        <section id="como" className="sec"><h2>Como funciona</h2>
          <div className="grid steps">{passos.map(p => <div className="card" key={p}><b>{p}</b></div>)}</div></section>
        <section id="planos" className="sec"><h2>Planos</h2>
          <div className="grid">{plans.map(p => (
            <div className="card" key={p.id}><b>{p.nome}</b>
              <h3 style={{ margin: '6px 0' }}>{brl(p.preco)}<small className="mut">/mês</small></h3>
              <ul>{p.features.map(f => <li key={f}>{FEATURES[f] || f}</li>)}</ul>
              <Link className="btn" to={`/entrar?plano=${p.id}`}>Assinar {p.nome}</Link></div>))}</div></section>
        <section className="sec card" style={{ textAlign: 'center', padding: 36 }}><h2>Comece a organizar seus projetos</h2><Link className="btn" to="/entrar">Criar conta</Link></section>
      </div>
      <footer className="mut">{site.txt_rodape || 'Rumo'} · <Link to="/restrita">Área restrita</Link></footer>
    </div>)
}
