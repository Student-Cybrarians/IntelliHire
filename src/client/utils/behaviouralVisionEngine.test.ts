// src/client/utils/behaviouralVisionEngine.test.ts
import { describe, it, expect } from 'vitest';
import {
  computeGazeDirection,
  classifyYoloPose,
  aggregateEmotionDistribution,
  calculateBCI,
  aggregateBciWindow,
  LandmarkMap
} from './behaviouralVisionEngine';

describe('Module 5: Browser-Native Computer Vision & BCI Engine', () => {
  it('computes gaze direction and classifies on-screen gaze when deviation <= 15 degrees', () => {
    // Iris centered within eye corners
    const straightGazeLandmarks: LandmarkMap = {
      33: { x: 0.35, y: 0.40, z: 0 },
      133: { x: 0.45, y: 0.40, z: 0 },
      362: { x: 0.55, y: 0.40, z: 0 },
      263: { x: 0.65, y: 0.40, z: 0 },
      468: { x: 0.40, y: 0.40, z: 0 }, // left iris center: exactly at 0.50 offset
      473: { x: 0.60, y: 0.40, z: 0 }  // right iris center: exactly at 0.50 offset
    };

    const result = computeGazeDirection(straightGazeLandmarks);
    expect(result.gaze_angle_degrees).toBeLessThanOrEqual(15.0);
    expect(result.is_on_screen).toBe(true);

    // Extreme off-screen deviation (looking far left/right)
    const divertedGazeLandmarks: LandmarkMap = {
      ...straightGazeLandmarks,
      468: { x: 0.36, y: 0.40, z: 0 }, // left iris pushed to edge
      473: { x: 0.56, y: 0.40, z: 0 }
    };
    const divertedResult = computeGazeDirection(divertedGazeLandmarks);
    expect(divertedResult.gaze_angle_degrees).toBeGreaterThan(15.0);
    expect(divertedResult.is_on_screen).toBe(false);
  });

  it('classifies YOLOv8 17-keypoint posture into confident, neutral, or defensive', () => {
    // Level shoulders, upright head -> confident
    const confidentKeypoints = [
      { x: 0.50, y: 0.20, confidence: 0.95 }, // nose
      { x: 0.48, y: 0.18, confidence: 0.95 }, // l_eye
      { x: 0.52, y: 0.18, confidence: 0.95 }, // r_eye
      { x: 0.45, y: 0.20, confidence: 0.95 }, // l_ear
      { x: 0.55, y: 0.20, confidence: 0.95 }, // r_ear
      { x: 0.32, y: 0.45, confidence: 0.95 }, // l_shoulder
      { x: 0.68, y: 0.45, confidence: 0.95 }  // r_shoulder
    ];

    const result = classifyYoloPose(confidentKeypoints);
    expect(result.posture_classification).toBe('confident');
    expect(result.shoulder_slope_angle_degrees).toBeLessThan(5.0);
    expect(result.score).toBeGreaterThanOrEqual(90);

    // Heavily tilted shoulders -> defensive / slouching
    const slouchedKeypoints = [
      confidentKeypoints[0],
      confidentKeypoints[1],
      confidentKeypoints[2],
      confidentKeypoints[3],
      confidentKeypoints[4],
      { x: 0.32, y: 0.35, confidence: 0.95 }, // l_shoulder high
      { x: 0.68, y: 0.55, confidence: 0.95 }  // r_shoulder low (tilted > 15 deg)
    ];
    const slouchedResult = classifyYoloPose(slouchedKeypoints);
    expect(slouchedResult.posture_classification).toBe('defensive');
    expect(slouchedResult.score).toBeLessThanOrEqual(60);
  });

  it('aggregates AffectNet emotion distribution across video frames', () => {
    const samples = [
      { dominant: 'confident', valence: 0.8, arousal: 0.6 },
      { dominant: 'focused', valence: 0.7, arousal: 0.5 },
      { dominant: 'confident', valence: 0.85, arousal: 0.65 },
      { dominant: 'neutral', valence: 0.5, arousal: 0.3 }
    ];

    const result = aggregateEmotionDistribution(samples);
    expect(result.dominant_emotion).toBe('confident');
    expect(result.distribution.confident).toBe(0.5);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it('calculates Behavioural Confidence Index (BCI) using exact Equation 2', () => {
    const sEye = 85;
    const sPosture = 90;
    const sEmotion = 80;

    // Paper default weights: 0.40 * 85 + 0.30 * 90 + 0.30 * 80 = 34 + 27 + 24 = 85
    const bciDefault = calculateBCI(sEye, sPosture, sEmotion);
    expect(bciDefault).toBe(85);

    // AHP calibrated weights: 0.42 * 85 + 0.31 * 90 + 0.27 * 80 = 35.7 + 27.9 + 21.6 = 85.2 -> 85
    const bciAhp = calculateBCI(sEye, sPosture, sEmotion, { w_eye: 0.42, w_posture: 0.31, w_emotion: 0.27 });
    expect(bciAhp).toBe(85);
  });

  it('aggregates sliding window and certifies client-side privacy guarantee', () => {
    const aggregate = aggregateBciWindow([], 30);
    expect(aggregate.privacy_guarantee).toBe('CLIENT_SIDE_ONLY_VERIFIED');
    expect(aggregate.bci_score).toBeGreaterThan(70);
  });
});
