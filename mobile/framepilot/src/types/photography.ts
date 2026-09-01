export type ScenarioCategory =
  | 'people'
  | 'action'
  | 'nature'
  | 'low-light'
  | 'travel'
  | 'creative'
  | 'commercial'
  | 'video';

export type LightLevel = 'bright' | 'overcast' | 'golden' | 'indoor' | 'low' | 'night';
export type MotionLevel = 'still' | 'slow' | 'fast' | 'erratic';
export type CreativeIntent = 'freeze' | 'balanced' | 'motion';
export type SensorFormat = 'full-frame' | 'aps-c' | 'micro-four-thirds' | 'one-inch';

export type Scenario = {
  id: string;
  name: string;
  category: ScenarioCategory;
  icon: string;
  shortDescription: string;
  defaultLight: LightLevel;
  defaultMotion: MotionLevel;
  defaultIntent: CreativeIntent;
  aperture: [number, number];
  shutterDenominator: [number, number];
  shutterSeconds?: [number, number];
  isoMax: number;
  focalRange: [number, number];
  metering: string;
  focusMode: string;
  focusArea: string;
  subjectDetection: string;
  driveMode: string;
  whiteBalance: string;
  fileFormat: string;
  flash: string;
  stabilization: string;
  special: string[];
  video?: {
    frameRate: string;
    shutter: string;
    profile: string;
    audio: string;
  };
};

export type GearProfile = {
  cameraName: string;
  lensName: string;
  sensor: SensorFormat;
  focalLength: number;
  maxAperture: number;
  stabilizationStops: number;
  hasTripod: boolean;
  flashAvailable: boolean;
};

export type ShootingContext = {
  light: LightLevel;
  motion: MotionLevel;
  intent: CreativeIntent;
  handheld: boolean;
  flashAllowed: boolean;
  output: 'social' | 'standard' | 'large-print';
};

export type ParameterGroup = {
  title: string;
  icon: string;
  parameters: Array<{ label: string; value: string; reason: string }>;
};

export type Recommendation = {
  scenarioId: string;
  scenarioName: string;
  headline: string;
  aperture: string;
  shutter: string;
  iso: string;
  isoEstimate: number;
  groups: ParameterGroup[];
  checklist: string[];
  cautions: string[];
  generatedAt: string;
};

export type SavedSetup = {
  id: string;
  userId?: string;
  name: string;
  scenarioId: string;
  recommendation: Recommendation;
  context: ShootingContext;
  gear: GearProfile;
  createdAt: string;
};
