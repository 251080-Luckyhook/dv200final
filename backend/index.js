require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoStore = require('./mongoStore');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Add it to your .env file or Heroku config vars.');

  process.exit(1);
}

const app = express();

// Google sign-in opens a popup, so the opener policy has to allow popups
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
);

app.use(cors());

app.use(express.json({ limit: '1mb' }));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/slots', require('./routes/slots'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/supplies', require('./routes/supplies'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/users', require('./routes/users'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/feedback', require('./routes/feedback'));

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'That endpoint does not exist.' });
});

// In production the Express server also serves the built React app
const frontendBuild = path.join(__dirname, '..', 'frontend', 'dist');

if (fs.existsSync(frontendBuild)) {
  app.use(express.static(frontendBuild));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
}

app.use((error, req, res, next) => {
  console.error(error);

  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
});

const port = process.env.PORT || 5000;

async function startServer() {
  try {
    await mongoStore.connectMongo();

    app.listen(port, () => {
      console.log(`Ngwana Huis server running on port ${port}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);

    try {
      await mongoStore.closeMongo();
    } catch (closeError) {
      console.error('Could not close MongoDB after startup failure:', closeError);
    }

    process.exitCode = 1;
  }
}

startServer();
