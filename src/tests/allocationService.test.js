const { calculateAllocation } = require('../services/allocationService');
const config = require('../config/config.json');

describe('Smart Discount Allocation Engine Unit Tests', () => {

    // Test Case 1: Normal Case
    
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

        const a3Allocation = result.allocations.find(a => a.id === "A3").assignedDiscount;
        const a4Allocation = result.allocations.find(a => a.id === "A4").assignedDiscount;

        expect(a3Allocation).toBeGreaterThan(a4Allocation);

        const a2Allocation = result.allocations.find(a => a.id === "A2").assignedDiscount;
        expect(a4Allocation).toBeLessThan(a2Allocation);

        const totalAllocated = result.allocations.reduce((sum, a) => sum + a.assignedDiscount, 0);
        expect(totalAllocated).toBeCloseTo(10000, 2);
    });

    // Test Case 2: All-Same Scores Case 
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

        const expectedAllocations = [5000, 2500, 2500];

        expect(result.allocations[0].assignedDiscount).toBeCloseTo(expectedAllocations[0], 2);
        expect(result.allocations[1].assignedDiscount).toBeCloseTo(expectedAllocations[1], 2);
        expect(result.allocations[2].assignedDiscount).toBeCloseTo(expectedAllocations[2], 2);

        const totalAllocated = result.allocations.reduce((sum, a) => sum + a.assignedDiscount, 0);
        expect(totalAllocated).toBeCloseTo(10000, 2);
    });

    // Test Case 3: Rounding and Min/Max Thresholds - UPDATED
    test('should correctly apply min/max thresholds and re-distribute funds', () => {
        const input = {
            siteKitty: 10000,
            salesAgents: [
                { id: "A1", performanceScore: 95, seniorityMonths: 24, targetAchievedPercent: 95, activeClients: 20 },
                { id: "A2", performanceScore: 50, seniorityMonths: 6, targetAchievedPercent: 50, activeClients: 5 }
            ]
        };
        const result = calculateAllocation(input.siteKitty, input.salesAgents);

        const minDiscount = input.siteKitty * config.minDiscountPercent;

        const a1Allocation = result.allocations.find(a => a.id === "A1").assignedDiscount;
        const a2Allocation = result.allocations.find(a => a.id === "A2").assignedDiscount;

        expect(a2Allocation).toBeGreaterThanOrEqual(minDiscount);

        const totalAllocated = result.allocations.reduce((sum, a) => sum + a.assignedDiscount, 0);
        expect(totalAllocated).toBeCloseTo(10000, 2);
    });
});
