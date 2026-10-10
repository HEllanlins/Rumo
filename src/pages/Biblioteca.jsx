import { useEffect, useRef, useState } from 'react'
import { useApp } from '../App'
import { sb } from '../supabase'
import { ago, toast } from '../lib.jsx'

const VIEWS = [['grade', '▦', 'Grade de cartões'], ['compacta', '☰', 'Lista compacta'], ['detalhada', '▤', 'Lista detalhada'], ['expandida', '◫', 'Visualização expandida']]
const STATUS = ['não lançado', 'lançado', 'atrasado', 'trocado', 'em espera', 'aguardando']
const PAGE = 30
const vazio = { titulo: '', descricao: '', texto: '', categoria_id: null, project_id: null, status: 'não lançado', favorito: false, tags: [] }
const ATALHOS = [['/ ou Ctrl/Cmd + K', 'Buscar'], ['N', 'Novo prompt'], ['A', 'Selecionar os prompts visíveis'], ['F', 'Favoritar os selecionados'], ['Ctrl/Cmd + Enter', 'Salvar no editor'], ['Esc', 'Fechar painel ou limpar a busca'], ['?', 'Esta ajuda']]

function Gerir({ tabela, titulo, itens, reload }) {
  const [n, setN] = useState('')
  const add = async e => { e.preventDefault(); if (!n.trim()) return; const { error } = await sb.from(tabela).insert({ nome: n.trim() }); toast(error ? (error.code === '23505' ? 'Esse nome já existe.' : error.message) : 'Criado'); setN(''); reload() }
  const ren = async i => { const nome = window.prompt('Novo nome', i.nome); if (!nome || !nome.trim()) return; const { error } = await sb.from(tabela).update({ nome: nome.trim() }).eq('id', i.id); toast(error ? error.message : 'Renomeado'); reload() }
  const del = async i => { if (!confirm(`Excluir "${i.nome}"? Os prompts continuam existindo, só perdem este vínculo.`)) return; const { error } = await sb.from(tabela).delete().eq('id', i.id); toast(error ? error.message : 'Excluído'); reload() }
  return (<div className="card"><b>{titulo}</b>
    <form className="row" onSubmit={add} style={{ margin: '8px 0' }}><input style={{ flex: 1 }} maxLength={40} placeholder="Novo nome" value={n} onChange={e => setN(e.target.value)} /><button>Adicionar</button></form>
    <div className="row">{itens.map(i => <span className="tag" key={i.id}>{i.nome} <a href="#" aria-label={'Renomear ' + i.nome} onClick={e => { e.preventDefault(); ren(i) }}>✎</a> <a href="#" aria-label={'Excluir ' + i.nome} onClick={e => { e.preventDefault(); del(i) }}>×</a></span>)}{!itens.length && <small className="mut">Nada criado ainda.</small>}</div></div>)
}

export default function Biblioteca() {
  const { session } = useApp()
  const [rows, setRows] = useState([]); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(true)
  const [cats, setCats] = useState([]); const [tags, setTags] = useState([]); const [projs, setProjs] = useState([])
  const [f, setF] = useState({ q: '', cat: '', tag: '', proj: '', fav: false, ord: 'recentes' })
  const [q, setQ] = useState('')
  const [view, setView] = useState(localStorage.getItem('libview') || 'grade')
  const [sel, setSel] = useState(new Set()); const [ed, setEd] = useState(null); const [help, setHelp] = useState(false); const [man, setMan] = useState(false)
  const busca = useRef()
  const nomeProj = id => projs.find(p => p.id === id)?.nome
  const nomeCat = id => cats.find(c => c.id === id)?.nome
  const nomeTag = id => tags.find(t => t.id === id)?.nome

  const meta = async () => {
    const [a, b, c] = await Promise.all([sb.from('categorias').select('*').order('nome'), sb.from('etiquetas').select('*').order('nome'), sb.from('projects').select('id,nome').order('nome')])
    setCats(a.data || []); setTags(b.data || []); setProjs(c.data || [])
  }
  const consulta = from => {
    let s = sb.from('prompts').select('*, prompt_etiquetas' + (f.tag ? '!inner' : '') + '(etiqueta_id)', { count: 'exact' })
    if (f.q) { const t = f.q.replace(/[%,()*]/g, ' ').trim(); if (t) s = s.or(`titulo.ilike.%${t}%,texto.ilike.%${t}%,descricao.ilike.%${t}%`) }
    if (f.cat) s = s.eq('categoria_id', f.cat)
    if (f.proj) s = f.proj === 'none' ? s.is('project_id', null) : s.eq('project_id', f.proj)
    if (f.fav) s = s.eq('favorito', true)
    if (f.tag) s = s.eq('prompt_etiquetas.etiqueta_id', f.tag)
    s = f.ord === 'nome' ? s.order('titulo') : s.order('favorito', { ascending: false }).order('updated_at', { ascending: false })
    return s.range(from, from + PAGE - 1)
  }
  const recarregar = async () => { setLoading(true); const { data, count } = await consulta(0); setRows(data || []); setTotal(count || 0); setLoading(false) }
  const mais = async () => { const { data } = await consulta(rows.length); setRows([...rows, ...(data || [])]) }
  useEffect(() => { meta() }, [])
  useEffect(() => { const t = setTimeout(() => setF(x => ({ ...x, q })), 300); return () => clearTimeout(t) }, [q])
  useEffect(() => { recarregar() }, [f])
  const mudaView = v => { setView(v); localStorage.setItem('libview', v) }

  const copiar = x => navigator.clipboard.writeText(x.texto || '').then(() => toast('Prompt copiado'))
  const favoritar = async x => { const { error } = await sb.from('prompts').update({ favorito: !x.favorito }).eq('id', x.id); if (error) toast(error.message); else setRows(rows.map(r => r.id === x.id ? { ...r, favorito: !x.favorito } : r)) }
  const abrir = x => setEd({ ...x, tags: (x.prompt_etiquetas || []).map(t => t.etiqueta_id) })
  const salvar = async () => {
    if (!ed.titulo.trim()) return toast('Informe um título')
    const { id, tags: tg, prompt_etiquetas, created_at, updated_at, user_id, ...campos } = ed
    campos.categoria_id = campos.categoria_id || null; campos.project_id = campos.project_id || null
    let pid = id
    if (id) { const { error } = await sb.from('prompts').update(campos).eq('id', id); if (error) return toast(error.message) }
    else { const { data, error } = await sb.from('prompts').insert(campos).select('id').single(); if (error) return toast(error.message); pid = data.id }
    const d = await sb.from('prompt_etiquetas').delete().eq('prompt_id', pid)
    if (!d.error && tg.length) await sb.from('prompt_etiquetas').insert(tg.map(e => ({ prompt_id: pid, etiqueta_id: e })))
    setEd(null); toast('Prompt salvo'); recarregar()
  }
  const excluir = async () => { if (!confirm('Excluir este prompt?')) return; const { error } = await sb.from('prompts').delete().eq('id', ed.id); toast(error ? error.message : 'Prompt excluído'); setEd(null); recarregar() }

  const ids = [...sel]
  const lote = async (fn, msg) => { const { error } = await fn(); toast(error ? 'Falhou: ' + error.message + ' (nada foi alterado nesta operação)' : `${msg}: ${ids.length}`); if (!error) { setSel(new Set()); recarregar() } }
  const loteExcluir = () => confirm(`Excluir ${ids.length} prompts? Esta ação não pode ser desfeita.`) && lote(() => sb.from('prompts').delete().in('id', ids), 'Excluídos')
  const toggle = id => { const s = new Set(sel); s.has(id) ? s.delete(id) : s.add(id); setSel(s) }

  useEffect(() => {
    const k = e => {
      const t = e.target, typing = /INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); busca.current?.focus(); return }
      if (mod && e.key === 'Enter' && ed) { e.preventDefault(); salvar(); return }
      if (e.key === 'Escape') { if (ed) setEd(null); else if (help) setHelp(false); else if (document.activeElement === busca.current) { setQ(''); busca.current.blur() } return }
      if (typing || mod || e.altKey) return
      if (e.key === '/') { e.preventDefault(); busca.current?.focus() }
      else if (e.key === '?') setHelp(true)
      else if (e.key.toLowerCase() === 'n') { e.preventDefault(); setEd({ ...vazio }) }
      else if (e.key.toLowerCase() === 'a') setSel(new Set(rows.map(r => r.id)))
      else if (e.key.toLowerCase() === 'f' && sel.size) lote(() => sb.from('prompts').update({ favorito: true }).in('id', ids), 'Favoritados')
    }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  })

  const chips = x => <>{x.categoria_id && <span className="tag">{nomeCat(x.categoria_id)}</span>} {(x.prompt_etiquetas || []).map(t => <span className="tag" key={t.etiqueta_id}>#{nomeTag(t.etiqueta_id)}</span>)}</>
  const classe = { grade: 'grade', compacta: 'lista', detalhada: 'lista', expandida: 'grande' }[view]

  return (
    <div className="c fade">
      <div className="row sp"><h2 style={{ margin: 0 }}>Biblioteca de prompts</h2>
        <span className="row"><button className="g" onClick={() => setMan(!man)}>Categorias e etiquetas</button><button className="g" onClick={() => setHelp(true)} aria-label="Atalhos de teclado">?</button><button onClick={() => setEd({ ...vazio })}>+ Novo prompt</button></span></div>
      {man && <div className="grid" style={{ marginTop: 10 }}><Gerir tabela="categorias" titulo="Categorias" itens={cats} reload={() => { meta(); recarregar() }} /><Gerir tabela="etiquetas" titulo="Etiquetas" itens={tags} reload={() => { meta(); recarregar() }} /></div>}
      <div className="row" style={{ margin: '14px 0' }}>
        <input ref={busca} style={{ maxWidth: 260 }} placeholder="Buscar (/ ou Ctrl+K)" aria-label="Buscar prompts" value={q} onChange={e => setQ(e.target.value)} />
        <select style={{ width: 'auto' }} aria-label="Categoria" value={f.cat} onChange={e => setF({ ...f, cat: e.target.value })}><option value="">Todas as categorias</option>{cats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
        <select style={{ width: 'auto' }} aria-label="Etiqueta" value={f.tag} onChange={e => setF({ ...f, tag: e.target.value })}><option value="">Todas as etiquetas</option>{tags.map(c => <option key={c.id} value={c.id}>#{c.nome}</option>)}</select>
        <select style={{ width: 'auto' }} aria-label="Projeto" value={f.proj} onChange={e => setF({ ...f, proj: e.target.value })}><option value="">Todos os projetos</option><option value="none">Sem projeto</option>{projs.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
        <select style={{ width: 'auto' }} aria-label="Ordenar" value={f.ord} onChange={e => setF({ ...f, ord: e.target.value })}><option value="recentes">Atualizados recentemente</option><option value="nome">Nome (A–Z)</option></select>
        <button className={'g' + (f.fav ? ' on' : '')} onClick={() => setF({ ...f, fav: !f.fav })}>★ Favoritos</button>
        <span className="row" style={{ marginLeft: 'auto' }}>{VIEWS.map(([k, i, t]) => <button key={k} title={t} aria-label={t} className={'g' + (view === k ? ' on' : '')} onClick={() => mudaView(k)}>{i}</button>)}</span></div>
      <small className="mut">{total} prompts{loading ? ' · carregando…' : ''}</small>
      {loading && !rows.length && <div className="grid" style={{ marginTop: 10 }}><div className="sk" /><div className="sk" /><div className="sk" /></div>}
      {!loading && !rows.length && <div className="card mut" style={{ marginTop: 10 }}>{f.q || f.cat || f.tag || f.proj || f.fav ? 'Nenhum prompt com esses filtros.' : 'Sua biblioteca está vazia. Crie um prompt aqui ou dentro de um projeto; ele aparece nos dois lugares.'}</div>}
      <div className={'pg ' + classe}>{rows.map(x => (
        <div key={x.id} className={'card pi' + (sel.has(x.id) ? ' sel' : '')} role="button" tabIndex={0} onClick={() => abrir(x)} onKeyDown={e => e.key === 'Enter' && abrir(x)}>
          <div className="row sp" style={{ flexWrap: 'nowrap' }}>
            <span className="row" style={{ flexWrap: 'nowrap', minWidth: 0 }}><input type="checkbox" aria-label={'Selecionar ' + x.titulo} checked={sel.has(x.id)} onClick={e => e.stopPropagation()} onChange={() => toggle(x.id)} />
              <a href="#" aria-label="Favoritar" onClick={e => { e.preventDefault(); e.stopPropagation(); favoritar(x) }}>{x.favorito ? '★' : '☆'}</a><b>{x.titulo}</b></span>
            {view !== 'compacta' && <span className="tag">{x.status}</span>}
            {view === 'compacta' && <small className="mut">{ago(x.updated_at)}</small>}</div>
          {view !== 'compacta' && <p className="mut ex">{x.descricao || x.texto}</p>}
          {view !== 'compacta' && <div className="row" style={{ marginTop: 6 }}>{chips(x)}</div>}
          {(view === 'detalhada' || view === 'expandida') && <small className="mut">{nomeProj(x.project_id) ? 'Projeto: ' + nomeProj(x.project_id) + ' · ' : ''}atualizado {ago(x.updated_at)}</small>}
          {view !== 'compacta' && <div className="row" style={{ marginTop: 8 }}><button className="g" onClick={e => { e.stopPropagation(); copiar(x) }}>Copiar</button></div>}
        </div>))}</div>
      {rows.length < total && <button className="g" style={{ marginTop: 12 }} onClick={mais}>Carregar mais ({total - rows.length})</button>}

      {sel.size > 0 && <div className="card bar2 row"><b>{sel.size} selecionados</b>
        <button className="g" onClick={() => lote(() => sb.from('prompts').update({ favorito: true }).in('id', ids), 'Favoritados')}>★</button>
        <button className="g" onClick={() => lote(() => sb.from('prompts').update({ favorito: false }).in('id', ids), 'Desfavoritados')}>☆</button>
        <select style={{ width: 'auto' }} aria-label="Alterar categoria" value="" onChange={e => e.target.value && lote(() => sb.from('prompts').update({ categoria_id: e.target.value === 'none' ? null : e.target.value }).in('id', ids), 'Categoria alterada')}><option value="">Categoria…</option><option value="none">(sem categoria)</option>{cats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
        <select style={{ width: 'auto' }} aria-label="Adicionar etiqueta" value="" onChange={e => e.target.value && lote(() => sb.from('prompt_etiquetas').upsert(ids.map(i => ({ prompt_id: i, etiqueta_id: e.target.value })), { ignoreDuplicates: true }), 'Etiqueta adicionada')}><option value="">+ Etiqueta…</option>{tags.map(c => <option key={c.id} value={c.id}>#{c.nome}</option>)}</select>
        <select style={{ width: 'auto' }} aria-label="Remover etiqueta" value="" onChange={e => e.target.value && lote(() => sb.from('prompt_etiquetas').delete().in('prompt_id', ids).eq('etiqueta_id', e.target.value), 'Etiqueta removida')}><option value="">− Etiqueta…</option>{tags.map(c => <option key={c.id} value={c.id}>#{c.nome}</option>)}</select>
        <select style={{ width: 'auto' }} aria-label="Associar a projeto" value="" onChange={e => e.target.value && lote(() => sb.from('prompts').update({ project_id: e.target.value === 'none' ? null : e.target.value }).in('id', ids), 'Projeto associado')}><option value="">Projeto…</option><option value="none">(sem projeto)</option>{projs.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
        <button className="g" onClick={loteExcluir}>Excluir</button><button className="g" onClick={() => setSel(new Set())}>Limpar</button></div>}

      {ed && <div className="ov" onClick={() => setEd(null)}><div className="card" role="dialog" aria-modal="true" aria-label="Editor de prompt" style={{ width: 'min(720px,100%)' }} onClick={e => e.stopPropagation()}>
        <input autoFocus placeholder="Título" value={ed.titulo} onChange={e => setEd({ ...ed, titulo: e.target.value })} />
        <label>Descrição curta<input maxLength={200} value={ed.descricao || ''} onChange={e => setEd({ ...ed, descricao: e.target.value })} /></label>
        <div className="grid"><label>Categoria<select value={ed.categoria_id || ''} onChange={e => setEd({ ...ed, categoria_id: e.target.value })}><option value="">—</option>{cats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
          <label>Projeto<select value={ed.project_id || ''} onChange={e => setEd({ ...ed, project_id: e.target.value })}><option value="">—</option>{projs.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
          <label>Status<select value={ed.status} onChange={e => setEd({ ...ed, status: e.target.value })}>{STATUS.map(s => <option key={s}>{s}</option>)}</select></label></div>
        <div className="row" style={{ margin: '8px 0' }}>{tags.map(t => <button key={t.id} type="button" className={'g chip' + (ed.tags.includes(t.id) ? ' on' : '')} onClick={() => setEd({ ...ed, tags: ed.tags.includes(t.id) ? ed.tags.filter(x => x !== t.id) : [...ed.tags, t.id] })}>#{t.nome}</button>)}{!tags.length && <small className="mut">Crie etiquetas em "Categorias e etiquetas".</small>}</div>
        <textarea rows={12} aria-label="Texto do prompt" value={ed.texto || ''} onChange={e => setEd({ ...ed, texto: e.target.value })} />
        <div className="row" style={{ marginTop: 10 }}><button onClick={salvar}>Salvar</button><button className="g" onClick={() => copiar(ed)}>Copiar</button>
          <label style={{ margin: 0 }}><input type="checkbox" checked={!!ed.favorito} onChange={e => setEd({ ...ed, favorito: e.target.checked })} /> Favorito</label>
          {ed.id && <button className="g" onClick={excluir}>Excluir</button>}<button className="g" onClick={() => setEd(null)}>Fechar</button></div></div></div>}
      {help && <div className="ov" onClick={() => setHelp(false)}><div className="card" role="dialog" aria-modal="true" aria-label="Atalhos" onClick={e => e.stopPropagation()}><h3 style={{ marginTop: 0 }}>Atalhos de teclado</h3>
        {ATALHOS.map(([k, d]) => <div className="row sp" key={k}><span className="kbd">{k}</span><span>{d}</span></div>)}<p className="mut">Os atalhos de letra não funcionam enquanto você digita em um campo.</p><button className="g" onClick={() => setHelp(false)}>Fechar</button></div></div>}
    </div>)
}
