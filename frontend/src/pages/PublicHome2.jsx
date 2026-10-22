import { Link } from 'react-router-dom';

import '../PublicHome2.css';

export default function PublicHome() {
  return (
    <main className="welcome">
      <section className="welcome-content">
        <h1 className="welcome-title">
          <span>Giving each child a</span>
          <span>loving home</span>
        </h1>

        <p className="welcome-text">
          10–15 minutes of individual attention can make all the difference.
          Create an account to schedule a visit.
        </p>

        <Link to="/signup" className="welcome-cta">
          Create an account
        </Link>

        <p className="welcome-login">
          I already have an account. <Link to="/login">LOG IN</Link>
        </p>
      </section>
    </main>
  );
}
