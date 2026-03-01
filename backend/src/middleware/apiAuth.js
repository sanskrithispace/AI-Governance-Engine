// In-memory daily usage tracking — resets at midnight UTC
const usage = {};

export const API_KEYS = {
  key_free_demo:       { tier: 'free',       limit: 10 },
  key_pro_demo:        { tier: 'pro',        limit: 1000 },
  key_enterprise_demo: { tier: 'enterprise', limit: Infinity },
};

function nextMidnightUTC() {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.getTime();
}

function getRecord(key) {
  const now = Date.now();
  if (!usage[key] || now >= usage[key].resetAt) {
    usage[key] = { count: 0, resetAt: nextMidnightUTC() };
  }
  return usage[key];
}

export function apiAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      error: 'Missing API key',
      hint: 'Pass your key in the x-api-key header. Demo keys: key_free_demo | key_pro_demo | key_enterprise_demo',
    });
  }

  const config = API_KEYS[apiKey];
  if (!config) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const record = getRecord(apiKey);

  if (config.limit !== Infinity && record.count >= config.limit) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      tier: config.tier,
      limit: config.limit,
      used: record.count,
      reset_at: new Date(record.resetAt).toISOString(),
    });
  }

  record.count++;

  // Attach metadata for downstream use
  req.apiTier  = config.tier;
  req.apiUsage = {
    tier:      config.tier,
    limit:     config.limit === Infinity ? 'unlimited' : config.limit,
    used:      record.count,
    remaining: config.limit === Infinity ? 'unlimited' : config.limit - record.count,
    reset_at:  new Date(record.resetAt).toISOString(),
  };

  // Expose rate-limit state in response headers
  res.set({
    'X-RateLimit-Tier':      config.tier,
    'X-RateLimit-Limit':     config.limit === Infinity ? 'unlimited' : String(config.limit),
    'X-RateLimit-Used':      String(record.count),
    'X-RateLimit-Remaining': config.limit === Infinity ? 'unlimited' : String(config.limit - record.count),
    'X-RateLimit-Reset':     new Date(record.resetAt).toISOString(),
  });

  next();
}

/** Returns current usage snapshot for all keys (used by admin dashboard) */
export function getUsageStats() {
  return Object.entries(API_KEYS).map(([key, config]) => {
    const record = usage[key] ?? { count: 0, resetAt: null };
    return {
      key,
      tier:      config.tier,
      limit:     config.limit === Infinity ? 'unlimited' : config.limit,
      used:      record.count,
      remaining: config.limit === Infinity ? 'unlimited' : Math.max(0, config.limit - record.count),
      reset_at:  record.resetAt ? new Date(record.resetAt).toISOString() : null,
    };
  });
}
