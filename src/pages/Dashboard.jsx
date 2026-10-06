import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../App'
import { sb } from '../supabase'

export default function Dashboard() {
  const { me, plan, can, admin } = useApp()
  const [list, setList] = useState([])
  const [nome, setNome] = useState('')
  const load = async () => { const { data } = await sb.from('projects').select('*').order('created_at', { ascending: false }); setList(data || []) }
  useEffect(() => { load() }, [])
  const add = async e => { e.preventDefault(); if (!nome.trim()) return; await sb.from('projects').insert({ nome }); setNome(''); load() }

  return (
    <div className="c">
      <div className="row sp"><b>Rumo</b>
        <div className="row">{admin && <Link to="/restrita" className="btn g">Área restrita</Link>}
          <button className="g" onClick={() => sb.auth.signOut()}>Sair</button></div></div>
      <p className="mut">{me.email} · plano {plan?.nome || 'não escolhido'} · {admin ? 'administrador' : me.status}</p>
      {!can('projects') ? (
        <div className="card">Sua assinatura ainda não está ativa. Assim que o pagamento for confirmado, os recursos do plano serão liberados.</div>
      ) : (
        <>
          <form className="row" onSubmit={add}><input style={{ flex: 1 }} placeholder="Nome do novo projeto" value={nome} onChange={e => setNome(e.target.value)} /><button>Criar projeto</button></form>
          <div className="grid" style={{ marginTop: 12 }}>
            {list.map(p => (
              <Link to={`/app/${p.id}`} key={p.id} className="card" style={{ color: 'inherit' }}>
                <b>{p.nome}</b>
                {can('progress') && <><div className="bar" style={{ margin: '10px 0 4px' }}><i style={{ width: p.progresso + '%' }} /></div><small className="mut">{p.progresso}% pronto</small></>}
              </Link>
            ))}
          </div>
          {!list.length && <p className="mut">Nenhum projeto ainda. Crie o primeiro acima.</p>}
        </>
      )}
    </div>
  )
}
