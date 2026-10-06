import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { sb } from '../supabase'

export default function Auth() {
  const [q] = useSearchParams()
  const [signup, setSignup] = useState(!!q.get('plano'))
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')

  const go = async e => {
    e.preventDefault(); setMsg('')
    const { error } = signup
      ? await sb.auth.signUp({ email, password: pw, options: { data: { plan: q.get('plano') || '' } } })
      : await sb.auth.signInWithPassword({ email, password: pw })
    if (error) setMsg(error.message)
    else if (signup) setMsg('Conta criada. Se pedir confirmação, abra o e-mail que enviamos e depois entre.')
  }
  return (
    <form className="c card" style={{ maxWidth: 420, marginTop: 60 }} onSubmit={go}>
      <h2>{signup ? 'Criar conta' : 'Entrar'}</h2>
      <label>E-mail<input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>Senha<input type="password" required minLength={6} value={pw} onChange={e => setPw(e.target.value)} /></label>
      {msg && <p className="mut">{msg}</p>}
      <div className="row sp"><button>{signup ? 'Criar conta' : 'Entrar'}</button>
        <a href="#" onClick={e => { e.preventDefault(); setSignup(!signup) }}>{signup ? 'Já tenho conta' : 'Criar conta'}</a></div>
      <p><Link to="/">Voltar ao início</Link></p>
    </form>
  )
}
