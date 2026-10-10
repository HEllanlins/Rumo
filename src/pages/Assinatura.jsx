import { useEffect, useState } from 'react'
import { useApp } from '../App'
import { sb, FEATURES, brl } from '../supabase'
import { ago, toast } from '../lib.jsx'
import { LABEL } from '../solic.js'

export default function Assinatura() {
  const { plans, me, plan, reload } = useApp()
  const [reqs, setReqs] = useState(null)
  const [conf, setConf] = useState(null)
  const load = async () => { const { data } = await sb.from('solicitacoes').select('*, plans(nome), solicitacao_eventos(para,created_at)').order('created_at', { ascending: false }); setReqs(data || []); reload() }
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t) }, [])
  const aberta = (reqs || []).find(r => ['pendente', 'contato', 'aguardando_pagamento', 'pagamento_confirmado'].includes(r.estado))
  const solicitar = async p => {
    const { error } = await sb.rpc('solicitar_assinatura', { p_plan: p.id }); setConf(null)
    toast(error ? (error.message.includes('aberta') ? 'Você já tem uma solicitação em andamento.' : error.message) : 'Solicitação registrada. O administrador entrará em contato por e-mail.'); load()
  }
  const cancelar = async r => { if (!confirm('Cancelar esta solicitação?')) return; const { error } = await sb.rpc('cancelar_minha_solicitacao', { p_id: r.id }); toast(error ? error.message : 'Solicitação cancelada'); load() }
  return (
    <div className="c fade">
      <h2>Assinatura</h2>
      <div className="card">Plano atual: <b>{plan?.nome || 'nenhum'}</b> · situação: <span className={'tag' + (me.status === 'ativa' ? ' ok' : '')}>{me.status}</span>{me.vencimento && <small className="mut"> · renovação em {new Date(me.vencimento + 'T00:00').toLocaleDateString('pt-BR')}</small>}</div>
      <p className="mut">O pagamento é combinado diretamente com o administrador, por Pix. Ao solicitar, nada é cobrado e a assinatura só é ativada depois da confirmação manual do pagamento.</p>
      <div className="grid">{plans.map(p => (
        <div className="card" key={p.id}><b>{p.nome}</b><h3 style={{ margin: '6px 0' }}>{brl(p.preco)}<small className="mut"> / {p.periodicidade}</small></h3>
          {p.descricao && <p className="mut">{p.descricao}</p>}
          <ul style={{ listStyle: 'none', padding: 0 }}>{Object.entries(FEATURES).map(([f, l]) => <li key={f} className={p.features.includes(f) ? '' : 'mut'}>{p.features.includes(f) ? '✓' : '—'} {l}</li>)}</ul>
          <button disabled={!!aberta || (me.status === 'ativa' && me.plan_id === p.id)} onClick={() => setConf(p)}>{me.plan_id === p.id && me.status === 'ativa' ? 'Plano atual' : 'Solicitar assinatura'}</button></div>))}</div>
      <h3 style={{ marginTop: 28 }}>Minhas solicitações</h3>
      {reqs === null && <div className="sk" />}
      {reqs && !reqs.length && <div className="card mut">Você ainda não fez nenhuma solicitação.</div>}
      {(reqs || []).map(r => (
        <div className="card" key={r.id}><div className="row sp"><b>{r.plans?.nome}</b><span className={'tag' + (r.estado === 'ativa' ? ' ok' : ['recusada', 'cancelada'].includes(r.estado) ? ' bad' : '')}>{LABEL[r.estado]}</span></div>
          <small className="mut">Pedido {ago(r.created_at)} · {brl(r.preco)}/{r.periodicidade} (valor registrado no pedido)</small>
          <div className="tl">{[...r.solicitacao_eventos].sort((a, b) => a.created_at.localeCompare(b.created_at)).map((e, i) => <div className="tli" key={i}>{LABEL[e.para]} <small className="mut">· {ago(e.created_at)}</small></div>)}</div>
          {['pendente', 'contato', 'aguardando_pagamento'].includes(r.estado) && <button className="g" onClick={() => cancelar(r)}>Cancelar solicitação</button>}</div>))}
      {conf && <div className="ov" onClick={() => setConf(null)}><div className="card" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Solicitar o plano {conf.nome}?</h3><p>Valor: {brl(conf.preco)} / {conf.periodicidade}. O administrador será avisado e entrará em contato por e-mail para combinar o Pix.</p>
        <div className="row"><button onClick={() => solicitar(conf)}>Confirmar solicitação</button><button className="g" onClick={() => setConf(null)}>Voltar</button></div></div></div>}
    </div>)
}
