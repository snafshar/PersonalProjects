import type { GearProfile, LightLevel, Recommendation, Scenario, ShootingContext } from '@/types/photography';

export const defaultGear: GearProfile = {
  cameraName: 'Full-frame mirrorless', lensName: 'Standard zoom', sensor: 'full-frame', focalLength: 85,
  maxAperture: 2.8, stabilizationStops: 4, hasTripod: false, flashAvailable: false,
};

export function defaultContext(scenario: Scenario): ShootingContext {
  return { light: scenario.defaultLight, motion: scenario.defaultMotion, intent: scenario.defaultIntent, handheld: !scenario.shutterSeconds, flashAllowed: true, output: 'standard' };
}

const cropFactor = { 'full-frame': 1, 'aps-c': 1.5, 'micro-four-thirds': 2, 'one-inch': 2.7 };
const sceneEv: Record<LightLevel, number> = { bright: 15, overcast: 12, golden: 10, indoor: 7, low: 4, night: 1 };
const motionFloor = { still: 60, slow: 250, fast: 1000, erratic: 2000 };
const standardShutters = [1, 2, 4, 8, 15, 30, 40, 50, 60, 80, 100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000, 6400, 8000];
const standardIso = [50, 64, 80, 100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000, 6400, 8000, 10000, 12800, 16000, 20000, 25600, 32000, 51200];

function nearestAtLeast(values: number[], target: number) {
  return values.find((value) => value >= target) ?? values[values.length - 1];
}

function nearest(values: number[], target: number) {
  return values.reduce((best, value) => Math.abs(value - target) < Math.abs(best - target) ? value : best, values[0]);
}

function formatAperture(value: number) {
  return `f/${Number.isInteger(value) ? value : value.toFixed(1)}`;
}

function shutterPlan(scenario: Scenario, context: ShootingContext, gear: GearProfile) {
  if (scenario.shutterSeconds && !context.handheld) {
    const [low, high] = scenario.shutterSeconds;
    return { denominator: 1 / Math.sqrt(low * high), seconds: Math.sqrt(low * high), display: `${low}–${high} s` };
  }
  const stabilisation = context.handheld && context.motion === 'still' ? Math.max(0, gear.stabilizationStops) : 0;
  const handheldFloor = context.handheld ? (gear.focalLength * cropFactor[gear.sensor]) / 2 ** stabilisation : 1;
  const scenarioFloor = context.intent === 'motion' ? scenario.shutterDenominator[0] : context.intent === 'freeze' ? scenario.shutterDenominator[1] * 0.72 : Math.sqrt(scenario.shutterDenominator[0] * scenario.shutterDenominator[1]);
  const motion = context.intent === 'motion' ? scenario.shutterDenominator[0] : motionFloor[context.motion];
  const denominator = nearestAtLeast(standardShutters, Math.max(handheldFloor, scenarioFloor, motion));
  const upper = nearestAtLeast(standardShutters, denominator * 1.6);
  return { denominator, seconds: 1 / denominator, display: `1/${denominator}–1/${upper} s` };
}

function aperturePlan(scenario: Scenario, gear: GearProfile, context: ShootingContext) {
  const low = Math.max(scenario.aperture[0], gear.maxAperture);
  const high = Math.max(low, scenario.aperture[1]);
  const target = context.intent === 'freeze' || context.light === 'low' || context.light === 'night' ? low : Math.sqrt(low * high);
  return { low, high, target, display: low === high ? formatAperture(low) : `${formatAperture(low)}–${formatAperture(high)}` };
}

function isoPlan(aperture: number, seconds: number, scenario: Scenario, context: ShootingContext) {
  const ev100 = Math.log2((aperture ** 2) / seconds);
  const raw = 100 * 2 ** (ev100 - sceneEv[context.light]);
  const outputCap = context.output === 'large-print' ? 6400 : context.output === 'social' ? 25600 : 12800;
  const cap = Math.min(scenario.isoMax, outputCap);
  const estimate = Math.min(cap, Math.max(100, nearest(standardIso, raw)));
  return { estimate, cap, display: scenario.shutterSeconds ? `ISO ${estimate}` : `Auto ISO 100–${cap.toLocaleString()} (target ≈ ${estimate.toLocaleString()})` };
}

function exposureCompensation(scenario: Scenario, context: ShootingContext) {
  if (['moon', 'milky-way', 'fireworks'].includes(scenario.id)) return 'Manual exposure; verify histogram';
  if (scenario.id === 'snow-beach') return '+0.7 to +1.7 EV';
  if (['concert-stage', 'street-night'].includes(scenario.id)) return '-0.3 to -1.0 EV if highlights clip';
  if (context.light === 'overcast' && scenario.category === 'people') return '+0.3 EV for skin if needed';
  return '0 EV; adjust from histogram and zebras';
}

export function generateRecommendation(scenario: Scenario, context: ShootingContext, gear: GearProfile): Recommendation {
  const shutter = shutterPlan(scenario, context, gear);
  const aperture = aperturePlan(scenario, gear, context);
  const iso = isoPlan(aperture.target, shutter.seconds, scenario, context);
  const useFlash = context.flashAllowed && gear.flashAvailable && scenario.flash !== 'Off' && scenario.flash !== 'Usually off' && scenario.flash !== 'Usually prohibited';
  const mechanicalPreferred = ['indoor', 'low', 'night'].includes(context.light) || context.motion === 'fast' || context.motion === 'erratic';
  const focal = `${Math.max(scenario.focalRange[0], Math.round(gear.focalLength * 0.75))}–${Math.min(scenario.focalRange[1], Math.round(gear.focalLength * 1.35))} mm suggested`;
  const headline = `${aperture.display} · ${shutter.display} · ${iso.display}`;

  const groups = [
    {
      title: 'Exposure', icon: '◑', parameters: [
        { label: 'Exposure mode', value: scenario.shutterSeconds ? 'Manual (M)' : context.intent === 'freeze' ? 'Manual + Auto ISO / Shutter priority' : 'Manual + Auto ISO', reason: 'Keeps the critical aperture and shutter decisions under control.' },
        { label: 'Aperture', value: aperture.display, reason: context.intent === 'freeze' ? 'Opens the lens to protect shutter speed.' : 'Balances depth of field with optical performance.' },
        { label: 'Shutter speed', value: shutter.display, reason: context.intent === 'motion' ? 'Allows intentional subject or background movement.' : 'Meets both subject-motion and handheld limits.' },
        { label: 'ISO', value: iso.display, reason: `Estimated from a ${context.light.replace('-', ' ')} light level and the chosen exposure.` },
        { label: 'Exposure compensation', value: exposureCompensation(scenario, context), reason: 'Metering is a starting point; the histogram decides the final exposure.' },
        { label: 'Metering', value: scenario.metering, reason: 'Matches the scene’s highlight and subject priority.' },
      ],
    },
    {
      title: 'Focus & capture', icon: '⌖', parameters: [
        { label: 'Focus mode', value: scenario.focusMode, reason: 'Matches the amount and predictability of subject movement.' },
        { label: 'Focus area', value: scenario.focusArea, reason: 'Balances acquisition speed with control over the target.' },
        { label: 'Subject recognition', value: scenario.subjectDetection, reason: 'Uses recognition only where it improves reliability.' },
        { label: 'Drive mode', value: scenario.driveMode, reason: 'Provides enough frames without filling the buffer unnecessarily.' },
        { label: 'Priority', value: context.motion === 'fast' || context.motion === 'erratic' ? 'Balanced emphasis / release priority' : 'Focus priority', reason: 'Trades absolute focus confirmation against missing the moment.' },
        { label: 'Pre-capture', value: context.motion === 'erratic' ? 'Enable if available' : 'Optional', reason: 'Useful when the decisive moment is difficult to predict.' },
      ],
    },
    {
      title: 'Colour & files', icon: '◈', parameters: [
        { label: 'White balance', value: scenario.whiteBalance, reason: 'Keeps colour repeatable while respecting the scene’s atmosphere.' },
        { label: 'File format', value: scenario.fileFormat, reason: 'Preserves recovery latitude appropriate to the shooting volume.' },
        { label: 'Bit depth', value: '14-bit RAW when available; 10-bit for video', reason: 'Protects tonal and colour information during editing.' },
        { label: 'Colour space', value: 'Adobe RGB for managed print; sRGB for direct delivery', reason: 'Matches the capture workflow to the final output.' },
        { label: 'Creative look', value: 'Neutral preview; apply style in post', reason: 'Avoids judging exposure through an overly contrasty preview.' },
        { label: 'Dynamic range', value: 'Protect highlights; bracket static high-contrast scenes', reason: 'Clipped highlights cannot be recovered.' },
      ],
    },
    {
      title: 'Lens & stability', icon: '◎', parameters: [
        { label: 'Focal length', value: focal, reason: `Uses the ${gear.focalLength} mm field setting while respecting the scenario range.` },
        { label: 'Stabilisation', value: context.handheld ? scenario.stabilization : 'Off on a locked tripod unless the system recommends otherwise', reason: 'Avoids blur without introducing tripod feedback.' },
        { label: 'Focus limiter', value: scenario.focalRange[1] >= 200 ? 'Limit to the expected subject distance' : 'Full range', reason: 'Reduces hunting when the subject distance is predictable.' },
        { label: 'Filter', value: scenario.shutterSeconds ? 'ND as required; polariser only when useful' : scenario.id === 'landscape-day' ? 'Polariser optional; avoid uneven skies on ultra-wide lenses' : 'Clear/protection only when conditions justify it', reason: 'Adds glass only when it solves a specific problem.' },
        { label: 'Lens corrections', value: 'Record RAW; enable preview corrections', reason: 'Keeps composition accurate while retaining editing choice.' },
      ],
    },
    {
      title: 'Lighting & flash', icon: 'ϟ', parameters: [
        { label: 'Flash approach', value: useFlash ? scenario.flash : context.flashAllowed ? scenario.flash : 'No flash permitted', reason: useFlash ? 'Adds controlled light without overwhelming the ambient scene.' : 'Respects the scenario and current constraint.' },
        { label: 'Sync / HSS', value: useFlash && shutter.denominator > 250 ? 'Use HSS or lower to native sync speed' : 'Stay at or below native sync when using flash', reason: 'Avoids a partially exposed frame and unnecessary power loss.' },
        { label: 'Flash compensation', value: useFlash ? '-0.3 to -1.0 EV for natural fill' : 'Not applicable', reason: 'Keeps added light subordinate to the scene.' },
        { label: 'Light quality', value: useFlash ? 'Large, close, diffused or bounced source' : 'Use direction, shade, or a reflector', reason: 'Apparent source size controls softness.' },
      ],
    },
    {
      title: 'Camera safeguards', icon: '◉', parameters: [
        { label: 'Shutter type', value: mechanicalPreferred ? 'Mechanical / electronic front curtain' : 'Electronic if rolling shutter and banding are controlled', reason: mechanicalPreferred ? 'Reduces LED banding and rolling-shutter distortion.' : 'Can provide silent capture without a quality penalty in suitable light.' },
        { label: 'Anti-flicker', value: ['indoor', 'low'].includes(context.light) ? 'Enable and test variable-shutter scan if available' : 'Off unless artificial light flickers', reason: 'Prevents brightness and colour bands.' },
        { label: 'High-ISO NR', value: 'Low for JPEG/HEIF; RAW noise reduction in post', reason: 'Preserves fine detail and avoids plastic texture.' },
        { label: 'Long-exposure NR', value: scenario.shutterSeconds ? 'On for single critical frames; off when stacking or timing matters' : 'Off', reason: 'A dark-frame exposure doubles capture time.' },
        { label: 'Histogram / zebras', value: 'Live histogram + highlight zebra around 100+', reason: 'Provides exposure feedback independent of screen brightness.' },
        { label: 'Backup', value: scenario.id === 'wedding-event' || scenario.category === 'commercial' ? 'Simultaneous dual-card recording' : 'Second card or frequent backup when critical', reason: 'Reduces loss from media failure.' },
      ],
    },
  ];

  if (scenario.video) groups.push({
    title: 'Motion picture', icon: '▶', parameters: [
      { label: 'Frame rate', value: scenario.video.frameRate, reason: 'Matches the intended playback cadence.' },
      { label: 'Shutter', value: scenario.video.shutter, reason: 'Produces familiar motion blur near a 180° shutter angle.' },
      { label: 'Picture profile', value: scenario.video.profile, reason: 'Balances grading latitude against delivery speed.' },
      { label: 'Audio', value: scenario.video.audio, reason: 'Protects dialogue and effects from clipping.' },
      { label: 'ND filter', value: 'Use ND to preserve shutter angle and aperture in bright light', reason: 'Separates exposure control from motion rendering.' },
      { label: 'Monitoring', value: 'Zebras, waveform/histogram, focus peaking, headphones', reason: 'Checks exposure, focus, and sound before they become unfixable.' },
    ],
  });

  const cautions = [
    ...(mechanicalPreferred ? ['Test artificial light for banding before the important moment.'] : []),
    ...(context.motion === 'fast' || context.motion === 'erratic' ? ['Electronic shutter can bend fast subjects; verify rolling-shutter performance.'] : []),
    ...(aperture.high > 11 ? ['Very small apertures increase diffraction; stop down only for necessary depth.'] : []),
    ...(iso.estimate >= iso.cap ? [`The ISO estimate reaches the ${iso.cap.toLocaleString()} ceiling—add light, open the lens, or accept more motion.`] : []),
    ...(context.handheld && scenario.shutterSeconds ? ['This creative exposure normally needs a tripod or stable support.'] : []),
  ];

  return {
    scenarioId: scenario.id, scenarioName: scenario.name, headline, aperture: aperture.display, shutter: shutter.display,
    iso: iso.display, isoEstimate: iso.estimate, groups,
    checklist: [...scenario.special, `Battery charged; card has enough capacity for ${scenario.driveMode.toLowerCase()}.`, 'Clean the front element and verify the first frame at 100% magnification.', 'Treat these values as a starting point and confirm with the actual scene.'],
    cautions, generatedAt: new Date().toISOString(),
  };
}

export function calculateExposureValue(aperture: number, shutterSeconds: number, iso: number) {
  const ev100 = Math.log2((aperture ** 2) / shutterSeconds);
  return { ev100, sceneEv: ev100 - Math.log2(iso / 100) };
}
