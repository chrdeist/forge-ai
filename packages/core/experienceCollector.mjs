/**
 * Experience Collector
 * Records and manages execution experiences
 */

import fs from 'node:fs';
import path from 'node:path';

export class ExperienceCollector {
  constructor(knowledgeBasePath = './knowledge/experiences.json') {
    this.knowledgeBasePath = knowledgeBasePath;
    this.knowledgeBase = this.loadKnowledgeBase();
  }

  loadKnowledgeBase() {
    if (!fs.existsSync(this.knowledgeBasePath)) {
      return { experiences: [], strategy_rankings: {} };
    }
    return JSON.parse(fs.readFileSync(this.knowledgeBasePath, 'utf8'));
  }

  saveKnowledgeBase() {
    fs.writeFileSync(
      this.knowledgeBasePath,
      JSON.stringify(this.knowledgeBase, null, 2)
    );
  }

  async recordExperience(experience) {
    this.knowledgeBase.experiences.push(experience);
    this.saveKnowledgeBase();
    return experience;
  }

  getBestStrategy(taskType) {
    const rankings = this.knowledgeBase.strategy_rankings[taskType];
    if (!rankings || rankings.length === 0) return null;
    
    return rankings
      .filter(s => s.status !== 'deprecated')
      .sort((a, b) => b.avg_fitness - a.avg_fitness)[0];
  }
}
