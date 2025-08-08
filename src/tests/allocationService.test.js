// allocationService.test.js

const { calculateAllocation } = require('../services/allocationService');
const config = require('../config/config.json');

describe('Smart Discount Allocation Engine Unit Tests', () => {

    // Test Case 1: Normal Case
    // Verifies that the function correctly allocates discounts proportionally based on agent scores
    // and that the total allocated amount is close to the siteKitty.
    test('should correctly allocate discount based on varied agent scores', () => {
        const input = {
            siteKitty: 10000,
            salesAgents: [
                { id: "A1", performanceScore: 90, seniorityMonths: 18, targetAchievedPercent: 85, activeClients: 12 },
                { id: "A2", performanceScore: 70, seniorityMonths: 6, targetAchievedPercent: 60, activeClients: 8 },
                { id: "A3", performanceScore: 95, seniorityMonths: 36, targetAchievedPercent: 98, activeClients: 15 },
                { id: "A4", performanceScore: 55, seniorityMonths: 2, targetAchievedPercent: 40, activeClients: 5 }
            ]
        };
        const result = calculateAllocation(input.siteKitty, input.salesAgents);

        // Assertions for a few key agents to ensure proportional distribution
        const a3Allocation = result.allocations.find(a => a.id === "A3").assignedDiscount;
        const a4Allocation = result.allocations.find(a => a.id === "A4").assignedDiscount;

        // Agent A3 has the highest scores across the board, so should get the most
        expect(a3Allocation).toBeGreaterThan(a4Allocation);

        // Agent A4 has the lowest scores, so should get the least (or near-least)
        const a2Allocation = result.allocations.find(a => a.id === "A2").assignedDiscount;
        expect(a4Allocation).toBeLessThan(a2Allocation);

        // Assert total allocation is within a small tolerance of siteKitty
        const totalAllocated = result.allocations.reduce((sum, a) => sum + a.assignedDiscount, 0);
        expect(totalAllocated).toBeCloseTo(10000, 2);
    });

    // Test Case 2: All-Same Scores Case
    // Verifies that the kitty is distributed equally when all agents have identical performance scores.
    test('should allocate equally when all agents have identical scores', () => {
        const input = {
            siteKitty: 10000,
            salesAgents: [
                { id: "A1", performanceScore: 80, seniorityMonths: 12, targetAchievedPercent: 80, activeClients: 10 },
                { id: "A2", performanceScore: 80, seniorityMonths: 12, targetAchievedPercent: 80, activeClients: 10 },
                { id: "A3", performanceScore: 80, seniorityMonths: 12, targetAchievedPercent: 80, activeClients: 10 }
            ]
        };
        const result = calculateAllocation(input.siteKitty, input.salesAgents);

        const expectedAllocations = [3333.34, 3333.33, 3333.33];

        result.allocations.forEach((a, index) => {
            expect(a.assignedDiscount).toBeCloseTo(expectedAllocations[index], 2);
        });

        const totalAllocated = result.allocations.reduce((sum, a) => sum + a.assignedDiscount, 0);
        expect(totalAllocated).toBeCloseTo(10000, 2);
    });

    // Test Case 3: Rounding and Min/Max Thresholds
    // Verifies that minimums are respected and the total kitty is still distributed.
    test('should correctly apply min/max thresholds and re-distribute funds', () => {
        const input = {
            siteKitty: 10000,
            salesAgents: [
                { id: "A1", performanceScore: 95, seniorityMonths: 24, targetAchievedPercent: 95, activeClients: 20 },
                { id: "A2", performanceScore: 50, seniorityMonths: 6, targetAchievedPercent: 50, activeClients: 5 }
            ]
        };

        const result = calculateAllocation(input.siteKitty, input.salesAgents);

        const a1Allocation = result.allocations.find(a => a.id === "A1").assignedDiscount;
        const a2Allocation = result.allocations.find(a => a.id === "A2").assignedDiscount;

        // Verify that A2 received at least the min discount.
        expect(a2Allocation).toBeGreaterThanOrEqual(config.minDiscount);

        // The total allocated amount should still be the site kitty.
        const totalAllocated = result.allocations.reduce((sum, a) => sum + a.assignedDiscount, 0);
        expect(totalAllocated).toBeCloseTo(10000, 2);
    });
});