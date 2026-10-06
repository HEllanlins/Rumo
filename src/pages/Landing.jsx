import { Link } from 'react-router-dom'
import { useApp } from '../App'
import { FEATURES, brl } from '../supabase'
import { ThemeToggle } from '../theme.jsx'

const blocos = [
  ['Gerenciamento de projetos', 'Status, prioridade, prazo, cliente e tags em cada projeto, com uma pasta própria para tudo.'],
  ['Controle de prompts', 'Marque cada prompt como lançado, não lançado, atrasado ou trocado e copie com um clique.'],
  ['Acompanhamento de progresso', 'Percentual de conclusão e histórico de mudanças para saber onde parou.'],
  ['Integração com GitHub', 'Commits, branches, pull requests, issues e releases de repositórios públicos.'],
  ['Segurança', 'Login com e-mail ou Google. Regras no banco garantem que cada usuário veja só os próprios dados.'],
  ['Personalização', 'Tema claro ou escuro, presets e cores próprias, apenas na sua área restrita.'],
]
export default function Landing() {
  const { plans, session } = useApp()
  return (
    <div className="bg">
      <div className="nav"><div className="c row sp"><b>Rumo</b>
        <div className="row"><ThemeToggle /><Link to={session ? '/app' : '/entrar'} className="btn g">Acesso</Link></div></div></div>
      <div className="c">
        <section className="hero fade row sp" style={{ alignItems: 'center' }}>
          <div style={{ flex: '1 1 340px' }}>
            <h1>Volte ao projeto sem se perder.</h1>
            <p className="mut" style={{ maxWidth: 520 }}>Prompts, evolução, histórico e commits do GitHub organizados por projeto, em um painel que você instala no celular.</p>
            <div className="row"><a href="#planos" className="btn">Ver planos</a><a href="#recursos" className="btn g">Conhecer recursos</a></div>
          </div>
          <div className="card float" style={{ flex: '1 1 280px', maxWidth: 380 }} aria-hidden="true">
            <b>Loja de advocacia</b> <span className="tag">em desenvolvimento</span>
            <div className="bar" style={{ margin: '14px 0 6px' }}><i style={{ width: '68%' }} /></div><small className="mut">68% pronto · prazo em 12 dias</small>
            <hr style={{ border: 0, borderTop: '1px solid var(--ln)', margin: '14px 0' }} />
            <small className="mut">Prompt 14 · <span className="tag ok">lançado</span><br />Prompt 15 · <span className="tag">não lançado</span></small>
          </div>
        </section>
        <section id="recursos" className="sec"><h2>Recursos</h2>
          <div className="grid">{blocos.map(([t, d]) => <div className="card" key={t}><b>{t}</b><p className="mut">{d}</p></div>)}</div></section>
        <section id="planos" className="sec"><h2>Planos</h2>
          <div className="grid">{plans.map(p => (
            <div className="card" key={p.id}><b>{p.nome}</b>
              <h3 style={{ margin: '6px 0' }}>{brl(p.preco)}<small className="mut">/mês</small></h3>
              <ul>{p.features.map(f => <li key={f}>{FEATURES[f] || f}</li>)}</ul>
              <Link className="btn" to={`/entrar?plano=${p.id}`}>Assinar {p.nome}</Link></div>))}</div></section>
        <section className="sec card" style={{ textAlign: 'center', padding: 36 }}><h2>Comece a organizar seus projetos</h2><Link className="btn" to="/entrar">Criar conta</Link></section>
      </div>
      <footer className="mut">Rumo · <Link to="/restrita">Área restrita</Link></footer>
    </div>)
}
