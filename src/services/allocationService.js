
const memoize = require('../utils/memoize');
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

const calculateAgentScoreMemoized = memoize(calculateAgentScore);

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
    if (siteKitty <= 0) {
        return {
            allocations: salesAgents.map(agent => ({
                id: agent.id,
                assignedDiscount: 0,
                justification: "No kitty available for allocation."
            }))
        };
    }

    const minDiscount = siteKitty * config.minDiscountPercent;
    const maxDiscount = siteKitty * config.maxDiscountPercent;

    const scoredAgents = [];
    let totalScore = 0;
    
    for (const agent of salesAgents) {
        const score = calculateAgentScoreMemoized(agent);
        scoredAgents.push({ ...agent, score, originalAgent: agent });
        totalScore += score;
    }

    if (totalScore === 0) {
        const equalAllocation = siteKitty / salesAgents.length;
        const finalResult = salesAgents.map(agent => ({
            id: agent.id,
            assignedDiscount: parseFloat(equalAllocation.toFixed(2)),
            justification: "All agents have identical performance scores, resulting in an equal distribution."
        }));

        const finalTotal = finalResult.reduce((sum, a) => sum + a.assignedDiscount, 0);
        const totalDiff = siteKitty - finalTotal;
        if (Math.abs(totalDiff) > 0.01) {
            finalResult[0].assignedDiscount = parseFloat((finalResult[0].assignedDiscount + totalDiff).toFixed(2));
        }
        return { allocations: finalResult };
    }

    const averageScore = totalScore / salesAgents.length;

    let allocations = [];
    const uncappedAgents = [];
    let allocatedSum = 0;
    
    for (const agent of scoredAgents) {
        const proportionalDiscount = (agent.score / totalScore) * siteKitty;
        let assignedDiscount = Math.min(proportionalDiscount, maxDiscount);
        
        const isCapped = assignedDiscount === maxDiscount;

        const allocation = {
            id: agent.id,
            assignedDiscount,
            score: agent.score,
            isCapped,
            justification: generateJustification(agent.originalAgent, agent.score, averageScore)
        };
        allocations.push(allocation);
        allocatedSum += assignedDiscount;

        if (!isCapped) {
            uncappedAgents.push(allocation);
        }
    }
    
    let remainingKitty = siteKitty - allocatedSum;
    const uncappedScoreSum = uncappedAgents.reduce((sum, a) => sum + a.score, 0);

    if (remainingKitty > 0 && uncappedScoreSum > 0) {
        for (const agent of uncappedAgents) {
            agent.assignedDiscount += (agent.score / uncappedScoreSum) * remainingKitty;
        }
    }
    
    let finalResult = allocations.map(({ id, assignedDiscount, justification }) => ({
        id,
        assignedDiscount,
        justification
    }));
    
    if (siteKitty >= salesAgents.length * minDiscount) {
        finalResult = finalResult.map(a => ({
            ...a,
            assignedDiscount: Math.max(a.assignedDiscount, minDiscount)
        }));
    }

    finalResult = finalResult.map(a => ({
        ...a,
        assignedDiscount: parseFloat(Math.max(0, a.assignedDiscount).toFixed(2))
    }));
    
    const finalTotal = finalResult.reduce((sum, a) => sum + a.assignedDiscount, 0);
    const totalDiff = siteKitty - finalTotal;

    if (Math.abs(totalDiff) > 0.01) {
        finalResult[0].assignedDiscount = parseFloat((finalResult[0].assignedDiscount + totalDiff).toFixed(2));
    }

    return { allocations: finalResult };
};
