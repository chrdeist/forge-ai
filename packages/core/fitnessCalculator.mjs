/**
 * Fitness Calculator
 * Computes fitness scores for strategies
 */

export class FitnessCalculator {
  static calculate(metrics) {
    const weights = {
      success: 0.4,
      tokens: 0.3,
      quality: 0.2,
      speed: 0.1
    };

    const success_score = metrics.success ? 1.0 : 0.0;
    const token_score = 1.0 - Math.min(metrics.tokens_used / 10000, 1.0);
    const quality_score = metrics.output_quality || 0.5;
    const speed_score = 1.0 - Math.min(metrics.execution_time_ms / 5000, 1.0);

    return (
      weights.success * success_score +
      weights.tokens * token_score +
      weights.quality * quality_score +
      weights.speed * speed_score
    );
  }
}
