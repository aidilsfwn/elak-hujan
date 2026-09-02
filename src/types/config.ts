export interface Location {
  name: string;
  lat: number;
  lon: number;
  state: string;
}

export interface TimeWindow {
  start: string; // "08:00"
  end: string;   // "09:00"
}

export interface UserConfig {
  homeLocation: Location;
  officeLocation: Location;
  morningWindow: TimeWindow;
  eveningWindow: TimeWindow;
  officeDaysPerWeek: number;
  unavailableDays: string[]; // ["monday", "tuesday", ...]
  rainThreshold: number;
  onboardingComplete: boolean;
  configVersion: number;
}
