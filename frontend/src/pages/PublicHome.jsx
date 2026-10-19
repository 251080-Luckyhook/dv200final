import { ArrowRight, CalendarDays, HeartHandshake } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PublicHome() {
  return (
    <main className="public-home">
      <header className="public-nav">
        <Link to="/" className="public-wordmark">Ngwana Huis</Link>

        <nav aria-label="Account">
          <Link to="/login" className="public-login">Log in</Link>
          <Link to="/signup" className="btn primary">Become a volunteer</Link>
        </nav>
      </header>

      <section className="public-hero">
        <div className="public-copy">
          <p className="eyebrow">A little time can make a big difference</p>
          <h1 className="serif">Show up for little ones.</h1>
          <p className="public-lead">
            Ngwana Huis helps volunteers book visits and gives staff one place to coordinate them.
          </p>
          <div className="public-actions">
            <Link to="/signup" className="btn primary">
              Join as a volunteer <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="public-secondary">Already have an account? Log in</Link>
          </div>
        </div>

        <div className="public-illustration" aria-hidden="true">
          <span className="public-sun" />
          <div className="public-illustration-card">
            <HeartHandshake size={76} strokeWidth={1.4} />
            <span>Care starts with showing up</span>
          </div>
          <span className="public-spark">✳</span>
        </div>
      </section>

      <section className="public-info" aria-label="How the platform works">
        <article>
          <span className="public-icon"><HeartHandshake size={23} /></span>
          <h2>Volunteer with care</h2>
          <p>Create an account to see visit information and keep track of your visits.</p>
        </article>
        <article>
          <span className="public-icon blue"><CalendarDays size={23} /></span>
          <h2>Book a visit</h2>
          <p>Choose an available date and time that works for you.</p>
        </article>
      </section>

      <footer className="public-footer">
        <span>Ngwana Huis</span>
        <Link to="/login">Staff and volunteer sign in <ArrowRight size={15} /></Link>
      </footer>
    </main>
  );
}
