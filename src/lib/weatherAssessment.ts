export type HardReason = 'official-warning' | 'thunderstorm' | 'heavy-rain' | 'strong-gust';
export type RainKind = 'dry' | 'uncertain' | 'drizzle' | 'light' | 'showers' | 'steady' | 'downpour' | 'thunderstorm';

export interface WeatherAssessmentInput {
  probability: number | null;
  precipitationMm: number | null;
  showersMm?: number | null;
  gustKmh: number | null;
  weatherCode: number | null;
  threshold: number;
  warningActive?: boolean;
}

export interface WeatherAssessment {
  riskScore: number;
  hardStop: boolean;
  hardReason: HardReason | null;
  kind: RainKind;
  label: string;
  headline: string;
  wetness: string;
  gear: string;
}

const isThunderstorm = (code: number) => code >= 95;
const isHeavyCode = (code: number) => [65, 67, 82].includes(code);
const isSteadyCode = (code: number) => code === 63;
const isShowerCode = (code: number) => [80, 81].includes(code);
const isLightCode = (code: number) => [61, 66].includes(code);
const isDrizzleCode = (code: number) => code >= 51 && code <= 57;

export function assessWeather(input: WeatherAssessmentInput): WeatherAssessment {
  const probability = input.probability ?? 0;
  const precipitationMm = input.precipitationMm ?? 0;
  const weatherCode = input.weatherCode ?? 0;
  const gustKmh = input.gustKmh ?? 0;
  const thunderstorm = isThunderstorm(weatherCode);
  const heavyRain = precipitationMm >= 2 || isHeavyCode(weatherCode);
  const strongGust = gustKmh >= 40;
  const hardReason: HardReason | null = input.warningActive
    ? 'official-warning'
    : thunderstorm
      ? 'thunderstorm'
      : heavyRain
        ? 'heavy-rain'
        : strongGust
          ? 'strong-gust'
          : null;

  let riskScore = probability;
  if (precipitationMm >= 2 || isHeavyCode(weatherCode)) riskScore = Math.max(riskScore, 85);
  else if (precipitationMm >= 0.5 || isSteadyCode(weatherCode) || isShowerCode(weatherCode) || isLightCode(weatherCode)) riskScore = Math.max(riskScore, 65);
  if (strongGust) riskScore = Math.max(riskScore, 70);
  if (thunderstorm) riskScore = Math.max(riskScore, 90);
  if (input.warningActive) riskScore = 100;

  let kind: RainKind = 'dry';
  if (thunderstorm) kind = 'thunderstorm';
  else if (isHeavyCode(weatherCode) || precipitationMm >= 2) kind = 'downpour';
  else if (isSteadyCode(weatherCode)) kind = 'steady';
  else if (isShowerCode(weatherCode) || (input.showersMm ?? 0) >= 0.1) kind = 'showers';
  else if (isLightCode(weatherCode) || precipitationMm >= 0.5) kind = 'light';
  else if (isDrizzleCode(weatherCode) || precipitationMm >= 0.1) kind = 'drizzle';
  else if (probability >= input.threshold) kind = 'uncertain';

  const copy: Record<RainKind, Pick<WeatherAssessment, 'label' | 'headline' | 'wetness' | 'gear'>> = {
    dry: { label: 'Kering', headline: 'Kering lagi. Boleh gerak.', wetness: 'Pakaian dijangka kekal kering untuk sela ini.', gear: 'Windbreaker ikut keselesaan.' },
    uncertain: { label: 'Hujan belum pasti', headline: 'Awan tengah buat keputusan.', wetness: 'Belum ada jumlah hujan diramal, tetapi peluangnya melepasi toleransi anda.', gear: 'Windbreaker pakai, raincoat letak paling atas.' },
    drizzle: { label: 'Renyai', headline: 'Renjis manja. Windbreaker cukup.', wetness: 'Bahu mungkin lembap; belum tahap kuyup.', gear: 'Windbreaker dan visor bersih sudah memadai.' },
    light: { label: 'Hujan ringan', headline: 'Hujan ringan. Raincoat nipis menang.', wetness: 'Tanpa lapisan kalis air, sampai nanti agak lembap.', gear: 'Raincoat nipis; windbreaker biasa mungkin kalah separuh jalan.' },
    showers: { label: 'Hujan sekejap-sekejap', headline: 'Hujan datang suka-suka.', wetness: 'Boleh kering di sini, basah pula dua simpang nanti.', gear: 'Raincoat mudah capai; hujan jenis ini tak suka beri notis.' },
    steady: { label: 'Hujan sederhana', headline: 'Hujan betul. Raincoat penuh.', wetness: 'Beberapa minit tanpa set lengkap, memang lencun.', gear: 'Jaket dan seluar hujan. Zip sampai atas.' },
    downpour: { label: 'Hujan lebat', headline: 'Hujan lebat. Mandi di rumah saja.', wetness: 'Raincoat pun mungkin angkat tangan; pandangan dan cengkaman turut merosot.', gear: 'Tunggu reda. Set hujan lengkap bukan lesen untuk redah.' },
    thunderstorm: { label: 'Ribut petir', headline: 'Kilat ada. Lepak dulu.', wetness: 'Isunya bukan basah sahaja—kilat dan angin menjadikan perjalanan tak berbaloi.', gear: 'Berteduh dan semak semula. Baju hujan bukan perisai petir.' },
  };

  const safetyCopy: Partial<Record<HardReason, Pick<WeatherAssessment, 'headline' | 'wetness' | 'gear'>>> = {
    'official-warning': { headline: 'Amaran cuaca aktif. Jangan hero.', wetness: 'Keadaan laluan boleh berubah cepat walaupun tempat anda masih nampak tenang.', gear: 'Tunggu amaran tamat dan semak semula sebelum bergerak.' },
    'heavy-rain': { headline: 'Hujan lebat. Mandi di rumah saja.', wetness: 'Anda berisiko lencun; pandangan dan cengkaman juga merosot.', gear: 'Tunggu reda. Set hujan lengkap bukan lesen untuk redah.' },
    'strong-gust': { headline: 'Angin kuat. Motor bukan wau.', wetness: 'Isu utama sekarang ialah kestabilan motor, bukan setakat basah.', gear: 'Tunggu angin reda dan semak semula sebelum bergerak.' },
  };
  return { riskScore: Math.min(100, riskScore), hardStop: hardReason !== null, hardReason, kind, ...copy[kind], ...(hardReason ? safetyCopy[hardReason] : undefined) };
}
