// This file will be updated with the actual contract ABI after compilation
// For now, we'll use a minimal ABI. Update this after running `npm run compile`

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

export const CONTRACT_ABI = [
  "function createGoal(string title, string description, uint256 targetAmount, uint256 deadline) returns (uint256)",
  "function deposit(uint256 goalId) payable",
  "function withdraw(uint256 goalId)",
  "function getGoal(uint256 goalId) view returns (tuple(address owner, string title, string description, uint256 targetAmount, uint256 deadline, uint256 balance, bool isWithdrawn))",
  "function getGoalsByOwner(address owner) view returns (uint256[])",
  "function getTotalGoals() view returns (uint256)",
  "function canWithdraw(uint256 goalId) view returns (bool)",
  "event GoalCreated(uint256 indexed goalId, address indexed owner, uint256 targetAmount, uint256 deadline)",
  "event Deposited(uint256 indexed goalId, address indexed from, uint256 amount, uint256 newBalance)",
  "event Withdrawn(uint256 indexed goalId, address indexed to, uint256 amount)"
];

export const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || "31337");
