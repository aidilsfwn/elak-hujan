import { expect, test, type Page } from '@playwright/test';

const config = {
  homeLocation: { name: 'Kuala Lumpur, Malaysia', lat: 3.139, lon: 101.6869, state: 'W.P. Kuala Lumpur' },
  officeLocation: { name: 'Putrajaya, Malaysia', lat: 2.9264, lon: 101.6964, state: 'W.P. Putrajaya' },
  morningWindow: { start: '08:00', end: '09:00' }, eveningWindow: { start: '17:00', end: '18:00' },
  officeDaysPerWeek: 3, preferredDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], rainThreshold: 40,
  onboardingComplete: true, configVersion: 2,
};

function dateRange(): string[] {
  const result: string[] = [];
  const start = new Date(2026, 7, 31);
  for (let day = 0; day < 10; day++) {
    const date = new Date(start); date.setDate(start.getDate() + day);
    const prefix = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    for (let hour = 0; hour < 24; hour++) result.push(`${prefix}T${String(hour).padStart(2, '0')}:00`);
  }
  return result;
}

async function mockApis(page: Page) {
  const times = dateRange();
  const dayRisk: Record<string, number> = { '2026-08-31': 70, '2026-09-01': 60, '2026-09-02': 20, '2026-09-03': 50, '2026-09-04': 30, '2026-09-07': 10 };
  const probabilities = times.map((time) => {
    const date = time.slice(0, 10); const hour = Number(time.slice(11, 13));
    if (date === '2026-08-31' && hour >= 17 && hour <= 21) return ({ 17: 70, 18: 60, 19: 20, 20: 10, 21: 5 } as Record<number, number>)[hour];
    return hour === 9 || hour === 18 ? (dayRisk[date] ?? 25) : 5;
  });
  const weather = (index: number) => ({ latitude: 3.1 - index * .04, longitude: 101.68, timezone: 'Asia/Kuala_Lumpur', utc_offset_seconds: 28800, current: { time: '2026-08-31T14:00', interval: 900, temperature_2m: 31, precipitation: 0, rain: 0, showers: 0, weather_code: 1, wind_gusts_10m: 12 }, hourly: { time: times, precipitation_probability: probabilities, precipitation: times.map(() => 0), showers: times.map(() => 0), weather_code: times.map(() => 1), temperature_2m: times.map(() => 30), wind_gusts_10m: times.map(() => 12), visibility: times.map(() => 20000) } });

  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: [0, 1, 2, 3, 4].map(weather) }));
  await page.route('https://api.data.gov.my/**', (route) => route.fulfill({ json: [{ heading_en: 'No Advisory', heading_bm: 'Tiada Nasihat', warning_issue: { issued: '2026-08-31T10:30:00', title_en: 'No Advisory' } }, { heading_en: 'Thunderstorm Warning', text_en: 'Thunderstorms in Johor' }] }));
  await page.route('**/api/met/locations**', (route) => route.fulfill({ json: { metadata: { resultset: { count: 1, offset: 0, limit: 100 } }, results: [{ id: 'LOCATION:237', name: 'PUTRAJAYA', latitude: 2.91667, longitude: 101.7 }] } }));
  await page.route('**/api/met/data**', (route) => route.fulfill({ json: { metadata: { resultset: { count: 3, offset: 0, limit: 50 } }, results: ['FGM', 'FGA', 'FGN'].map((datatype) => ({ locationid: 'LOCATION:237', locationname: 'PUTRAJAYA', date: '2026-08-31', datatype, value: 'Tiada hujan', latitude: 2.91667, longitude: 101.7, attributes: {} })) } }));
}

test('weekly and leave flows show route-aware, actionable advice', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-01T06:00:00.000Z'));
  await mockApis(page);
  await page.addInitScript((stored) => localStorage.setItem('elakhujan_config', JSON.stringify(stored)), config);
  await page.goto('/');

  await expect(page.getByText('Tiada Nasihat')).toHaveCount(0);
  await expect(page.getByText('Risiko terendah')).toBeVisible();
  await expect(page.getByRole('button', { name: /Minggu ini.*3 hari disyorkan/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText(/Adakah anda ke pejabat pada Isnin/)).toBeVisible();
  await page.getByRole('button', { name: 'Ya, saya pergi' }).click();
  await expect(page.getByText('Adakah anda ke pejabat hari ini?')).toBeVisible();
  await page.getByRole('button', { name: 'Ya, saya pergi' }).click();
  await expect(page.getByText('1 hari lagi diperlukan')).toBeVisible();
  await expect(page.getByRole('button', { name: /Minggu ini.*1 hari disyorkan/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.week-lead h2')).toHaveText('Rabu');
  await page.getByRole('button', { name: /Minggu depan.*3 hari disyorkan/ }).click();
  await expect(page.locator('.week-lead h2')).toHaveText('Isnin');
  await expect(page.getByText('Keyakinan rendah', { exact: false }).first()).toBeVisible();

  await page.getByRole('link', { name: 'Sekarang', exact: true }).click();
  await expect(page.getByText('16:00', { exact: true }).first()).toBeVisible();
  await expect(page.locator('.hour-ribbon-values .is-selected')).toContainText('16:00');
  await expect(page.getByText('seluruh laluan', { exact: false })).toBeVisible();
});

test('onboarding requires explicit verified locations', async ({ page }) => {
  await page.route('https://nominatim.openstreetmap.org/**', (route) => {
    const query = new URL(route.request().url()).searchParams.get('q') ?? '';
    const putrajaya = query.toLowerCase().includes('putra');
    return route.fulfill({ json: [{ place_id: putrajaya ? 2 : 1, display_name: putrajaya ? 'Putrajaya, Malaysia' : 'Kuala Lumpur, Malaysia', lat: putrajaya ? '2.9264' : '3.139', lon: putrajaya ? '101.6964' : '101.6869', address: { state: putrajaya ? 'Federal Territory of Putrajaya' : 'Federal Territory of Kuala Lumpur' } }] });
  });
  await page.goto('/onboarding');
  const next = page.getByRole('button', { name: 'Seterusnya' });
  await expect(next).toBeDisabled();

  const inputs = page.getByRole('textbox');
  await inputs.nth(0).fill('Kuala Lumpur'); await page.getByRole('button', { name: 'Cari' }).nth(0).click(); await page.getByRole('button', { name: /Kuala Lumpur, Malaysia/ }).click();
  await inputs.nth(1).fill('Putrajaya'); await page.getByRole('button', { name: 'Cari' }).nth(1).click(); await page.getByRole('button', { name: /Putrajaya, Malaysia/ }).click();
  await expect(next).toBeEnabled();
  await next.click();
  await expect(page.getByText('Perjalanan pagi')).toBeVisible();
});
