import { GoalCard } from './GoalCard';

interface Goal {
  id: number;
  owner: string;
  title: string;
  description: string;
  targetAmount: bigint;
  deadline: bigint;
  balance: bigint;
  isWithdrawn: boolean;
}

interface GoalsListProps {
  goals: Goal[];
  currentAccount: string;
  loading: boolean;
  onDonate: (goalId: number, amount: string) => Promise<void>;
  onWithdraw: (goalId: number) => Promise<void>;
}

export function GoalsList({
  goals,
  currentAccount,
  loading,
  onDonate,
  onWithdraw,
}: GoalsListProps) {
  if (loading) {
    return <div className="loading">Loading goals...</div>;
  }

  if (goals.length === 0) {
    return (
      <div className="empty-state">
        <h3>No goals yet</h3>
        <p>Be the first to create a saving goal!</p>
      </div>
    );
  }

  return (
    <div className="goals-grid">
      {goals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          currentAccount={currentAccount}
          onDonate={onDonate}
          onWithdraw={onWithdraw}
        />
      ))}
    </div>
  );
}
