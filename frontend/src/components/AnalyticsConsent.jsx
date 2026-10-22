import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const CONSENT_KEY = 'ngwana-huis-analytics-consent';

function readConsent() {
  try {
    const consent = localStorage.getItem(CONSENT_KEY);
    return consent === 'granted' || consent === 'denied' ? consent : null;
  } catch (error) {
    console.error('Could not read analytics consent preference:', error);
    return null;
  }
}

export default function AnalyticsConsent() {
  const [consent, setConsent] = useState(readConsent);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const lastPageView = useRef(null);
  const pagePath = `${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    if (consent !== 'granted' || lastPageView.current === pagePath || typeof window.gtag !== 'function') {
      return;
    }

    lastPageView.current = pagePath;
    window.gtag('event', 'page_view', {
      page_location: window.location.href,
      page_title: document.title,
      page_path: pagePath,
    });
  }, [consent, pagePath]);

  function chooseConsent(choice) {
    try {
      localStorage.setItem(CONSENT_KEY, choice);
      window.gtag?.('consent', 'update', { analytics_storage: choice });
      setConsent(choice);
      setSettingsOpen(false);
      setError('');
    } catch (storageError) {
      console.error('Could not save analytics consent preference:', storageError);
      setError('Your choice could not be saved. Check your browser storage settings and try again.');
    }
  }

  return (
    <>
      <button
        type="button"
        className="analytics-privacy-button"
        onClick={() => {
          setSettingsOpen(true);
          setError('');
        }}
      >
        Privacy settings
      </button>

      {(consent === null || settingsOpen) && (
        <section className="analytics-consent" aria-label="Analytics privacy settings" aria-live="polite">
          <div className="analytics-consent-copy">
            <h2>Help us improve Ngwana Huis</h2>
            <p>
              Allow Google Analytics to collect usage data about visits to this site.
              Analytics is optional and does not affect how you use the site.
            </p>
            {error && <p className="analytics-consent-error" role="alert">{error}</p>}
          </div>
          <div className="analytics-consent-actions">
            <button type="button" className="btn outline" onClick={() => chooseConsent('denied')}>
              Reject analytics
            </button>
            <button type="button" className="btn primary" onClick={() => chooseConsent('granted')}>
              Allow analytics
            </button>
          </div>
        </section>
      )}
    </>
  );
}
