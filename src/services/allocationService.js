const config = require('../config/config.json');

const normalize = (value, cap) => (value / cap) * 100;

const calculateAgentScore = (agent) => {
  const { performanceScore, seniorityMonths, targetAchievedPercent, activeClients } = agent;
  const { weights, normalizationCaps } = config;

  const normalizedSeniority = Math.min(seniorityMonths, normalizationCaps.seniorityMonths);
  const normalizedClients = Math.min(activeClients, normalizationCaps.activeClients);

  const weightedScore =
    (performanceScore * weights.performanceScore) +
    (normalize(normalizedSeniority, normalizationCaps.seniorityMonths) * weights.seniorityMonths) +
    (targetAchievedPercent * weights.targetAchievedPercent) +
    (normalize(normalizedClients, normalizationCaps.activeClients) * weights.activeClients);

  return weightedScore;
};

const generateJustification = (agent, agentScore, averageScore) => {
  if (agentScore > averageScore * 1.1) {
    return "Consistently high performance and long-term contribution, excelling in all key metrics.";
  }
  if (agentScore > averageScore * 0.9) {
    return "Above average performance with consistent contribution across key metrics.";
  }
  if (agentScore < averageScore * 0.7) {
    return "Performance below the group average, with a focus on improving key metrics.";
  }
  return "Moderate performance with potential for growth.";
};

exports.calculateAllocation = (siteKitty, salesAgents) => {
  if (!salesAgents || salesAgents.length === 0) {
    return { allocations: [] };
  }

  const agentScores = salesAgents.map(agent => ({
    id: agent.id,
    score: calculateAgentScore(agent),
    originalAgent: agent
  }));

  const totalScore = agentScores.reduce((sum, agent) => sum + agent.score, 0);
  const averageScore = totalScore / salesAgents.length;
  const { minDiscount, maxDiscount } = config;

  let allocations = [];
  let totalAssigned = 0;
  let unclampedScoresSum = 0;

  // If totalScore is 0, all scores are 0, so distribute equally.
  if (totalScore === 0) {
    const equalAllocation = siteKitty / salesAgents.length;
    allocations = salesAgents.map(agent => ({
      id: agent.id,
      assignedDiscount: equalAllocation,
      justification: "All agents have identical performance scores, resulting in an equal distribution."
    }));
  } else {
    // First pass: Calculate proportional allocation and apply clamping
    allocations = agentScores.map(agent => {
      let assignedDiscount = (agent.score / totalScore) * siteKitty;
      let isClamped = false;
      let justification = generateJustification(agent.originalAgent, agent.score, averageScore);

      if (assignedDiscount < minDiscount) {
        assignedDiscount = minDiscount;
        isClamped = true;
      } else if (assignedDiscount > maxDiscount) {
        assignedDiscount = maxDiscount;
        isClamped = true;
      }

      return {
        id: agent.id,
        originalDiscount: (agent.score / totalScore) * siteKitty,
        assignedDiscount,
        isClamped,
        score: agent.score,
        justification
      };
    });

    // Calculate total assigned and identify unclamped agents
    const initialTotalAssigned = allocations.reduce((sum, a) => sum + a.assignedDiscount, 0);
    const difference = siteKitty - initialTotalAssigned;

    if (Math.abs(difference) > 0.01) {
      const redistributableAgents = allocations.filter(a => !a.isClamped);
      const redistributableScore = redistributableAgents.reduce((sum, a) => sum + a.score, 0);

      // Second pass: Redistribute the surplus or deficit proportionally among unclamped agents
      if (redistributableScore > 0) {
        allocations.forEach(a => {
          if (!a.isClamped) {
            a.assignedDiscount += (a.score / redistributableScore) * difference;
          }
        });
      }
    }
  }

  // Final pass: Round and ensure the sum is exactly the kitty
  const finalResult = allocations.map(({ id, assignedDiscount, justification }) => ({
    id,
    assignedDiscount: parseFloat(Math.max(0, assignedDiscount).toFixed(2)),
    justification
  }));

  const finalTotal = finalResult.reduce((sum, a) => sum + a.assignedDiscount, 0);
  const totalDiff = siteKitty - finalTotal;

  // Adjust the first agent to account for any final rounding difference
  if (Math.abs(totalDiff) > 0.01) {
    finalResult[0].assignedDiscount = parseFloat((finalResult[0].assignedDiscount + totalDiff).toFixed(2));
  }
  
  return { allocations: finalResult };
};