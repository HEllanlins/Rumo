import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { sb } from '../supabase'
import { ago, dia, parseRepo, logAct } from '../lib.jsx'

const STATUS = ['não lançado', 'lançado', 'atrasado', 'trocado']
const PSTATUS = ['planejamento', 'em desenvolvimento', 'em revisão', 'pausado', 'concluído', 'entregue', 'cancelado']
const gh = async u => { const r = await fetch(u); if (!r.ok) throw new Error(r.status); return r }

export default function Project() {
  const { id } = useParams()
  const nav = useNavigate()
  const { can } = useApp()
  const [p, setP] = useState(null)
  const [tab, setTab] = useState('prompts')
  const [prompts, setPrompts] = useState([])
  const [ev, setEv] = useState([])
  const [pf, setPf] = useState({ titulo: '', texto: '' })
  const [nota, setNota] = useState('')
  const [info, setInfo] = useState(null)
  const [sync, setSync] = useState(null)
  const [acts, setActs] = useState([])
  const [erro, setErro] = useState('')

  const load = async () => {
    const [a, b, c, d] = await Promise.all([
      sb.from('projects').select('*').eq('id', id).single(),
      sb.from('prompts').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      sb.from('eventos').select('*').eq('project_id', id).order('created_at', { ascending: false }), sb.from('atividades').select('*').eq('project_id', id).order('created_at', { ascending: false }).limit(30)])
    setP(a.data); setPrompts(b.data || []); setEv(c.data || []); setActs(d.data || [])
  }
  useEffect(() => { load() }, [id])
  useEffect(() => { if (p && p.repo && can('git')) git() }, [p?.id, p?.repo])
  if (!p) return <p className="c">Carregando…</p>

  const upd = async patch => {
    if ('repo' in patch) patch.repo = parseRepo(patch.repo)
    await sb.from('projects').update(patch).eq('id', id); setP({ ...p, ...patch })
    if (patch.status) logAct(id, 'status', `"${p.nome}" agora está ${patch.status}`)
    if ('progresso' in patch) logAct(id, 'progresso', `"${p.nome}" atualizado para ${patch.progresso}%`)
  }
  const addPrompt = async e => { e.preventDefault(); await sb.from('prompts').insert({ ...pf, project_id: id }); setPf({ titulo: '', texto: '' }); load() }
  const setSt = async (pid, status) => { await sb.from('prompts').update({ status }).eq('id', pid); load() }
  const addEv = async e => { e.preventDefault(); await sb.from('eventos').insert({ texto: nota, project_id: id }); setNota(''); load() }
  const del = async () => { if (confirm('Excluir este projeto e tudo dentro dele?')) { await sb.from('projects').delete().eq('id', id); nav('/app') } }
  const git = async force => {
    setErro(''); const rp = p.repo, key = 'gh:' + rp, c = JSON.parse(sessionStorage.getItem(key) || 'null')
    if (!force && c && Date.now() - c.t < 300000) { setSync(c.t); return setInfo(c.d) }
    const b = 'https://api.github.com/repos/' + rp
    try {
      const [r, cm, br, pr, rl, one, lg] = await Promise.all([gh(b), gh(b + '/commits?per_page=20'), gh(b + '/branches?per_page=10'), gh(b + '/pulls?state=open&per_page=5'), gh(b + '/releases?per_page=3'), gh(b + '/commits?per_page=1'), gh(b + '/languages')])
      const last = (one.headers.get('Link') || '').match(/page=(\d+)>; rel="last"/)
      const d = { repo: await r.json(), commits: await cm.json(), branches: await br.json(), prs: await pr.json(), rels: await rl.json(), langs: await lg.json(), total: last ? +last[1] : 1 }
      const t = Date.now(); sessionStorage.setItem(key, JSON.stringify({ t, d })); setInfo(d); setSync(t)
      const top = d.commits[0], sha = top && top.sha.slice(0, 7)
      if (top && p.gh?.sha !== sha) {
        await sb.from('projects').update({ gh: { sha, msg: top.commit.message.split('\n')[0], date: top.commit.author.date }, gh_sync: new Date().toISOString() }).eq('id', id)
        if (p.gh) logAct(id, 'commit', `"${p.nome}" recebeu um novo commit: ${sha}`)
      }
    } catch { setInfo(null); setErro('Não foi possível ler o repositório. Confira a URL e se ele é público (o GitHub limita consultas sem login; tente de novo em alguns minutos).') }
  }
  const tabs = [['projects', 'atividade'], ['prompts', 'prompts'], ['progress', 'evolução'], ['history', 'histórico'], ['git', 'Git']].filter(([f]) => can(f))

  return (
    <div className="c">
      <Link to="/app">← Projetos</Link>
      <div className="row sp"><h1 style={{ fontSize: '2rem' }}>{p.nome}</h1><button className="g" onClick={del}>Excluir</button></div>
      <div className="card"><div className="grid">
        <label>Status<select value={p.status} onChange={e => upd({ status: e.target.value })}>{PSTATUS.map(x => <option key={x}>{x}</option>)}</select></label>
        <label>Prioridade<select value={p.prioridade} onChange={e => upd({ prioridade: e.target.value })}>{['baixa', 'média', 'alta'].map(x => <option key={x}>{x}</option>)}</select></label>
        <label>Prazo<input type="date" value={p.prazo || ''} onChange={e => upd({ prazo: e.target.value || null })} /></label>
        <label>URL do projeto<input defaultValue={p.url || ''} onBlur={e => upd({ url: e.target.value })} /></label>
        <label>Cliente<input defaultValue={p.cliente || ''} onBlur={e => upd({ cliente: e.target.value })} /></label>
        <label>Tags (separe por vírgula)<input defaultValue={(p.tags || []).join(', ')} onBlur={e => upd({ tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} /></label>
      </div><small className="mut">Criado em {new Date(p.created_at).toLocaleDateString('pt-BR')} · atualizado em {new Date(p.updated_at || p.created_at).toLocaleDateString('pt-BR')}</small></div>
      <div className="row tabs">{tabs.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>

      {tab === 'prompts' && <>
        <form className="card" onSubmit={addPrompt}>
          <input required placeholder="Título do prompt (ex.: Prompt 12 – tela de login)" value={pf.titulo} onChange={e => setPf({ ...pf, titulo: e.target.value })} />
          <label><textarea rows={4} placeholder="Cole aqui o texto do prompt" value={pf.texto} onChange={e => setPf({ ...pf, texto: e.target.value })} /></label>
          <button>Salvar prompt</button>
        </form>
        {prompts.map(x => (
          <div className="card" key={x.id}>
            <div className="row sp"><b>{x.titulo}</b>
              <select style={{ width: 'auto' }} value={x.status} onChange={e => setSt(x.id, e.target.value)}>{STATUS.map(s => <option key={s}>{s}</option>)}</select></div>
            <pre style={{ whiteSpace: 'pre-wrap', margin: '8px 0 0' }} className="mut">{x.texto}</pre>
            <button className="g" style={{ marginTop: 8 }} onClick={() => navigator.clipboard.writeText(x.texto || '')}>Copiar</button>
          </div>))}
      </>}

      {tab === 'progress' && <div className="card">
        <div className="bar"><i style={{ width: p.progresso + '%' }} /></div>
        <p><b>{p.progresso}%</b> pronto</p>
        <input type="range" min="0" max="100" value={p.progresso} onChange={e => setP({ ...p, progresso: +e.target.value })} onMouseUp={e => upd({ progresso: +e.target.value })} onTouchEnd={e => upd({ progresso: +e.target.value })} />
      </div>}

      {tab === 'history' && <>
        <form className="row card" onSubmit={addEv}><input style={{ flex: 1 }} required placeholder="O que mudou no projeto?" value={nota} onChange={e => setNota(e.target.value)} /><button>Registrar</button></form>
        {ev.map(x => <div className="card" key={x.id}>{x.texto}<br /><small className="mut">{new Date(x.created_at).toLocaleString('pt-BR')}</small></div>)}
      </>}

      {tab === 'projects' && (acts.length ? <div className="tl">{acts.map(a => <div className="tli" key={a.id}><b>{dia(a.created_at)}</b> <span className="mut">→ {a.texto} · {ago(a.created_at)}</span></div>)}</div> : <div className="card mut">Nenhuma atividade ainda. Ela aparece aqui quando você atualizar o projeto ou chegar um novo commit.</div>)}

      {tab === 'git' && <>
        <div className="row card"><input style={{ flex: 1 }} placeholder="https://github.com/usuario/projeto" defaultValue={p.repo ? 'https://github.com/' + p.repo : ''} onBlur={e => upd({ repo: e.target.value })} />
          <button onClick={() => git(true)} disabled={!p.repo}>Sincronizar agora</button></div>
        {sync && <small className="mut">Última sincronização: {ago(sync)}</small>}
        {erro && <p role="alert" className="tag bad">{erro}</p>}
        {p.repo && !info && !erro && <div className="sk" style={{ minHeight: 90 }} />}
        {!p.repo && <div className="card mut">Informe a URL de um repositório público para ver commits, branches e atividade aqui dentro.</div>}
        {info && <>
          <div className="card"><a href={info.repo.html_url} target="_blank" rel="noreferrer"><b>{info.repo.full_name}</b></a>
            <p className="row"><span className="tag">branch principal: {info.repo.default_branch}</span><span className="tag">{info.total} commits</span><span className="tag">{info.branches.length} branches</span><span className="tag">{info.repo.open_issues_count} issues/PRs abertos</span><span className="tag">{info.rels.length} releases</span></p>
            <small className="mut">Linguagens: {Object.keys(info.langs).join(', ') || '—'} · último push {ago(info.repo.pushed_at)}</small></div>
          <h3>Linha do tempo</h3>
          {Object.entries(info.commits.reduce((o, c) => { (o[dia(c.commit.author.date)] ||= []).push(c); return o }, {})).map(([d, cs]) => <div key={d}><h4 className="mut" style={{ margin: '12px 0 0' }}>{d}</h4><div className="tl">{cs.map((c, i) => <div className="tli" key={c.sha}><b>{c.commit.message.split('\n')[0]}</b><br /><small className="mut">{c.commit.author.name} · {new Date(c.commit.author.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · <a href={c.html_url} target="_blank" rel="noreferrer">{c.sha.slice(0, 7)}</a></small></div>)}</div></div>)}
          {info.prs.length > 0 && <><h3>Pull requests abertos</h3>{info.prs.map(x => <div className="card" key={x.id}><a href={x.html_url} target="_blank" rel="noreferrer">#{x.number} {x.title}</a></div>)}</>}
          {info.rels.length > 0 && <><h3>Releases</h3>{info.rels.map(x => <div className="card" key={x.id}>{x.name || x.tag_name}</div>)}</>}
        </>}
      </>}
    </div>
  )
}
