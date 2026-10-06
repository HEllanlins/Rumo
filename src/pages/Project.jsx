import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { sb } from '../supabase'

const STATUS = ['não lançado', 'lançado', 'atrasado', 'trocado']

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
  const [commits, setCommits] = useState(null)
  const [erro, setErro] = useState('')

  const load = async () => {
    const [a, b, c] = await Promise.all([
      sb.from('projects').select('*').eq('id', id).single(),
      sb.from('prompts').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      sb.from('eventos').select('*').eq('project_id', id).order('created_at', { ascending: false })])
    setP(a.data); setPrompts(b.data || []); setEv(c.data || [])
  }
  useEffect(() => { load() }, [id])
  if (!p) return <p className="c">Carregando…</p>

  const upd = async patch => { await sb.from('projects').update(patch).eq('id', id); setP({ ...p, ...patch }) }
  const addPrompt = async e => { e.preventDefault(); await sb.from('prompts').insert({ ...pf, project_id: id }); setPf({ titulo: '', texto: '' }); load() }
  const setSt = async (pid, status) => { await sb.from('prompts').update({ status }).eq('id', pid); load() }
  const addEv = async e => { e.preventDefault(); await sb.from('eventos').insert({ texto: nota, project_id: id }); setNota(''); load() }
  const del = async () => { if (confirm('Excluir este projeto e tudo dentro dele?')) { await sb.from('projects').delete().eq('id', id); nav('/app') } }
  const git = async () => {
    setErro(''); setCommits(null)
    const r = await fetch(`https://api.github.com/repos/${p.repo}/commits?per_page=30`)
    if (!r.ok) return setErro('Repositório não encontrado ou privado. Use o formato dono/repositorio, em repositório público.')
    setCommits(await r.json())
  }
  const tabs = [['prompts', 'prompts'], ['progress', 'evolução'], ['history', 'histórico'], ['git', 'Git']].filter(([f]) => can(f))

  return (
    <div className="c">
      <Link to="/app">← Projetos</Link>
      <div className="row sp"><h1 style={{ fontSize: '2rem' }}>{p.nome}</h1><button className="g" onClick={del}>Excluir</button></div>
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

      {tab === 'git' && <>
        <div className="row card"><input style={{ flex: 1 }} placeholder="dono/repositorio (ex.: hellan/meu-projeto)" defaultValue={p.repo || ''} onBlur={e => upd({ repo: e.target.value.trim() })} />
          <button onClick={git} disabled={!p.repo}>Ver commits</button></div>
        {erro && <p>{erro}</p>}
        {commits?.map(c => <div className="card" key={c.sha}><b>{c.commit.message.split('\n')[0]}</b><br /><small className="mut">{c.commit.author.name} · {new Date(c.commit.author.date).toLocaleString('pt-BR')} · <a href={c.html_url} target="_blank" rel="noreferrer">{c.sha.slice(0, 7)}</a></small></div>)}
      </>}
    </div>
  )
}
