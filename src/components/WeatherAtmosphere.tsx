import type { RiskLevel } from '@/lib/risk';

export function WeatherAtmosphere({ risk, thunderstorm, variant = 'week' }: { risk: RiskLevel; thunderstorm: boolean; variant?: 'week' | 'verdict' }) {
  return <div className={`weather-atmosphere is-${variant} weather-${risk} ${thunderstorm ? 'has-thunder' : ''}`} aria-hidden="true">
    <svg viewBox="0 0 360 260" role="presentation">
      <circle className="weather-halo" cx="214" cy="118" r="104" />
      <g className="weather-sun">
        <circle cx="245" cy="76" r="39" />
        <path d="M245 18v-12M245 146v-12M187 76h-12M315 76h-12M204 35l-9-9M295 126l-9-9M204 117l-9 9M295 26l-9 9" />
      </g>
      <g className="weather-cloud weather-cloud-back">
        <path d="M104 129c3-26 24-44 51-44 22 0 41 13 49 32 6-4 14-6 22-6 23 0 42 18 43 41H104c-15 0-27-10-27-23s12-23 27-23" />
      </g>
      <g className="weather-cloud weather-cloud-front">
        <path d="M113 153c4-31 29-53 61-53 27 0 49 16 58 39 8-6 18-9 28-9 29 0 52 22 53 50H94c-18 0-32-12-32-28s14-28 32-28c7 0 13 2 19 5" />
      </g>
      <g className="weather-rain weather-rain-soft">
        <path d="M126 195l-9 18M178 195l-9 18M230 195l-9 18M282 195l-9 18" />
      </g>
      <g className="weather-rain weather-rain-heavy">
        <path d="M101 204l-13 27M151 204l-13 27M201 204l-13 27M251 204l-13 27M301 204l-13 27" />
      </g>
      <path className="weather-lightning" d="M213 181h31l-21 28h19l-43 45 13-34h-21z" />
      <g className="weather-wind">
        <path d="M76 185c28 0 35-15 58-15 17 0 27 7 43 7M91 207c18 0 27-9 41-9 11 0 18 4 27 4" />
      </g>
    </svg>
  </div>;
}
