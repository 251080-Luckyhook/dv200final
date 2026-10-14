import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const STEPS = [
  { number: 1, title: 'Choose a date', text: 'Pick a day that works for you from the calendar.', tone: 'yellow' },
  { number: 2, title: 'Select a time', text: 'Choose an available time slot.', tone: 'blue' },
  { number: 3, title: 'Confirm your visit', text: 'Review house rules and confirm your visit.', tone: 'orange' },
];

const SLIDES = [
  { title: 'Welcome to Ngwana Huis', text: 'Every cuddle, story and song helps a baby feel safe.' },
  { title: 'Booking takes a minute', text: 'Pick a day, choose a time and tell us how you would like to help.' },
  { title: 'Arrive 5-10 minutes early', text: 'Wash your hands and follow the house hygiene and visitor guidelines.' },
];

export default function VolunteerHome() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSlide((current) => (current + 1) % SLIDES.length), 6000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="page">
      <section className="hero-banner">
        <div className="hero-text">
          <h1 className="display">{SLIDES[slide].title}</h1>

          <p>{SLIDES[slide].text}</p>
        </div>
      </section>

      <div className="dots">
        {SLIDES.map((item, index) => (
          <button
            key={item.title}
            type="button"
            aria-label={`Show message ${index + 1}`}
            className={index === slide ? 'active' : ''}
            onClick={() => setSlide(index)}
          />
        ))}
      </div>

      <div className="steps">
        {STEPS.map((step) => (
          <Link to="/bookings" key={step.number} className={`step-card ${step.tone}`}>
            <span className="step-number">{step.number}</span>

            <h3>{step.title}</h3>

            <p>{step.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
