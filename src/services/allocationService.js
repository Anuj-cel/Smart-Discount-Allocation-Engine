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
    // ... (This function is fine)
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

    const { minDiscount, maxDiscount } = config;

    const agentScores = salesAgents.map(agent => ({
        id: agent.id,
        score: calculateAgentScore(agent),
        originalAgent: agent
    }));

    const totalScore = agentScores.reduce((sum, agent) => sum + agent.score, 0);

    if (totalScore === 0) {
        // Handling zero scores separately
        const equalAllocation = siteKitty / salesAgents.length;
        const finalResult = salesAgents.map(agent => ({
            id: agent.id,
            assignedDiscount: parseFloat(equalAllocation.toFixed(2)),
            justification: "All agents have identical performance scores, resulting in an equal distribution."
        }));
        
        // Final rounding to ensure exact sum
        const finalTotal = finalResult.reduce((sum, a) => sum + a.assignedDiscount, 0);
        const totalDiff = siteKitty - finalTotal;
        if (Math.abs(totalDiff) > 0.01) {
            finalResult[0].assignedDiscount = parseFloat((finalResult[0].assignedDiscount + totalDiff).toFixed(2));
        }
        return { allocations: finalResult };
    }

    const averageScore = totalScore / salesAgents.length;

    // Pass 1: Proportional distribution with max-capping
    let allocations = agentScores.map(agent => {
        const proportionalDiscount = (agent.score / totalScore) * siteKitty;
        let assignedDiscount = proportionalDiscount;
        let isCapped = false; // Using a new flag for clarity

        if (assignedDiscount > maxDiscount) {
            assignedDiscount = maxDiscount;
            isCapped = true;
        }

        return {
            id: agent.id,
            proportionalDiscount,
            assignedDiscount,
            isCapped,
            score: agent.score,
            justification: generateJustification(agent.originalAgent, agent.score, averageScore)
        };
    });

    // Pass 2: Redistribution of surplus from max-capping
    let currentTotal = allocations.reduce((sum, a) => sum + a.assignedDiscount, 0);
    let remainingKitty = siteKitty - currentTotal;
    
    if (remainingKitty > 0.01) { // Only redistribute surplus
        const uncappedAgents = allocations.filter(a => !a.isCapped);
        const uncappedScoreSum = uncappedAgents.reduce((sum, a) => sum + a.score, 0);

        if (uncappedScoreSum > 0) {
            allocations.forEach(a => {
                if (!a.isCapped) {
                    a.assignedDiscount += (a.score / uncappedScoreSum) * remainingKitty;
                }
            });
        }
    }
    
    // Pass 3: Final adjustment for minimums and rounding
    let finalResult = allocations.map(({ id, assignedDiscount, justification }) => ({
        id,
        assignedDiscount: assignedDiscount,
        justification
    }));
    
    // Check if the kitty is sufficient for all minimums
    if (siteKitty >= salesAgents.length * minDiscount) {
        finalResult = finalResult.map(a => {
            a.assignedDiscount = Math.max(a.assignedDiscount, minDiscount);
            return a;
        });
    }

    // Final rounding and sum adjustment
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