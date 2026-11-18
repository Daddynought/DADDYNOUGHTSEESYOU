require('dotenv').config();
const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const LIMIT = parseInt(process.env.RATE_LIMIT_PER_MINUTE, 10) || 15;
const PROVIDER = (process.env.PRESENCE_PROVIDER || 'none').toLowerCase();

app.set('trust proxy', 1); // needed behind Replit/Render proxies
app.disable('x-powered-by');
app.use(express.json({ limit: '2kb' }));

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

const COUNTRIES = [
  ['US/Canada', '1'], ['United Kingdom', '44'], ['Nigeria', '234'], ['Ghana', '233'],
  ['Kenya', '254'], ['South Africa', '27'], ['Egypt', '20'], ['Morocco', '212'],
  ['Tanzania', '255'], ['Uganda', '256'], ['Ethiopia', '251'], ['India', '91'],
  ['Pakistan', '92'], ['Bangladesh', '880'], ['Indonesia', '62'], ['Philippines', '63'],
  ['Malaysia', '60'], ['Singapore', '65'], ['China', '86'], ['Japan', '81'],
  ['South Korea', '82'], ['Australia', '61'], ['New Zealand', '64'], ['Germany', '49'],
  ['France', '33'], ['Italy', '39'], ['Spain', '34'], ['Portugal', '351'],
  ['Netherlands', '31'], ['Turkey', '90'], ['Saudi Arabia', '966'], ['UAE', '971'],
  ['Brazil', '55'], ['Mexico', '52'], ['Argentina', '54'], ['Colombia', '57'], ['Russia', '7']
].map(([name, code]) => ({ name, code }));

const LIMITATION =
  'WhatsApp does not offer any official, authorized way to see whether another person is online. ' +
  'Their "online" and "last seen" are private and controlled by their own settings. ' +
  'This app will not guess, fake, or bypass that, so the result is UNKNOWN.';

function formatNumber(cc, national) {
  const groups = national.match(/.{1,3}/g) || [national];
  return `+${cc} ${groups.join(' ')}`;
}

// Provider hook: only return ONLINE/OFFLINE from a real, authorized, verifiable source.
async function lookupPresence(/* e164 */) {
  if (PROVIDER === 'none') {
    return { status: 'UNKNOWN', verified: false, reason: LIMITATION };
  }
  // Unknown provider configured: stay honest.
  return {
    status: 'UNKNOWN', verified: false,
    reason: 'No authorized presence provider is available. ' + LIMITATION
  };
}

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests. Please wait a minute and try again.' }
});

app.get('/api/countries', (req, res) => res.json({ ok: true, countries: COUNTRIES }));
app.get('/api/health', (req, res) => res.json({ ok: true, provider: PROVIDER }));

app.post('/api/check', limiter, async (req, res) => {
  try {
    const cc = String((req.body && req.body.countryCode) || '').replace(/\D/g, '');
    let number = String((req.body && req.body.number) || '').replace(/[\s\-().]/g, '');

    if (!/^\d{1,3}$/.test(cc)) return res.status(400).json({ ok: false, error: 'Choose a valid country code.' });
    if (!/^\d+$/.test(number)) return res.status(400).json({ ok: false, error: 'Use digits only in the phone number.' });
    number = number.replace(/^0+/, ''); // drop leading trunk zero
    if (number.length < 4 || cc.length + number.length > 15) {
      return res.status(400).json({ ok: false, error: 'That number length is not valid. Check it and try again.' });
    }

    const e164 = `+${cc}${number}`;
    const result = await lookupPresence(e164);
    res.json({
      ok: true,
      e164,
      formatted: formatNumber(cc, number),
      status: result.status,
      verified: result.verified,
      reason: result.reason,
      checkedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('check failed:', err.message);
    res.status(500).json({ ok: false, error: 'Something went wrong on the server. Please try again.' });
  }
});

app.use('/api', (req, res) => res.status(404).json({ ok: false, error: 'Unknown endpoint.' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ ok: false, error: 'Invalid request.' });
});

app.listen(PORT, '0.0.0.0', () => console.log(`Running on port ${PORT}`));
