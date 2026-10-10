import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../App'
import { sb, FEATURES } from '../supabase'
import ImgPicker from '../Imagem.jsx'
import { ago, toast } from '../lib.jsx'
import { LABEL, NEXT, ACAO } from '../solic.js'

const TXT = [['txt_titulo', 'Título principal da landing', 140], ['txt_sub', 'Subtítulo da landing', 300], ['txt_cta', 'Texto do botão principal', 40], ['txt_rodape', 'Texto do rodapé', 80], ['meta_titulo', 'Título da página (SEO)', 70], ['meta_desc', 'Descrição da página (SEO)', 160]]
const SLOTS = [['img1', 'Gerenciamento de projetos'], ['img2', 'Gráficos e progresso'], ['img3', 'Atividade do GitHub']]
const TABS = [['geral', 'Visão geral'], ['users', 'Usuários'], ['solic', 'Solicitações'], ['planos', 'Planos'], ['conteudo', 'Textos'], ['imagens', 'Imagens'], ['analytics', 'Analytics'], ['audit', 'Auditoria']]

function Geral() {
  const [s, setS] = useState(null); const [err, setErr] = useState('')
  useEffect(() => { sb.rpc('admin_stats').then(({ data, error }) => error ? setErr('Rode a migracao-5.sql no Supabase. ' + error.message) : setS(data)) }, [])
  if (err) return <p role="alert" className="tag bad">{err}</p>
  if (!s) return <div className="grid"><div className="sk" /><div className="sk" /><div className="sk" /></div>
  const k = [['Usuários', s.usuarios], ['Assinaturas ativas', s.ativos], ['Pendentes', s.pendentes], ['Novos (7 dias)', s.novos7d], ['Projetos', s.projetos], ['Prompts', s.prompts], ['Solicitações abertas', s.solicitacoes_abertas]]
  return <><div className="grid">{k.map(([t, v]) => <div className="card kpi" key={t}><span className="mut">{t}</span><div className="stat">{v}</div></div>)}</div>
    <p className="row">{Object.entries(s.por_plano || {}).map(([k, n]) => <span className="tag" key={k}>{k}: {n}</span>)}</p>
    <p className="mut">Os números de projetos e prompts são totais. O painel não exibe o conteúdo privado dos clientes.</p></>
}
function Users({ plans }) {
  const [u, setU] = useState([]); const [q, setQ] = useState('')
  const load = async () => { const { data } = await sb.from('profiles').select('*').order('created_at', { ascending: false }); setU(data || []) }
  useEffect(() => { load() }, [])
  const up = async (id, patch) => { if (patch.status === 'cancelada' && !confirm('Desativar esta conta?')) return; const { error } = await sb.from('profiles').update(patch).eq('id', id); toast(error ? error.message : 'Atualizado'); load() }
  const aviso = x => `mailto:${x.email}?subject=${encodeURIComponent('Sua assinatura está para vencer')}&body=${encodeURIComponent('Olá! Sua assinatura vence em ' + (x.vencimento || 'breve') + '. Regularize para manter o acesso.')}`
  const lista = u.filter(x => (x.email + ' ' + (x.nome || '')).toLowerCase().includes(q.toLowerCase()))
  return <><input placeholder="Buscar por nome ou e-mail" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 320, marginBottom: 10 }} />
    <div style={{ overflowX: 'auto' }}><table><thead><tr><th>Usuário</th><th>Plano</th><th>Status</th><th>Vencimento</th><th>Cadastro</th><th /></tr></thead><tbody>{lista.map(x => (
      <tr key={x.id}><td>{x.nome || '—'}<br /><small className="mut">{x.email}</small>{x.role === 'admin' && <span className="tag ok"> admin</span>}</td>
        <td><select value={x.plan_id || ''} disabled={x.role === 'admin'} onChange={e => up(x.id, { plan_id: e.target.value || null })}><option value="">—</option>{plans.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></td>
        <td><select value={x.status} disabled={x.role === 'admin'} onChange={e => up(x.id, { status: e.target.value })}>{['pendente', 'ativa', 'atrasada', 'cancelada'].map(s => <option key={s}>{s}</option>)}</select></td>
        <td><input type="date" value={x.vencimento || ''} onChange={e => up(x.id, { vencimento: e.target.value || null })} /></td>
        <td><small className="mut">{ago(x.created_at)}</small></td>
        <td>{x.role !== 'admin' && <a href={aviso(x)} className="tag">Avisar por e-mail</a>}</td></tr>))}</tbody></table></div></>
}
function Planos({ plans, reload }) {
  const set = async (id, patch) => { const { error } = await sb.from('plans').update(patch).eq('id', id); toast(error ? error.message : 'Plano atualizado'); reload() }
  const tog = (p, f) => set(p.id, { features: p.features.includes(f) ? p.features.filter(x => x !== f) : [...p.features, f] })
  return <div className="grid">{plans.map(p => <div className="card" key={p.id}><b>{p.nome}</b>
    <label>Descrição<textarea rows={2} defaultValue={p.descricao || ''} onBlur={e => set(p.id, { descricao: e.target.value })} /></label>
    <label>Valor (R$)<input type="number" min="0" step="0.01" defaultValue={p.preco} onBlur={e => set(p.id, { preco: +e.target.value })} /></label>
    {Object.entries(FEATURES).map(([f, l]) => <label key={f}><input type="checkbox" checked={p.features.includes(f)} onChange={() => tog(p, f)} /> {l}</label>)}</div>)}</div>
}
function Conteudo({ site, reload }) {
  const [d, setD] = useState({ ...site })
  const save = async () => {
    const rows = TXT.filter(([k]) => (d[k] || '').trim()).map(([k, , max]) => ({ key: k, value: d[k].trim().slice(0, max) }))
    const vazios = TXT.map(([k]) => k).filter(k => !(d[k] || '').trim())
    const a = await sb.from('site_config').upsert(rows); if (vazios.length) await sb.from('site_config').delete().in('key', vazios)
    toast(a.error ? a.error.message : 'Textos publicados'); reload()
  }
  return <><p className="mut">Os textos são salvos no banco e exibidos como texto puro (HTML é ignorado). Deixe vazio para voltar ao texto padrão.</p>
    <div className="grid"><div>{TXT.map(([k, l, max]) => <label key={k}>{l} <small>({(d[k] || '').length}/{max})</small>
      {max > 100 ? <textarea rows={2} maxLength={max} value={d[k] || ''} onChange={e => setD({ ...d, [k]: e.target.value })} /> : <input maxLength={max} value={d[k] || ''} onChange={e => setD({ ...d, [k]: e.target.value })} />}</label>)}
      <button onClick={save}>Publicar textos</button></div>
      <div className="card"><small className="mut">Pré-visualização</small><h2 style={{ marginTop: 6 }}>{d.txt_titulo || 'Seus projetos, prompts e commits. Sempre no rumo certo.'}</h2>
        <p className="mut">{d.txt_sub || 'Subtítulo padrão da landing.'}</p><span className="btn">{d.txt_cta || 'Começar agora'}</span><p className="mut">{d.txt_rodape || 'Rumo'}</p></div></div></>
}
function Imagens({ site, reload }) {
  const setImg = async (k, v) => { const r = v ? await sb.from('site_config').upsert({ key: k, value: v }) : await sb.from('site_config').delete().eq('key', k); toast(r.error ? r.error.message : 'Imagem atualizada'); reload() }
  return <div className="grid">{SLOTS.map(([k, t]) => <div className="card" key={k}><b>{t}</b><br /><small className="mut">Usada na seção "Veja por dentro" da landing</small>
    {site[k] && <img src={site[k]} alt="" className="shot" style={{ marginTop: 8 }} />}
    <ImgPicker pasta="site" onChange={url => setImg(k, url)}><button className="g" onClick={() => setImg(k, null)}>Voltar à imagem padrão</button></ImgPicker></div>)}</div>
}
function Analytics() {
  const [dias, setDias] = useState(30); const [r, setR] = useState(null)
  useEffect(() => {
    setR(null); const ini = new Date(Date.now() - dias * 864e5).toISOString(), ant = new Date(Date.now() - 2 * dias * 864e5).toISOString()
    Promise.all([sb.from('pageviews').select('path,ref,device,sid,created_at').gte('created_at', ini).order('created_at', { ascending: false }).limit(10000),
      sb.from('pageviews').select('id', { count: 'exact', head: true }).gte('created_at', ant).lt('created_at', ini)]).then(([a, b]) => setR({ rows: a.data || [], err: a.error, prev: b.count || 0 }))
  }, [dias])
  if (!r) return <div className="sk" />
  if (r.err) return <p role="alert" className="tag bad">Rode a migracao-5.sql no Supabase. {r.err.message}</p>
  const cnt = f => Object.entries(r.rows.reduce((o, x) => { const k = f(x); if (k) o[k] = (o[k] || 0) + 1; return o }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const porDia = Array.from({ length: Math.min(dias, 30) }, (_, i) => { const d = new Date(Date.now() - (Math.min(dias, 30) - 1 - i) * 864e5).toISOString().slice(0, 10); return [d, r.rows.filter(x => x.created_at.slice(0, 10) === d).length] })
  const max = Math.max(1, ...porDia.map(x => x[1])), sess = new Set(r.rows.map(x => x.sid)).size
  const delta = r.prev ? Math.round((r.rows.length - r.prev) / r.prev * 100) : null
  return <><div className="row">{[7, 30, 90].map(n => <button key={n} className={'g' + (dias === n ? ' on' : '')} onClick={() => setDias(n)}>{n} dias</button>)}</div>
    <div className="grid" style={{ margin: '12px 0' }}><div className="card"><span className="mut">Visualizações</span><div className="stat">{r.rows.length}</div><small className="mut">{delta === null ? 'sem período anterior para comparar' : `${delta >= 0 ? '+' : ''}${delta}% vs. período anterior`}</small></div>
      <div className="card"><span className="mut">Sessões (aproximado)</span><div className="stat">{sess}</div><small className="mut">Uma sessão por aba/navegador; não é visitante único.</small></div></div>
    <div className="card"><b>Visualizações por dia</b><div className="row" style={{ alignItems: 'flex-end', gap: 3, height: 120, flexWrap: 'nowrap', marginTop: 10 }}>{porDia.map(([d, n]) => <div key={d} title={`${d}: ${n}`} style={{ flex: 1, height: (n / max * 100) + '%', minHeight: 2, background: 'linear-gradient(var(--ac),var(--ac2))', borderRadius: 3 }} />)}</div></div>
    <div className="grid" style={{ marginTop: 12 }}>{[['Páginas mais acessadas', cnt(x => x.path)], ['Dispositivos', cnt(x => x.device)], ['Origem do tráfego', cnt(x => x.ref)]].map(([t, l]) => <div className="card" key={t}><b>{t}</b>{l.length ? l.map(([k, n]) => <div className="row sp" key={k}><span>{k}</span><span className="tag">{n}</span></div>) : <p className="mut">Sem dados ainda.</p>}</div>)}</div>
    <p className="mut">Coleta mínima: caminho da página, tipo de dispositivo e site de origem. Sem IP, sem cookies e sem dados pessoais. Respeita "Não rastrear" do navegador.</p></>
}
function Audit() {
  const [l, setL] = useState(null)
  useEffect(() => { sb.from('audit_log').select('*').order('created_at', { ascending: false }).limit(50).then(({ data }) => setL(data || [])) }, [])
  if (!l) return <div className="sk" />
  return !l.length ? <div className="card mut">Nenhuma ação registrada ainda.</div> : <div style={{ overflowX: 'auto' }}><table><thead><tr><th>Quando</th><th>Ação</th><th>Alvo</th></tr></thead><tbody>{l.map(x => <tr key={x.id}><td>{ago(x.created_at)}</td><td>{x.acao}</td><td>{x.alvo}</td></tr>)}</tbody></table></div>
}

function Solic() {
  const [rows, setRows] = useState(null); const [notes, setNotes] = useState([]); const [open, setOpen] = useState(null)
  const [hist, setHist] = useState({ ev: [], nt: [] }); const [nota, setNota] = useState('')
  const SEL = '*, profiles(nome,email), plans(nome)'
  const load = async () => {
    const [a, b] = await Promise.all([sb.from('solicitacoes').select(SEL).order('created_at', { ascending: false }).limit(100), sb.from('notificacoes_admin').select('*').order('created_at', { ascending: false }).limit(30)])
    setRows(a.data || []); setNotes(b.data || [])
  }
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t) }, [])
  const abrir = async s => { setOpen(s); setNota(''); const [e, n] = await Promise.all([sb.from('solicitacao_eventos').select('*').eq('solicitacao_id', s.id).order('created_at'), sb.from('solicitacao_notas').select('*').eq('solicitacao_id', s.id).order('created_at')]); setHist({ ev: e.data || [], nt: n.data || [] }) }
  const marcar = async (n, lida) => { await sb.from('notificacoes_admin').update({ lida }).eq('id', n.id); load() }
  const agir = async est => {
    if (['pagamento_confirmado', 'ativa', 'recusada', 'cancelada'].includes(est) && !confirm(`Confirmar: ${LABEL[est]}?` + (est === 'pagamento_confirmado' ? ' Isto registra a confirmação manual do Pix feita por você.' : ''))) return
    const { error } = await sb.rpc('atualizar_solicitacao', { p_id: open.id, p_estado: est, p_nota: nota || null })
    toast(error ? error.message : 'Solicitação atualizada'); await load()
    if (!error) { const { data } = await sb.from('solicitacoes').select(SEL).eq('id', open.id).single(); abrir(data) }
  }
  const soNota = async () => { if (!nota.trim()) return; const { error } = await sb.from('solicitacao_notas').insert({ solicitacao_id: open.id, nota: nota.trim() }); toast(error ? error.message : 'Observação registrada'); abrir(open) }
  const mail = s => `mailto:${s.profiles.email}?subject=${encodeURIComponent('Sua solicitação de assinatura')}&body=${encodeURIComponent(`Olá, ${s.profiles.nome || ''}! Recebi sua solicitação do plano ${s.plans.nome}. Vamos combinar o pagamento por Pix.`)}`
  if (!rows) return <div className="sk" />
  return <>
    <div className="card"><b>Notificações</b>{!notes.length && <p className="mut">Nenhuma notificação.</p>}
      {notes.map(n => <div className="row sp" key={n.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--ln)' }}><span style={{ fontWeight: n.lida ? 400 : 700 }}>{!n.lida && '● '}{n.texto} <small className="mut">· {ago(n.created_at)}</small></span>
        <span className="row">{n.solicitacao_id && <a href="#" onClick={e => { e.preventDefault(); const s = rows.find(r => r.id === n.solicitacao_id); s && abrir(s); marcar(n, true) }}>Abrir</a>}<a href="#" onClick={e => { e.preventDefault(); marcar(n, !n.lida) }}>{n.lida ? 'Marcar como não lida' : 'Marcar como lida'}</a></span></div>)}</div>
    <h3>Solicitações</h3>
    {!rows.length ? <div className="card mut">Nenhuma solicitação ainda.</div> : <div style={{ overflowX: 'auto' }}><table><thead><tr><th>Cliente</th><th>Plano</th><th>Valor no pedido</th><th>Estado</th><th>Pedido</th><th /></tr></thead><tbody>{rows.map(s => <tr key={s.id}>
      <td>{s.profiles?.nome || '—'}<br /><small className="mut">{s.profiles?.email}</small></td><td>{s.plans?.nome}</td><td>R$ {Number(s.preco).toFixed(2)}/{s.periodicidade}</td>
      <td><span className={'tag' + (s.estado === 'ativa' ? ' ok' : ['recusada', 'cancelada'].includes(s.estado) ? ' bad' : '')}>{LABEL[s.estado]}</span></td><td><small className="mut">{ago(s.created_at)}</small></td><td><button className="g" onClick={() => abrir(s)}>Detalhes</button></td></tr>)}</tbody></table></div>}
    {open && <div className="ov" onClick={() => setOpen(null)}><div className="card" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
      <h3 style={{ marginTop: 0 }}>{open.plans?.nome} · {LABEL[open.estado]}</h3>
      <p>{open.profiles?.nome} · <a href={mail(open)}>{open.profiles?.email}</a><br /><small className="mut">O botão abre o seu app de e-mail; o envio não é feito pelo sistema.</small></p>
      <div className="tl">{hist.ev.map(e => <div className="tli" key={e.id}>{LABEL[e.para]} <small className="mut">· {new Date(e.created_at).toLocaleString('pt-BR')}</small></div>)}</div>
      {hist.nt.map(n => <p key={n.id} className="mut">📝 {n.nota} <small>· {ago(n.created_at)}</small></p>)}
      <label>Observação administrativa<textarea rows={2} value={nota} onChange={e => setNota(e.target.value)} /></label>
      <div className="row">{(NEXT[open.estado] || []).map(est => <button key={est} className={['recusada', 'cancelada'].includes(est) ? 'g' : ''} onClick={() => agir(est)}>{ACAO[est]}</button>)}<button className="g" onClick={soNota}>Só registrar observação</button><button className="g" onClick={() => setOpen(null)}>Fechar</button></div></div></div>}
  </>
}

export default function Admin() {
  const { plans, reload, site } = useApp()
  const [tab, setTab] = useState('geral')
  return (
    <div className="c fade">
      <Link to="/app">← Voltar</Link>
      <h1 style={{ fontSize: '2rem' }}>Área restrita</h1>
      <div className="atabs tabs">{TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      <div style={{ marginTop: 14 }}>
        {tab === 'geral' && <Geral />}{tab === 'users' && <Users plans={plans} />}{tab === 'solic' && <Solic />}{tab === 'planos' && <Planos plans={plans} reload={reload} />}
        {tab === 'conteudo' && <Conteudo site={site} reload={reload} />}{tab === 'imagens' && <Imagens site={site} reload={reload} />}
        {tab === 'analytics' && <Analytics />}{tab === 'audit' && <Audit />}
      </div>
    </div>)
}
