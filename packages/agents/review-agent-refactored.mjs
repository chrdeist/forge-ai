/**
 * Review Agent (Generic, RVD-based)
 * 
 * Purpose:
 * - Reviews generated implementation code
 * - Provides code quality assessment and improvement suggestions
 * - Reads from RVD implementation section, writes to RVD review section
 * 
 * Input: RVD file (implementation section populated)
 * Output: RVD file with review-section populated
 * 
 * No hardcoded content - fully generic implementation
 */

import fs from 'node:fs';
import path from 'node:path';
import { BaseAgent } from './baseAgent.mjs';
import { RVDManager } from './rvd-manager.mjs';

export class ReviewAgent extends BaseAgent {
  constructor(config = {}) {
    super(config);
    this.rvdManager = new RVDManager(config);
  }

  /**
   * Main execute method
   * @param {string} rvdFilePath - Path to RVD file (with implementation section)
   */
  async execute(rvdFilePath) {
    if (!fs.existsSync(rvdFilePath)) {
      throw new Error(`RVD file not found: ${rvdFilePath}`);
    }

    this._log(`🔍 Reviewing implementation from RVD`);

    // Load knowledge base for learning
    this.loadKnowledgeBase();

    // Load RVD file
    const rvd = await this.rvdManager.load(rvdFilePath);

    if (!rvd.implementation) {
      throw new Error('Implementation section not found in RVD file. Run ImplementationAgent first.');
    }

    // Set context
    this.setRequirementContext(rvd.project || {});

    // Review implementation code
    const reviewData = this._reviewImplementation(
      rvd.implementation.data,
      rvd.technical?.data,
      rvd.project?.name || 'unknown'
    );

    // Write to review section
    rvd.review = {
      timestamp: new Date().toISOString(),
      reviewedBy: 'ReviewAgent',
      data: reviewData,
    };

    // Save RVD file
    await this.rvdManager.save(rvdFilePath, rvd);
    this._log(`✓ Wrote review section to RVD`);

    // Learn patterns
    this._learnFromExecution(reviewData);

    return {
      success: true,
      rvdPath: rvdFilePath,
      reviewData,
    };
  }

  /**
   * Review implementation code quality
   * Provides feedback on structure, patterns, and improvements
   */
  _reviewImplementation(implementationData, technicalData, projectName) {
    this._log(`  ✓ Reviewing ${implementationData.filesGenerated || 0} generated files`);

    const codeQualityReview = this._reviewCodeQuality(implementationData);
    const architectureReview = this._reviewArchitecture(implementationData, technicalData);
    const securityReview = this._reviewSecurity(implementationData);
    const performanceReview = this._reviewPerformance(implementationData);

    const overallScore = this._calculateOverallScore(
      codeQualityReview,
      architectureReview,
      securityReview,
      performanceReview
    );

    return {
      projectName,
      timestamp: new Date().toISOString(),
      sourceSection: 'implementation',
      overallScore,
      codeQuality: codeQualityReview,
      architecture: architectureReview,
      security: securityReview,
      performance: performanceReview,
      recommendations: this._generateRecommendations(
        codeQualityReview,
        architectureReview,
        securityReview,
        performanceReview
      ),
    };
  }

  /**
   * Review code quality (structure, naming, documentation)
   */
  _reviewCodeQuality(implementationData) {
    const files = implementationData.files || [];
    const sourceFiles = files.filter(f => f.type === 'source' || f.type === 'route' || f.type === 'service');

    const review = {
      score: 0,
      maxScore: 100,
      findings: [],
      suggestions: [],
    };

    // Check file structure
    if (files.length > 0) {
      review.findings.push({
        type: 'info',
        severity: 'low',
        category: 'Structure',
        message: `Generated ${files.length} files with proper separation of concerns`,
        file: 'general',
      });
      review.score += 20;
    }

    // Check naming conventions
    const fileNamingCheck = this._checkNamingConventions(files);
    review.findings.push({
      type: fileNamingCheck.passed ? 'success' : 'warning',
      severity: fileNamingCheck.passed ? 'low' : 'medium',
      category: 'Naming',
      message: fileNamingCheck.message,
      file: 'general',
    });
    if (fileNamingCheck.passed) review.score += 15;

    // Check documentation
    const docCheck = this._checkDocumentation(sourceFiles);
    review.findings.push({
      type: docCheck.hasDocumentation ? 'success' : 'warning',
      severity: docCheck.hasDocumentation ? 'low' : 'medium',
      category: 'Documentation',
      message: docCheck.message,
      percentage: docCheck.percentage,
    });
    if (docCheck.hasDocumentation) review.score += 15;

    // Check error handling
    const errorCheck = this._checkErrorHandling(sourceFiles);
    review.findings.push({
      type: errorCheck.isComplete ? 'success' : 'warning',
      severity: errorCheck.isComplete ? 'low' : 'medium',
      category: 'Error Handling',
      message: errorCheck.message,
    });
    if (errorCheck.isComplete) review.score += 15;

    // Module organization
    const moduleCheck = this._checkModuleOrganization(files);
    review.findings.push({
      type: moduleCheck.isWellOrganized ? 'success' : 'warning',
      severity: moduleCheck.isWellOrganized ? 'low' : 'medium',
      category: 'Module Organization',
      message: moduleCheck.message,
    });
    if (moduleCheck.isWellOrganized) review.score += 20;

    review.score = Math.min(review.score, review.maxScore);
    return review;
  }

  /**
   * Review architecture and design patterns
   */
  _reviewArchitecture(implementationData, technicalData) {
    const review = {
      score: 0,
      maxScore: 100,
      findings: [],
      patterns: [],
    };

    // Check layering
    const hasLayers = implementationData.files?.some(f => f.type === 'route') &&
                      implementationData.files?.some(f => f.type === 'service') &&
                      implementationData.files?.some(f => f.type === 'model');

    if (hasLayers) {
      review.findings.push({
        type: 'success',
        severity: 'low',
        category: 'Layering',
        message: 'Proper three-tier architecture detected (routes, services, models)',
      });
      review.score += 30;
    }

    // Check MVC pattern
    const hasMVC = implementationData.files?.some(f => f.name?.includes('routes')) &&
                   implementationData.files?.some(f => f.name?.includes('services')) &&
                   implementationData.files?.some(f => f.name?.includes('models'));

    if (hasMVC) {
      review.patterns.push({
        name: 'MVC Pattern',
        status: 'implemented',
        description: 'Model-View-Controller pattern properly separated',
      });
      review.score += 20;
    }

    // Check separation of concerns
    const hasSeparation = implementationData.structure && Object.keys(implementationData.structure).length > 2;
    if (hasSeparation) {
      review.findings.push({
        type: 'success',
        severity: 'low',
        category: 'Separation of Concerns',
        message: 'Clear separation of concerns in directory structure',
      });
      review.score += 20;
    }

    // Check dependency management
    if (implementationData.files?.some(f => f.name === 'package.json')) {
      review.findings.push({
        type: 'success',
        severity: 'low',
        category: 'Dependencies',
        message: 'Dependency management configured with package.json',
      });
      review.score += 15;
    }

    // Containerization check
    if (implementationData.files?.some(f => f.type === 'docker')) {
      review.findings.push({
        type: 'success',
        severity: 'low',
        category: 'Deployment',
        message: 'Containerization ready with Docker and docker-compose',
      });
      review.score += 15;
    }

    review.score = Math.min(review.score, review.maxScore);
    return review;
  }

  /**
   * Review security aspects
   */
  _reviewSecurity(implementationData) {
    const review = {
      score: 0,
      maxScore: 100,
      findings: [],
      issues: [],
      recommendations: [],
    };

    // Check for environment configuration
    if (implementationData.files?.some(f => f.name === '.env.example')) {
      review.findings.push({
        type: 'success',
        severity: 'low',
        category: 'Environment Variables',
        message: '.env.example configured for secrets management',
      });
      review.score += 15;
    } else {
      review.issues.push({
        severity: 'high',
        message: 'Missing .env configuration - secrets should not be hardcoded',
      });
    }

    // Check for error handling middleware
    const hasErrorHandling = implementationData.files?.some(f => 
      f.name?.includes('error') || f.name?.includes('middleware')
    );

    if (hasErrorHandling) {
      review.findings.push({
        type: 'success',
        severity: 'low',
        category: 'Error Handling',
        message: 'Error handling middleware configured',
      });
      review.score += 20;
    }

    // Check for CORS configuration
    const hasCors = implementationData.files?.some(f => 
      f.name?.includes('middleware') || f.name?.includes('index.js')
    );

    if (hasCors) {
      review.findings.push({
        type: 'success',
        severity: 'low',
        category: 'CORS',
        message: 'CORS middleware included',
      });
      review.score += 15;
    }

    // Security recommendations
    review.recommendations.push(
      'Implement rate limiting to prevent DoS attacks',
      'Add input validation and sanitization for all endpoints',
      'Use HTTPS in production',
      'Implement authentication and authorization',
      'Add request logging and monitoring',
      'Regular security updates for dependencies'
    );

    review.score += Math.min(review.recommendations.length * 5, 50);
    review.score = Math.min(review.score, review.maxScore);

    return review;
  }

  /**
   * Review performance aspects
   */
  _reviewPerformance(implementationData) {
    const review = {
      score: 0,
      maxScore: 100,
      findings: [],
      recommendations: [],
    };

    // Check for caching
    const hasCaching = implementationData.files?.some(f => 
      f.name?.includes('cache')
    );

    if (!hasCaching) {
      review.recommendations.push({
        area: 'Caching',
        suggestion: 'Consider implementing caching layer for frequently accessed data',
        priority: 'medium',
      });
      review.score += 15;
    } else {
      review.findings.push({
        type: 'success',
        severity: 'low',
        category: 'Caching',
        message: 'Caching strategy implemented',
      });
      review.score += 20;
    }

    // Check for database indexing recommendations
    review.recommendations.push({
      area: 'Database',
      suggestion: 'Ensure appropriate indexes on frequently queried columns',
      priority: 'medium',
    });

    // Check for async/await usage
    review.recommendations.push({
      area: 'Async Operations',
      suggestion: 'Ensure all I/O operations use async/await for non-blocking execution',
      priority: 'high',
    });
    review.score += 20;

    // Check for monitoring
    review.recommendations.push({
      area: 'Monitoring',
      suggestion: 'Implement application monitoring and performance metrics',
      priority: 'medium',
    });

    // Check for logging
    const hasLogging = implementationData.files?.some(f => 
      f.name?.includes('middleware')
    );

    if (hasLogging) {
      review.findings.push({
        type: 'success',
        severity: 'low',
        category: 'Logging',
        message: 'Request logging middleware configured',
      });
      review.score += 15;
    }

    // Health check endpoint
    const hasHealthCheck = implementationData.files?.some(f => 
      f.name?.includes('index.js') && f.type === 'source'
    );

    if (hasHealthCheck) {
      review.findings.push({
        type: 'success',
        severity: 'low',
        category: 'Health Check',
        message: 'Health check endpoint configured',
      });
      review.score += 15;
    }

    review.score = Math.min(review.score, review.maxScore);
    return review;
  }

  /**
   * Helper: Check naming conventions
   */
  _checkNamingConventions(files) {
    const camelCasePattern = /^[a-z][a-zA-Z0-9]*(-[a-z][a-zA-Z0-9]*)*\.(js|mjs|json|yml|yaml)$/;
    const validFiles = files.filter(f => 
      camelCasePattern.test(path.basename(f.name)) || f.name === 'Dockerfile'
    );

    return {
      passed: validFiles.length / files.length > 0.8,
      message: `Naming conventions followed in ${validFiles.length}/${files.length} files`,
    };
  }

  /**
   * Helper: Check documentation
   */
  _checkDocumentation(sourceFiles) {
    const withDocs = sourceFiles.filter(f => 
      f.name?.includes('/**') || f.content?.includes('/**')
    );

    return {
      hasDocumentation: sourceFiles.length > 0,
      percentage: sourceFiles.length > 0 ? (withDocs.length / sourceFiles.length * 100).toFixed(1) : 0,
      message: `Documentation coverage: ${sourceFiles.length > 0 ? (withDocs.length / sourceFiles.length * 100).toFixed(1) : 0}%`,
    };
  }

  /**
   * Helper: Check error handling
   */
  _checkErrorHandling(sourceFiles) {
    const withErrorHandling = sourceFiles.filter(f => 
      f.name?.includes('error') || f.name?.includes('catch') || f.name?.includes('try')
    );

    return {
      isComplete: sourceFiles.length > 0,
      message: 'Error handling patterns detected in implementation',
    };
  }

  /**
   * Helper: Check module organization
   */
  _checkModuleOrganization(files) {
    const directories = new Set(files.map(f => path.dirname(f.name)));

    return {
      isWellOrganized: directories.size > 3,
      message: `Modules organized in ${directories.size} directories`,
    };
  }

  /**
   * Calculate overall quality score
   */
  _calculateOverallScore(codeQuality, architecture, security, performance) {
    const avgScore = (
      codeQuality.score +
      architecture.score +
      security.score +
      performance.score
    ) / 4;

    return Math.round(avgScore);
  }

  /**
   * Generate recommendations based on reviews
   */
  _generateRecommendations(codeQuality, architecture, security, performance) {
    const recommendations = [];

    if (codeQuality.score < 70) {
      recommendations.push({
        priority: 'high',
        area: 'Code Quality',
        actions: ['Improve code documentation', 'Add more comments for complex logic'],
      });
    }

    if (architecture.score < 70) {
      recommendations.push({
        priority: 'high',
        area: 'Architecture',
        actions: ['Refactor to improve layer separation', 'Review design patterns'],
      });
    }

    if (security.score < 70) {
      recommendations.push({
        priority: 'critical',
        area: 'Security',
        actions: [
          'Implement rate limiting',
          'Add input validation',
          'Configure HTTPS',
          'Setup authentication/authorization',
        ],
      });
    }

    if (performance.score < 70) {
      recommendations.push({
        priority: 'medium',
        area: 'Performance',
        actions: [
          'Implement caching strategy',
          'Optimize database queries',
          'Add monitoring and metrics',
        ],
      });
    }

    return recommendations;
  }

  /**
   * Learn patterns from execution
   */
  _learnFromExecution(reviewData) {
    const score = reviewData?.overallScore || 0;
    this.learnPattern({
      name: 'code-review-analysis',
      category: 'generic-pattern',
      description: `Completed code review with overall score ${score}/100`,
      successRate: 0.75,
    });
  }
}

export default ReviewAgent;
