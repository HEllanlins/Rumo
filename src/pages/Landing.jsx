import { Link } from 'react-router-dom'
import { useApp } from '../App'
import { FEATURES, brl } from '../supabase'

export default function Landing() {
  const { plans, session } = useApp()
  return (
    <>
      <div className="c">
        <div className="row sp"><b>Rumo</b><Link to={session ? '/app' : '/entrar'} className="btn g">Acesso</Link></div>
        <section className="hero">
          <h1>Volte ao projeto sem se perder.</h1>
          <p className="mut" style={{ maxWidth: 560 }}>Registre cada prompt, acompanhe a evolução em porcentagem, guarde o histórico de mudanças e veja os commits do GitHub — tudo em uma pasta por projeto.</p>
          <a href="#planos" className="btn">Ver planos</a>
        </section>
        <section className="grid">
          <div className="card"><b>Prompts sob controle</b><p className="mut">Lançado, não lançado, atrasado ou trocado: você sabe onde parou.</p></div>
          <div className="card"><b>Evolução do projeto</b><p className="mut">Quanto falta para ficar pronto, em um relance.</p></div>
          <div className="card"><b>Histórico e Git</b><p className="mut">Mudanças anotadas e commits do repositório na mesma tela.</p></div>
        </section>
        <section id="planos" style={{ marginTop: 40 }}>
          <h2>Planos</h2>
          <div className="grid">
            {plans.map(p => (
              <div className="card" key={p.id}>
                <b>{p.nome}</b>
                <h3 style={{ margin: '6px 0' }}>{brl(p.preco)}<small className="mut">/mês</small></h3>
                <ul>{p.features.map(f => <li key={f}>{FEATURES[f] || f}</li>)}</ul>
                <Link className="btn" to={`/entrar?plano=${p.id}`}>Assinar {p.nome}</Link>
              </div>
            ))}
          </div>
        </section>
      </div>
      <footer><Link to="/restrita">Área restrita</Link></footer>
    </>
  )
}
