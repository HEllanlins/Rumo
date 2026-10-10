import { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { sb } from '../supabase'
import { ThemeToggle } from '../theme.jsx'

const Frame = ({ children }) => (
  <div className="bg"><div className="c row sp"><Link to="/"><span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}><img src="/favicon.svg" alt="" width="28" height="28" /><b>Rumo</b></span></Link><ThemeToggle /></div>
    <form className="card fade" style={{ maxWidth: 420, margin: '40px auto', padding: 28 }} onSubmit={e => e.preventDefault()}>{children}</form></div>)

export default function Auth() {
  const [q] = useSearchParams()
  const [mode, setMode] = useState(q.get('plano') ? 'signup' : 'login')
  const [f, setF] = useState({ nome: '', email: '', pw: '', pw2: '' })
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const set = k => e => setF({ ...f, [k]: e.target.value })

  const submit = async () => {
    setMsg('')
    if (mode === 'signup' && f.pw !== f.pw2) return setMsg('As senhas não são iguais.')
    if (mode !== 'recover' && f.pw.length < 8) return setMsg('Use uma senha com pelo menos 8 caracteres.')
    setBusy(true)
    let error
    if (mode === 'login') ({ error } = await sb.auth.signInWithPassword({ email: f.email, password: f.pw }))
    if (mode === 'signup') {
      ({ error } = await sb.auth.signUp({ email: f.email, password: f.pw, options: { data: { name: f.nome, plan: q.get('plano') || '' }, emailRedirectTo: location.origin + '/app' } }))
      if (!error) setMsg('Conta criada. Se o projeto exigir confirmação, abra o e-mail que enviamos.')
    }
    if (mode === 'recover') {
      ({ error } = await sb.auth.resetPasswordForEmail(f.email, { redirectTo: location.origin + '/redefinir' }))
      if (!error) setMsg('Enviamos um link de recuperação para o seu e-mail.')
    }
    if (error) setMsg(error.message)
    setBusy(false)
  }
  const google = () => sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + '/app' } })
  const titulo = { login: 'Entrar', signup: 'Criar conta', recover: 'Recuperar senha' }[mode]

  return (
    <Frame>
      <h2>{titulo}</h2>
      {mode === 'signup' && <label>Nome<input required value={f.nome} onChange={set('nome')} autoComplete="name" /></label>}
      <label>E-mail<input type="email" required value={f.email} onChange={set('email')} autoComplete="email" /></label>
      {mode !== 'recover' && <label>Senha<input type="password" value={f.pw} onChange={set('pw')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>}
      {mode === 'signup' && <label>Confirmar senha<input type="password" value={f.pw2} onChange={set('pw2')} autoComplete="new-password" /></label>}
      {msg && <p role="alert" className="tag" style={{ display: 'block', borderRadius: 10 }}>{msg}</p>}
      <div className="row" style={{ marginTop: 12 }}><button disabled={busy || !f.email} onClick={submit}>{busy ? 'Aguarde…' : titulo}</button>
        {mode !== 'recover' && <button className="g" onClick={google}>Continuar com Google</button>}</div>
      <p className="row sp">
        {mode === 'login' ? <><a href="#" onClick={e => { e.preventDefault(); setMode('signup') }}>Criar conta</a><a href="#" onClick={e => { e.preventDefault(); setMode('recover') }}>Esqueci a senha</a></>
          : <a href="#" onClick={e => { e.preventDefault(); setMode('login') }}>Voltar ao login</a>}</p>
    </Frame>)
}

export function Reset() {
  const nav = useNavigate()
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [msg, setMsg] = useState('')
  const go = async () => {
    if (pw !== pw2) return setMsg('As senhas não são iguais.')
    if (pw.length < 8) return setMsg('Use pelo menos 8 caracteres.')
    const { error } = await sb.auth.updateUser({ password: pw })
    if (error) setMsg(error.message); else nav('/app')
  }
  return (<Frame><h2>Nova senha</h2>
    <label>Nova senha<input type="password" value={pw} onChange={e => setPw(e.target.value)} /></label>
    <label>Confirmar<input type="password" value={pw2} onChange={e => setPw2(e.target.value)} /></label>
    {msg && <p role="alert">{msg}</p>}<button onClick={go}>Salvar senha</button></Frame>)
}
