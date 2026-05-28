import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

const baseUrl = process.env.BASE_URL || 'http://localhost:3000/api/v1';
const reportsDir = path.resolve('reports');

const responseRounds = Number(process.env.RESPONSE_ROUNDS || 50);
const stressDurationMs = Number(process.env.STRESS_DURATION_MS || 10000);
const stressStages = (process.env.STRESS_STAGES || '1,10,25,50,100')
  .split(',')
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value) && value > 0);

const publicEndpoints = [
  { name: 'Healthcheck', method: 'GET', path: '/health' },
  { name: 'List Bahan Baku', method: 'GET', path: '/bahan-baku?page=1&limit=10', auth: true },
  { name: 'Get Bahan Baku by ID', method: 'GET', path: '/bahan-baku/1', auth: true },
  { name: 'List Suppliers', method: 'GET', path: '/suppliers?page=1&limit=10', auth: true },
  { name: 'Get Supplier by ID', method: 'GET', path: '/suppliers/1', auth: true },
  { name: 'List Menus', method: 'GET', path: '/menus?page=1&limit=10', auth: true },
  { name: 'Get Menu by ID', method: 'GET', path: '/menus/1', auth: true },
  { name: 'List Resep Menu', method: 'GET', path: '/menus/1/resep', auth: true },
];

const authEndpoints = [
  {
    name: 'Login Admin',
    method: 'POST',
    path: '/auth/login',
    body: { username: 'admin', password: 'admin123' },
  },
  {
    name: 'Login Kasir',
    method: 'POST',
    path: '/auth/login',
    body: { username: 'kasir1', password: 'kasir123' },
  },
];

function percentile(sortedValues, percentileValue) {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((percentileValue / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
}

function stats(samples, durationMs) {
  const durations = samples.map((sample) => sample.durationMs).sort((a, b) => a - b);
  const errors = samples.filter((sample) => !sample.ok).length;
  const total = samples.length;
  const sum = durations.reduce((acc, value) => acc + value, 0);

  return {
    count: total,
    errors,
    errorRate: total ? Number(((errors / total) * 100).toFixed(2)) : 0,
    throughputRps: durationMs ? Number(((total / durationMs) * 1000).toFixed(2)) : 0,
    min: total ? Number(durations[0].toFixed(2)) : 0,
    avg: total ? Number((sum / total).toFixed(2)) : 0,
    p50: Number(percentile(durations, 50).toFixed(2)),
    p90: Number(percentile(durations, 90).toFixed(2)),
    p95: Number(percentile(durations, 95).toFixed(2)),
    p99: Number(percentile(durations, 99).toFixed(2)),
    max: total ? Number(durations[durations.length - 1].toFixed(2)) : 0,
  };
}

async function timedRequest(endpoint, token) {
  const headers = { Accept: 'application/json' };
  const options = { method: endpoint.method, headers };

  if (endpoint.body) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(endpoint.body);
  }

  if (endpoint.auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const started = performance.now();

  try {
    const response = await fetch(`${baseUrl}${endpoint.path}`, options);
    await response.arrayBuffer();
    const durationMs = performance.now() - started;

    return {
      endpoint: endpoint.name,
      method: endpoint.method,
      path: endpoint.path,
      status: response.status,
      ok: response.status >= 200 && response.status < 400,
      durationMs: Number(durationMs.toFixed(2)),
    };
  } catch (error) {
    const durationMs = performance.now() - started;

    return {
      endpoint: endpoint.name,
      method: endpoint.method,
      path: endpoint.path,
      status: 0,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      durationMs: Number(durationMs.toFixed(2)),
    };
  }
}

async function getKasirToken() {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'kasir1', password: 'kasir123' }),
  });

  const json = await response.json();
  return json?.data?.token || '';
}

async function runResponseTimeTest(token) {
  const endpoints = [
    ...authEndpoints,
    { name: 'Get Me', method: 'GET', path: '/auth/me', auth: true },
    ...publicEndpoints,
  ];
  const samples = [];
  const started = performance.now();

  for (let round = 0; round < responseRounds; round += 1) {
    for (const endpoint of endpoints) {
      samples.push(await timedRequest(endpoint, token));
    }
  }

  return {
    startedAt: new Date().toISOString(),
    durationMs: Number((performance.now() - started).toFixed(2)),
    rounds: responseRounds,
    samples,
    summary: stats(samples, performance.now() - started),
    byEndpoint: Object.fromEntries(
      endpoints.map((endpoint) => {
        const endpointSamples = samples.filter((sample) => sample.endpoint === endpoint.name);
        return [endpoint.name, stats(endpointSamples, 0)];
      }),
    ),
  };
}

async function runStressStage(concurrency, token) {
  const endpoints = [
    { name: 'Get Me', method: 'GET', path: '/auth/me', auth: true },
    ...publicEndpoints,
  ];
  const samples = [];
  const started = performance.now();
  const deadline = started + stressDurationMs;

  async function worker(workerId) {
    let index = workerId % endpoints.length;
    while (performance.now() < deadline) {
      const endpoint = endpoints[index % endpoints.length];
      const sample = await timedRequest(endpoint, token);
      samples.push({ ...sample, concurrency });
      index += concurrency;
    }
  }

  await Promise.all(Array.from({ length: concurrency }, (_, index) => worker(index)));

  const durationMs = performance.now() - started;

  return {
    concurrency,
    durationMs: Number(durationMs.toFixed(2)),
    samples,
    summary: stats(samples, durationMs),
  };
}

async function runStressTest(token) {
  const stages = [];
  const started = performance.now();

  for (const concurrency of stressStages) {
    console.log(`Running stress stage: concurrency=${concurrency}, duration=${stressDurationMs}ms`);
    stages.push(await runStressStage(concurrency, token));
  }

  const samples = stages.flatMap((stage) => stage.samples);

  return {
    startedAt: new Date().toISOString(),
    durationMs: Number((performance.now() - started).toFixed(2)),
    stageDurationMs: stressDurationMs,
    stages: stages.map((stage) => ({
      concurrency: stage.concurrency,
      durationMs: stage.durationMs,
      summary: stage.summary,
    })),
    samples,
    summary: stats(samples, performance.now() - started),
  };
}

function lineChartSvg({ title, xLabel, yLabel, series, width = 920, height = 520 }) {
  const margin = { top: 64, right: 28, bottom: 72, left: 76 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const allPoints = series.flatMap((item) => item.points);
  const xValues = allPoints.map((point) => point.x);
  const yValues = allPoints.map((point) => point.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const maxY = Math.max(...yValues) * 1.15 || 1;
  const colors = ['#2563eb', '#dc2626', '#16a34a', '#9333ea'];

  const xScale = (x) => margin.left + ((x - minX) / Math.max(1, maxX - minX)) * chartWidth;
  const yScale = (y) => margin.top + chartHeight - (y / maxY) * chartHeight;
  const xTicks = [...new Set(xValues)].sort((a, b) => a - b);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((value) => maxY * value);

  const paths = series
    .map((item, index) => {
      const pathData = item.points
        .map((point, pointIndex) => `${pointIndex === 0 ? 'M' : 'L'} ${xScale(point.x).toFixed(2)} ${yScale(point.y).toFixed(2)}`)
        .join(' ');
      const circles = item.points
        .map((point) => `<circle cx="${xScale(point.x).toFixed(2)}" cy="${yScale(point.y).toFixed(2)}" r="4" fill="${colors[index % colors.length]}"><title>${item.name}: ${point.y}</title></circle>`)
        .join('');
      return `<path d="${pathData}" fill="none" stroke="${colors[index % colors.length]}" stroke-width="3"/>${circles}`;
    })
    .join('');

  const legend = series
    .map((item, index) => {
      const x = margin.left + index * 170;
      return `<g transform="translate(${x}, ${height - 28})"><rect width="14" height="14" fill="${colors[index % colors.length]}"/><text x="22" y="12" font-size="13" fill="#111827">${item.name}</text></g>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="${margin.left}" y="36" font-size="24" font-weight="700" fill="#111827">${title}</text>
  <line x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight}" stroke="#111827"/>
  <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}" stroke="#111827"/>
  ${yTicks
    .map((tick) => `<g><line x1="${margin.left - 6}" y1="${yScale(tick).toFixed(2)}" x2="${margin.left + chartWidth}" y2="${yScale(tick).toFixed(2)}" stroke="#e5e7eb"/><text x="${margin.left - 12}" y="${(yScale(tick) + 4).toFixed(2)}" text-anchor="end" font-size="12" fill="#374151">${tick.toFixed(0)}</text></g>`)
    .join('')}
  ${xTicks
    .map((tick) => `<g><line x1="${xScale(tick).toFixed(2)}" y1="${margin.top + chartHeight}" x2="${xScale(tick).toFixed(2)}" y2="${margin.top + chartHeight + 6}" stroke="#111827"/><text x="${xScale(tick).toFixed(2)}" y="${margin.top + chartHeight + 24}" text-anchor="middle" font-size="12" fill="#374151">${tick}</text></g>`)
    .join('')}
  <text x="${margin.left + chartWidth / 2}" y="${height - 42}" text-anchor="middle" font-size="14" fill="#111827">${xLabel}</text>
  <text transform="translate(22 ${margin.top + chartHeight / 2}) rotate(-90)" text-anchor="middle" font-size="14" fill="#111827">${yLabel}</text>
  ${paths}
  ${legend}
</svg>`;
}

function barChartSvg({ title, yLabel, bars, width = 920, height = 560 }) {
  const margin = { top: 64, right: 32, bottom: 142, left: 76 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const maxY = Math.max(...bars.map((bar) => bar.value)) * 1.15 || 1;
  const barGap = 12;
  const barWidth = Math.max(18, (chartWidth - barGap * (bars.length - 1)) / bars.length);
  const yScale = (y) => margin.top + chartHeight - (y / maxY) * chartHeight;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((value) => maxY * value);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="${margin.left}" y="36" font-size="24" font-weight="700" fill="#111827">${title}</text>
  <line x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight}" stroke="#111827"/>
  <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}" stroke="#111827"/>
  ${yTicks
    .map((tick) => `<g><line x1="${margin.left - 6}" y1="${yScale(tick).toFixed(2)}" x2="${margin.left + chartWidth}" y2="${yScale(tick).toFixed(2)}" stroke="#e5e7eb"/><text x="${margin.left - 12}" y="${(yScale(tick) + 4).toFixed(2)}" text-anchor="end" font-size="12" fill="#374151">${tick.toFixed(0)}</text></g>`)
    .join('')}
  ${bars
    .map((bar, index) => {
      const x = margin.left + index * (barWidth + barGap);
      const y = yScale(bar.value);
      const heightValue = margin.top + chartHeight - y;
      return `<g><rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barWidth.toFixed(2)}" height="${heightValue.toFixed(2)}" fill="#2563eb"><title>${bar.label}: ${bar.value} ms</title></rect><text x="${(x + barWidth / 2).toFixed(2)}" y="${(y - 8).toFixed(2)}" text-anchor="middle" font-size="11" fill="#111827">${bar.value}</text><text transform="translate(${(x + barWidth / 2).toFixed(2)} ${margin.top + chartHeight + 12}) rotate(55)" text-anchor="start" font-size="12" fill="#374151">${bar.label}</text></g>`;
    })
    .join('')}
  <text transform="translate(22 ${margin.top + chartHeight / 2}) rotate(-90)" text-anchor="middle" font-size="14" fill="#111827">${yLabel}</text>
</svg>`;
}

function writeReport(responseTest, stressTest) {
  fs.mkdirSync(reportsDir, { recursive: true });

  const responseBars = Object.entries(responseTest.byEndpoint).map(([name, endpointStats]) => ({
    label: name,
    value: endpointStats.p95,
  }));

  const stressPoints = stressTest.stages.map((stage) => ({
    x: stage.concurrency,
    y: stage.summary.p95,
  }));

  const stressAvgPoints = stressTest.stages.map((stage) => ({
    x: stage.concurrency,
    y: stage.summary.avg,
  }));

  fs.writeFileSync(
    path.join(reportsDir, 'response-time-chart.svg'),
    barChartSvg({
      title: 'Response Time Test - p95 per Endpoint',
      yLabel: 'p95 response time (ms)',
      bars: responseBars,
    }),
  );

  fs.writeFileSync(
    path.join(reportsDir, 'stress-test-chart.svg'),
    lineChartSvg({
      title: 'Stress Test - Response Time by Concurrency',
      xLabel: 'Concurrent workers',
      yLabel: 'Response time (ms)',
      series: [
        { name: 'p95', points: stressPoints },
        { name: 'avg', points: stressAvgPoints },
      ],
    }),
  );

  fs.writeFileSync(
    path.join(reportsDir, 'api-performance-results.json'),
    JSON.stringify({ baseUrl, responseTest, stressTest }, null, 2),
  );

  const markdown = `# POS API Performance Test Report

Tanggal test: ${new Date().toISOString()}
Base URL: \`${baseUrl}\`

## Response Time Test

Skenario: ${responseRounds} ronde sequential untuk endpoint utama.

| Metric | Value |
| --- | ---: |
| Total request | ${responseTest.summary.count} |
| Error | ${responseTest.summary.errors} |
| Error rate | ${responseTest.summary.errorRate}% |
| Avg | ${responseTest.summary.avg} ms |
| p50 | ${responseTest.summary.p50} ms |
| p90 | ${responseTest.summary.p90} ms |
| p95 | ${responseTest.summary.p95} ms |
| p99 | ${responseTest.summary.p99} ms |
| Max | ${responseTest.summary.max} ms |

Grafik: [response-time-chart.svg](response-time-chart.svg)

| Endpoint | Count | Error | Avg | p95 | p99 | Max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
${Object.entries(responseTest.byEndpoint)
  .map(([name, item]) => `| ${name} | ${item.count} | ${item.errors} | ${item.avg} ms | ${item.p95} ms | ${item.p99} ms | ${item.max} ms |`)
  .join('\n')}

## Stress Test

Skenario: concurrency bertahap \`${stressStages.join(', ')}\`, durasi ${stressDurationMs / 1000} detik per stage.

| Metric | Value |
| --- | ---: |
| Total request | ${stressTest.summary.count} |
| Error | ${stressTest.summary.errors} |
| Error rate | ${stressTest.summary.errorRate}% |
| Avg | ${stressTest.summary.avg} ms |
| p50 | ${stressTest.summary.p50} ms |
| p90 | ${stressTest.summary.p90} ms |
| p95 | ${stressTest.summary.p95} ms |
| p99 | ${stressTest.summary.p99} ms |
| Max | ${stressTest.summary.max} ms |

Grafik: [stress-test-chart.svg](stress-test-chart.svg)

| Concurrency | Requests | RPS | Error | Error Rate | Avg | p95 | p99 | Max |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${stressTest.stages
  .map((stage) => `| ${stage.concurrency} | ${stage.summary.count} | ${stage.summary.throughputRps} | ${stage.summary.errors} | ${stage.summary.errorRate}% | ${stage.summary.avg} ms | ${stage.summary.p95} ms | ${stage.summary.p99} ms | ${stage.summary.max} ms |`)
  .join('\n')}

## Catatan

- Stress test memakai endpoint GET dan \`GET /auth/me\` agar tidak mengubah data.
- Login tetap diuji di response time test, tetapi tidak dimasukkan ke stress test agar hasil stress tidak didominasi biaya hashing password.
- File data mentah: [api-performance-results.json](api-performance-results.json)
`;

  fs.writeFileSync(path.join(reportsDir, 'API_PERFORMANCE_REPORT.md'), markdown);
}

async function main() {
  console.log(`Base URL: ${baseUrl}`);
  console.log('Getting auth token...');
  const token = await getKasirToken();
  if (!token) {
    throw new Error('Unable to get kasir token');
  }

  console.log('Running response time test...');
  const responseTest = await runResponseTimeTest(token);

  console.log('Running stress test...');
  const stressTest = await runStressTest(token);

  writeReport(responseTest, stressTest);

  console.log('Performance test completed.');
  console.log(`Report: ${path.join(reportsDir, 'API_PERFORMANCE_REPORT.md')}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
