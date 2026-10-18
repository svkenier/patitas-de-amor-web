import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp-up: 0 a 20 usuarios virtuales
    { duration: '1m',  target: 50 },  // Meseta sostenida: 50 usuarios
    { duration: '30s', target: 100 }, // Pico / Spike: 100 usuarios concurrentes
    { duration: '30s', target: 0 },   // Ramp-down gradual
  ],
  thresholds: {
    'http_req_duration': ['p(95)<350', 'p(99)<700'], // 95% de requests bajo 350ms (Edge cache hit)
    'errors': ['rate<0.01'],                          // Menos del 1% de error general
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://patitasdeamorbqto.com';

export default function () {
  const endpoints = [
    { url: `${BASE_URL}/`, name: 'Home_HTML' },
    { url: `${BASE_URL}/api/public/pets`, name: 'API_Pets' },
    { url: `${BASE_URL}/api/public/announcements`, name: 'API_Announcements' },
    { url: `${BASE_URL}/api/settings`, name: 'API_Settings' },
  ];

  for (const ep of endpoints) {
    const res = http.get(ep.url, {
      tags: { name: ep.name },
      headers: {
        'Accept-Encoding': 'gzip, br',
        'User-Agent': 'k6-load-test/1.0',
      },
    });

    const isOk = check(res, {
      [`${ep.name} status is 200`]: (r) => r.status === 200,
      [`${ep.name} has cache header`]: (r) => {
        if (ep.url.includes('/api/public/')) {
          const cc = r.headers['Cache-Control'] || r.headers['cache-control'] || '';
          return cc.includes('public') && cc.includes('s-maxage');
        }
        return true;
      },
    });

    errorRate.add(!isOk);
  }

  sleep(1);
}
