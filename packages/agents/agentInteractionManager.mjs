/**
 * Agent Interaction Pattern: Implementation ↔ Test Loop
 * 
 * Der ImplementationAgent iteriert gegen die Tests vom TestAgent.
 * Bei Fehlschlag über mehrere Iterationen ("Sackgasse") wird Feedback
 * an den TechnicalRequirementsAgent oder FunctionalRequirementsAgent
 * zurückgegeben, um Anforderungen zu verfeinern (Selbstlernpunkt).
 * 
 * Flow:
 * 1. TestAgent generiert Tests basierend auf Technical Spec.
 * 2. ImplementationAgent versucht, Code zu implementieren und Tests zu erfüllen.
 * 3. Tests laufen, Ergebnisse werden geprüft.
 * 4. Wenn Tests grün: Weiter zur nächsten Phase (Review, Doku).
 * 5. Wenn Tests rot: ImplementationAgent iteriert (max N Versuche).
 * 6. Bei Sackgasse (>N Fehlschläge): Feedback-Report erstellen für Verfeinerung.
 * 7. Orchestrator speichert Erfahrung (Anforderung → Probleme → Lernpunkt).
 */

export class AgentInteractionManager {
  constructor(config = {}) {
    this.maxIterations = config.maxIterations || 5;
    this.testRetryDelayMs = config.testRetryDelayMs || 1000;
    this.currentIteration = 0;
    this.history = [];
  }

  /**
   * Orchestriert den Implementation-Test-Loop.
   * 
   * @param {Object} technicalSpec - Technische Spezifikation vom TechnicalRequirementsAgent
   * @param {Object} testAgent - TestAgent-Instanz
   * @param {Object} implementationAgent - ImplementationAgent-Instanz
   * @param {Object} feedbackHandler - Handler für Sackgassen (optional)
   * @returns {Object} - Result { success, iterations, feedback, nextSteps }
   */
  async runImplementationLoop(technicalSpec, testAgent, implementationAgent, feedbackHandler) {
    console.log(`\n🔄 Starting Implementation-Test Loop (max ${this.maxIterations} iterations)`);
    this.currentIteration = 0;
    this.history = [];

    let testsPassing = false;
    let lastError = null;

    while (this.currentIteration < this.maxIterations && !testsPassing) {
      this.currentIteration += 1;
      console.log(`\n--- Iteration ${this.currentIteration} / ${this.maxIterations} ---`);

      try {
        // Step 1: ImplementationAgent implementiert basierend auf TechnicalSpec
        console.log(`📝 Implementation Agent: Writing code...`);
        const implementationResult = await implementationAgent.generateImplementation(technicalSpec);
        this.history.push({
          iteration: this.currentIteration,
          step: 'implementation',
          timestamp: new Date().toISOString(),
          result: implementationResult,
        });

        // Step 2: TestAgent führt Tests aus
        console.log(`🧪 Test Agent: Running tests...`);
        const testResult = await testAgent.runTests(implementationResult);
        this.history.push({
          iteration: this.currentIteration,
          step: 'testing',
          timestamp: new Date().toISOString(),
          result: testResult,
        });

        // Step 3: Prüfe Testergebnisse
        if (testResult.allPassed) {
          console.log(`✅ All tests passed in iteration ${this.currentIteration}!`);
          testsPassing = true;

          return {
            success: true,
            iterations: this.currentIteration,
            implementationResult,
            testResult,
            feedback: null,
            nextSteps: ['Review', 'Documentation'],
          };
        } else {
          console.log(`❌ Tests failed. Failures: ${testResult.failures.length}`);
          lastError = testResult.failures;

          // Step 4: ImplementationAgent lernt aus Fehlschlag
          if (this.currentIteration < this.maxIterations) {
            console.log(`🔍 Implementation Agent: Analyzing failures and improving...`);
            await implementationAgent.learnFromTestFailures(
              implementationResult,
              testResult.failures,
              technicalSpec
            );
          }
        }
      } catch (error) {
        console.error(`❌ Error during iteration ${this.currentIteration}:`, error.message);
        lastError = error;
      }

      // Kleine Pause vor nächster Iteration
      if (this.currentIteration < this.maxIterations && !testsPassing) {
        await new Promise((resolve) => setTimeout(resolve, this.testRetryDelayMs));
      }
    }

    // Step 5: Sackgasse erreicht - Feedback generieren
    console.log(`\n⚠️  Reached iteration limit without passing all tests. Generating feedback...`);
    const feedbackReport = this._generateFeedbackReport(
      technicalSpec,
      lastError,
      implementationAgent
    );

    if (feedbackHandler) {
      console.log(`📤 Sending feedback to FunctionalRequirementsAgent...`);
      await feedbackHandler.handleDeadlock(feedbackReport);
    }

    return {
      success: false,
      iterations: this.currentIteration,
      feedback: feedbackReport,
      nextSteps: [
        'Refine functional requirements',
        'Clarify technical specification',
        'Review test design',
      ],
    };
  }

  /**
   * Generiert einen Feedback-Report bei Sackgasse.
   * Dieser Report wird für Selbstlernpunkte genutzt:
   * - Anforderungen waren zu vague
   * - Technische Spec fehlerhaft/unvollständig
   * - Tests waren widersprüchlich
   */
  _generateFeedbackReport(technicalSpec, errors, implementationAgent) {
    const report = {
      timestamp: new Date().toISOString(),
      deadlockReason: 'Could not satisfy all tests within iteration limit',
      technicalSpecName: technicalSpec.name,
      iterationHistory: this.history,
      lastErrors: errors,
      suggestedRefinements: this._suggestRefinements(errors, technicalSpec),
      learningPoints: this._extractLearningPoints(this.history),
    };

    return report;
  }

  /**
   * Schlägt Verbesserungen vor basierend auf den Fehlern.
   */
  _suggestRefinements(errors, technicalSpec) {
    const suggestions = [];

    if (Array.isArray(errors)) {
      // Analysiere Fehlermuster
      const errorMessages = errors.map((e) => e.message || e).join(' ');

      if (errorMessages.includes('Assertion') || errorMessages.includes('Expected')) {
        suggestions.push(
          'Technical specification may be incomplete or ambiguous. Review acceptance criteria.'
        );
      }

      if (errorMessages.includes('undefined') || errorMessages.includes('not found')) {
        suggestions.push(
          'API signatures or data structures may be missing. Review technical specification.'
        );
      }

      if (errorMessages.includes('timeout')) {
        suggestions.push('Performance constraint may be unrealistic. Review non-functional requirements.');
      }
    }

    return suggestions;
  }

  /**
   * Extrahiert Lernpunkte aus der Iterationshistorie.
   * Diese werden in knowledge/experiences.json persistiert.
   */
  _extractLearningPoints(history) {
    const points = [];

    for (let i = 1; i < history.length; i += 2) {
      const impResult = history[i - 1]?.result;
      const testResult = history[i]?.result;

      if (impResult && testResult && !testResult.allPassed) {
        points.push({
          iteration: history[i].iteration,
          issue: 'Implementation did not satisfy tests',
          possibleCause: 'Specification was not clear enough',
          suggestion: 'Require more detailed specification before implementation',
        });
      }
    }

    return points;
  }

  /**
   * Ruft den ImplementationAgent auf, um basierend auf Feedback
   * die Anforderungen/Specs zu verfeinern (Selbstlernpunkt).
   */
  async refineFunctionalRequirements(functionalReqAgent, feedbackReport) {
    console.log(`\n🎓 Self-Learning: Refining functional requirements based on feedback...`);

    const refinement = {
      originalRequirements: feedbackReport.technicalSpecName,
      feedback: feedbackReport.suggestedRefinements,
      learningPoints: feedbackReport.learningPoints,
      timestamp: new Date().toISOString(),
    };

    // Hier könnte FunctionalRequirementsAgent die Requirements neufassen
    // (z.B. Akzeptanzkriterien klarer formulieren, Testfälle spezifischer machen)
    console.log(`📋 Refined requirements would be saved to knowledge/refinements.json`);

    return refinement;
  }
}

/**
 * Beispiel: Feedback Handler für Sackgassen.
 * Könnte auch als separater Agent implementiert werden.
 */
export class DeadlockFeedbackHandler {
  constructor(knowledgeBasePath = './knowledge') {
    this.knowledgeBasePath = knowledgeBasePath;
  }

  /**
   * Behandelt einen Deadlock:
   * 1. Speichert den Feedback-Report
   * 2. Trigger (optional) eine Verfeinerung der Requirements
   * 3. Persistiert Learning Points in knowledge/experiences.json
   */
  async handleDeadlock(feedbackReport) {
    console.log(`\n🔴 Deadlock Handler: Processing feedback report...`);

    // TODO: Speichere feedbackReport zur späteren Auswertung
    console.log(`📝 Would save feedback report for review and learning.`);

    // TODO: Extrahiere Learning Points und schreibe nach knowledge/
    const learningPoints = feedbackReport.learningPoints;
    console.log(`🎓 Learning points extracted: ${learningPoints.length}`);

    return {
      feedbackSaved: true,
      learningPointsExtracted: learningPoints.length,
      nextAction: 'Manual review and requirements refinement',
    };
  }
}

export default AgentInteractionManager;
