🧠 Smart Discount Allocation Engine
📑 Table of Contents

    Introduction

    Approach and Justification

    Assumptions Made

    How to Run

    Sample Inputs & Outputs

    Unit Tests

1. Introduction

This project presents a Smart Discount Allocation Engine built using JavaScript (Node.js), designed to fairly distribute a fixed discount kitty among sales agents at a specific location. The system is data-driven, transparent, and easily extensible, considering multiple agent attributes such as performance, seniority, and sales targets to calculate a justifiable allocation for each agent.
2. Approach and Justification

At the heart of this engine is a weighted score-based allocation system, chosen for its:

    Flexibility

    Fairness

    Transparency

🚀 Process Breakdown:

    Normalization of Attributes:
    All attributes (performanceScore, seniorityMonths, targetAchievedPercent, activeClients) are scaled between 0 and 1, so each contributes fairly regardless of its original range.

    Weighted Scoring:
    Each normalized attribute is multiplied by a configurable weight. The final score is a sum of these weighted attributes.

    Proportional Allocation:
    Each agent's discount is proportional to their score relative to the total score pool. This ensures the total distributed amount exactly equals the available siteKitty.

    Justification Generation:
    A clear justification is generated for each agent based on their strengths (e.g., "top performer", "long-term contributor"), making the allocation process transparent and explainable.

3. Assumptions Made

    Attribute Validity:
    All input attributes are expected to be valid and within logical ranges (e.g., performanceScore and targetAchievedPercent between 0–100, seniorityMonths and activeClients non-negative).

    Input Format:
    The input JSON follows a defined structure with all required fields.

    No Min/Max Limits:
    No hard limits (minimum or maximum discount per agent) are enforced in the base version. Everything is proportional.

    Rounding:
    Allocated discounts are rounded to the nearest integer. If a rounding mismatch occurs, the difference is added to the highest-scoring agent to maintain accuracy.

4. How to Run
✅ Prerequisites:

    Node.js (v12 or higher)

📦 Setup:

    Save the code file as allocateDiscounts.js

    Create an input JSON file (e.g., input.json) with the proper format (see below)

🛠️ Run the script:

node allocateDiscounts.js input.json

🧾 Output:

The script will print the allocation result JSON directly to the console.
5. Sample Inputs & Outputs
🔽 Sample Input (input.json)

{
  "siteKitty": 10000,
  "salesAgents": [
    {
      "id": "A1",
      "performanceScore": 90,
      "seniorityMonths": 18,
      "targetAchievedPercent": 85,
      "activeClients": 12
    },
    {
      "id": "A2",
      "performanceScore": 70,
      "seniorityMonths": 6,
      "targetAchievedPercent": 60,
      "activeClients": 8
    }
  ]
}

🔼 Sample Output:

{
  "allocations": [
    {
      "id": "A1",
      "assignedDiscount": 6250,
      "justification": "Top performer with high client engagement and long-term contribution."
    },
    {
      "id": "A2",
      "assignedDiscount": 3750,
      "justification": "Consistent performance and steady contribution."
    }
  ],
  "totalAllocated": 10000,
  "remainingKitty": 0
}

6. Unit Tests

The following test cases are included to ensure correctness:

    ✅ Normal Case:
    Multiple agents with different scores — verifies weighted, proportional logic.

    ⚖️ All-Same Scores:
    All agents have equal values — output should equally divide the kitty.

    🔁 Rounding Edge Case:
    Verifies rounding logic and checks if leftover is properly handled.