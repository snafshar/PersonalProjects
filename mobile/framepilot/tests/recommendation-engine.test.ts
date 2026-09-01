import assert from 'node:assert/strict';
import test from 'node:test';

import { scenarios } from '../src/data/scenarios.ts';
import { defaultContext, defaultGear, generateRecommendation } from '../src/lib/recommendation-engine.ts';

test('ships a broad and uniquely identified scenario library', () => {
  assert.ok(scenarios.length >= 25);
  assert.equal(new Set(scenarios.map((scenario) => scenario.id)).size, scenarios.length);
  for (const scenario of scenarios) {
    assert.ok(scenario.name && scenario.focusMode && scenario.fileFormat && scenario.special.length >= 3);
  }
});

test('birds in flight receives a fast shutter and complete support settings', () => {
  const scenario = scenarios.find((item) => item.id === 'birds-in-flight')!;
  const recommendation = generateRecommendation(scenario, { ...defaultContext(scenario), motion: 'erratic', intent: 'freeze' }, { ...defaultGear, focalLength: 500, maxAperture: 5.6 });
  const denominator = Number(recommendation.shutter.match(/1\/(\d+)/)?.[1]);
  assert.ok(denominator >= 1600);
  assert.ok(recommendation.groups.length >= 6);
  assert.ok(recommendation.groups.reduce((total, group) => total + group.parameters.length, 0) >= 30);
});

test('large-print output applies a conservative ISO ceiling', () => {
  const scenario = scenarios.find((item) => item.id === 'concert-stage')!;
  const recommendation = generateRecommendation(scenario, { ...defaultContext(scenario), output: 'large-print' }, { ...defaultGear, maxAperture: 2.8 });
  assert.match(recommendation.iso, /6,400/);
  assert.ok(recommendation.isoEstimate <= 6400);
});

test('creative long exposures return seconds rather than a reciprocal shutter', () => {
  const scenario = scenarios.find((item) => item.id === 'waterfall-long-exposure')!;
  const recommendation = generateRecommendation(scenario, { ...defaultContext(scenario), handheld: false }, { ...defaultGear, hasTripod: true });
  assert.match(recommendation.shutter, /s$/);
  assert.ok(recommendation.checklist.some((item) => /ND filter/i.test(item)));
});

test('video scenarios include motion-picture parameters', () => {
  const scenario = scenarios.find((item) => item.id === 'cinematic-interview')!;
  const recommendation = generateRecommendation(scenario, defaultContext(scenario), defaultGear);
  assert.ok(recommendation.groups.some((group) => group.title === 'Motion picture'));
});
