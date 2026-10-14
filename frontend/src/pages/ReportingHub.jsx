import { useEffect, useState } from 'react';
import { ArrowRight, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { api } from '../api.js';
import Notice from '../components/Notice.jsx';
import { formatShort, hourLabel, todayISO, addDays } from '../utils/dates.js';

const TYPE_COLORS = { Cuddle: '#f26b21', Play: '#f7b731', Feeding: '#38b3e8', Other: '#c9c9c9' };

const CATEGORY_LABELS = { nappies: 'Nappies', wet_wipes: 'Wipes', toys: 'Toys', formula: 'Formula' };

function friendlyDate(iso, hour) {
  const today = todayISO();

  let day = formatShort(iso);

  if (iso === today) {
    day = 'Today';
  } else if (iso === addDays(today, -1)) {
    day = 'Yesterday';
  }

  return `${day}, ${hourLabel(hour)}`;
}

function Donut({ data }) {
  const entries = Object.entries(data).filter(([, hours]) => hours > 0);
  const total = entries.reduce((sum, [, hours]) => sum + hours, 0);

  if (total === 0) {
    return <p className="muted-text">Hours will appear here once volunteers check out.</p>;
  }

  let offset = 0;

  return (
    <svg viewBox="0 0 42 42" className="donut" role="img" aria-label="Volunteer hours by activity type">
      {entries.map(([type, hours]) => {
        const share = (hours / total) * 100;

        const segment = (
          <circle
            key={type}
            cx="21"
            cy="21"
            r="15.9155"
            fill="transparent"
            stroke={TYPE_COLORS[type] || TYPE_COLORS.Other}
            strokeWidth="8"
            strokeDasharray={`${share} ${100 - share}`}
            strokeDashoffset={25 - offset}
          />
        );

        offset += share;

        return segment;
      })}
    </svg>
  );
}

export default function ReportingHub() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/reports/summary')
      .then(setSummary)
      .catch((err) => setError(err.message));
  }, []);

  async function download() {
    setError('');

    try {
      await api.download('/reports/monthly.csv', 'ngwana-huis-monthly-report.csv');
    } catch (err) {
      setError(err.message);
    }
  }

  if (!summary) {
    return (
      <div className="page">
        <h1 className="page-title">Reporting hub</h1>

        <Notice error={error} />

        {!error && <p className="muted-text">Loading report...</p>}
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Reporting hub</h1>

      <Notice error={error} />

      <section className="card">
        <h2>Recent volunteer activity</h2>

        <p className="muted-text">Latest activity logged by volunteers</p>

        <div className="table-scroll">
          <table className="table striped">
            <thead>
              <tr>
                <th>Volunteer</th>
                <th>Activity</th>
                <th>Type</th>
                <th>Date &amp; Time</th>
                <th>Hours Logged</th>
              </tr>
            </thead>

            <tbody>
              {summary.recentActivity.length === 0 && (
                <tr>
                  <td colSpan={5}>No activity has been logged yet.</td>
                </tr>
              )}

              {summary.recentActivity.map((row) => (
                <tr key={row.id}>
                  <td>{row.volunteer.shortName}</td>
                  <td>{row.activityLabel}</td>
                  <td>
                    <span className="type-pill">{row.activityType}</span>
                  </td>
                  <td>{friendlyDate(row.date, row.startHour)}</td>
                  <td>{row.hoursLogged > 0 ? `${row.hoursLogged} hrs` : 'In progress'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="reports-grid">
        <section className="card">
          <h2>Volunteers hours counter</h2>

          <div className="big-number-box">{summary.totalHours} hrs</div>

          <ul className="legend">
            {Object.keys(summary.hoursByType).map((type) => (
              <li key={type}>
                <i style={{ background: TYPE_COLORS[type] || TYPE_COLORS.Other }} />

                {type}
              </li>
            ))}
          </ul>

          <Donut data={summary.hoursByType} />
        </section>

        <div>
          <section className="card">
            <h2>Material items sourced</h2>

            <p className="muted-text">Fulfilled care requests this month</p>

            <div className="materials">
              <div className="materials-total">
                <span className="emoji big">🧺</span>

                <strong>{summary.materials.total}</strong>

                <span>items</span>
              </div>

              <ul>
                {summary.materials.byCategory.length === 0 && <li className="muted-text">Nothing sourced yet this month.</li>}

                {summary.materials.byCategory.map((row) => (
                  <li key={row.category}>
                    <span>{CATEGORY_LABELS[row.category]}</span>

                    <strong>{row.total}</strong>
                  </li>
                ))}
              </ul>
            </div>

            <button type="button" className="text-link" onClick={() => navigate('/staff')}>
              Request more items <ArrowRight size={18} />
            </button>
          </section>

          <button type="button" className="download-bar" onClick={download}>
            <span>Download this month's report</span>

            <Download size={26} />
          </button>
        </div>
      </div>
    </div>
  );
}
