import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// --- Auth: build a Google OAuth2 access token from service account credentials ---

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID || '531731325';
const GA4_CLIENT_EMAIL = process.env.GA4_CLIENT_EMAIL || '';
const GA4_PRIVATE_KEY = (process.env.GA4_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const API_SECRET = process.env.GA4_API_SECRET || '';

function base64url(data: Buffer | string): string {
  const buf = typeof data === 'string' ? Buffer.from(data) : data;
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: GA4_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));

  const signInput = `${header}.${payload}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signInput);
  const signature = base64url(sign.sign(GA4_PRIVATE_KEY));
  const jwt = `${signInput}.${signature}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Token error ${resp.status}: ${err}`);
  }
  const data = await resp.json();
  return data.access_token;
}

// --- GA4 Data API wrapper ---

async function runGA4Report(body: object, token: string) {
  const resp = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`GA4 API error ${resp.status}: ${err}`);
  }
  return resp.json();
}

// --- Route handler ---

export async function GET(request: NextRequest) {
  // Simple secret check to prevent public access
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const report = request.nextUrl.searchParams.get('report') || 'funnel';
  const startDate = request.nextUrl.searchParams.get('start') || '7daysAgo';
  const endDate = request.nextUrl.searchParams.get('end') || 'today';

  try {
    if (!GA4_CLIENT_EMAIL || !GA4_PRIVATE_KEY) {
      return NextResponse.json({ error: 'GA4 credentials not configured' }, { status: 500 });
    }

    const token = await getAccessToken();

    if (report === 'funnel') {
      // Funnel report: all custom events with counts
      const data = await runGA4Report({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      }, token);

      return NextResponse.json({ report: 'funnel', dateRange: { startDate, endDate }, data });
    }

    if (report === 'traffic') {
      // Traffic sources
      const data = await runGA4Report({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
        metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 20,
      }, token);

      return NextResponse.json({ report: 'traffic', dateRange: { startDate, endDate }, data });
    }

    if (report === 'countries') {
      // Traffic by country
      const data = await runGA4Report({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 30,
      }, token);

      return NextResponse.json({ report: 'countries', dateRange: { startDate, endDate }, data });
    }

    if (report === 'pages') {
      // Pages report
      const data = await runGA4Report({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 20,
      }, token);

      return NextResponse.json({ report: 'pages', dateRange: { startDate, endDate }, data });
    }

    if (report === 'devices') {
      // Devices report
      const data = await runGA4Report({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }, token);

      return NextResponse.json({ report: 'devices', dateRange: { startDate, endDate }, data });
    }

    if (report === 'daily') {
      // Daily breakdown of events
      const data = await runGA4Report({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }, { name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
        limit: 500,
      }, token);

      return NextResponse.json({ report: 'daily', dateRange: { startDate, endDate }, data });
    }

    return NextResponse.json({ error: 'Unknown report type. Use: funnel, traffic, countries, pages, devices, daily' }, { status: 400 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
