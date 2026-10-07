"""
Bayesian / Kalman Uncertainty Calibration & Information Gain Engine
IntelliHire M03 - Phase 2
"""

import math
from typing import Dict, Any, NamedTuple


class MeasurementNoise:
    """
    Measurement noise variance (R) based on observation fidelity.
    Authentic work simulations exhibit lowest observation noise,
    while self-reported resume claims carry highest noise.
    """
    M03_WORK_SIMULATION = 0.06      # Direct authentic execution
    M02_OBJECTIVE_ASSESSMENT = 0.15  # Timed multi-format assessment
    M04_INTERVIEW_CALIBRATED = 0.20  # Calibrated panel probe
    M01_ATS_CLAIM = 0.38            # Self-reported unstructured text
    DEFAULT_OBSERVATION = 0.25


class BeliefState(NamedTuple):
    mean: float        # Proficiency estimate in [0.0, 1.0]
    variance: float    # Uncertainty estimate (variance) in [0.0, 1.0]
    observation_count: int


class KalmanUpdateResult(NamedTuple):
    posterior_mean: float
    posterior_variance: float
    kalman_gain: float
    information_gain_nats: float
    uncertainty_reduction_pct: float


def calculate_kalman_update(
    prior_mean: float,
    prior_variance: float,
    observed_score: float,
    source_module: str = "m03_simulation"
) -> KalmanUpdateResult:
    """
    Executes a 1D Kalman filter step updating proficiency belief:
      K = Var_prior / (Var_prior + R)
      Mean_post = Mean_prior + K * (Score_obs - Mean_prior)
      Var_post = (1 - K) * Var_prior
    """
    # Bound priors
    prior_mean = max(0.0, min(1.0, float(prior_mean)))
    prior_variance = max(0.005, min(1.0, float(prior_variance)))
    observed_score = max(0.0, min(1.0, float(observed_score)))

    # Determine measurement noise R
    if source_module in ("m03_simulation", "simulation_work_round"):
        r = MeasurementNoise.M03_WORK_SIMULATION
    elif source_module in ("m02_assessment", "assessment_score"):
        r = MeasurementNoise.M02_OBJECTIVE_ASSESSMENT
    elif source_module in ("m04_interview", "interview_rating"):
        r = MeasurementNoise.M04_INTERVIEW_CALIBRATED
    elif source_module in ("m01_resume", "claim"):
        r = MeasurementNoise.M01_ATS_CLAIM
    else:
        r = MeasurementNoise.DEFAULT_OBSERVATION

    # Kalman Gain
    kalman_gain = prior_variance / (prior_variance + r)

    # Posterior Mean
    posterior_mean = prior_mean + kalman_gain * (observed_score - prior_mean)
    posterior_mean = max(0.0, min(1.0, posterior_mean))

    # Posterior Variance
    posterior_variance = (1.0 - kalman_gain) * prior_variance
    posterior_variance = max(0.005, min(1.0, posterior_variance))

    # Shannon Information Gain: 0.5 * ln(1 + Var_prior / R)
    snr = prior_variance / r
    info_gain = 0.5 * math.log(1.0 + snr)

    # Uncertainty reduction percentage
    reduction_pct = ((prior_variance - posterior_variance) / prior_variance) * 100.0

    return KalmanUpdateResult(
        posterior_mean=round(posterior_mean, 4),
        posterior_variance=round(posterior_variance, 4),
        kalman_gain=round(kalman_gain, 4),
        information_gain_nats=round(info_gain, 4),
        uncertainty_reduction_pct=round(reduction_pct, 2)
    )


def project_information_gain(prior_variance: float, target_modality: str) -> float:
    """
    Projects the expected information gain (Shannon entropy reduction)
    if the candidate is tested on a skill using a specific work surface modality.
    """
    prior_variance = max(0.01, min(1.0, float(prior_variance)))
    if target_modality in ("coding", "operational_triage", "financial_analysis"):
        r = MeasurementNoise.M03_WORK_SIMULATION
    else:
        r = MeasurementNoise.M02_OBJECTIVE_ASSESSMENT
    return 0.5 * math.log(1.0 + (prior_variance / r))
