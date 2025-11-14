import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useContract } from './hooks/useContract';
import { CreateGoalForm } from './components/CreateGoalForm';
import { GoalsList } from './components/GoalsList';

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

type TabType = 'my-goals' | 'all-goals' | 'create';

function App() {
  const { account, contract, isConnected, connectWallet, disconnectWallet } = useContract();
  const [activeTab, setActiveTab] = useState<TabType>('all-goals');
  const [myGoals, setMyGoals] = useState<Goal[]>([]);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && contract) {
      loadGoals();
      setupEventListeners();
    }
  }, [isConnected, contract, account]);

  const setupEventListeners = () => {
    if (!contract) return;

    contract.on('GoalCreated', () => {
      loadGoals();
    });

    contract.on('Deposited', () => {
      loadGoals();
    });

    contract.on('Withdrawn', () => {
      loadGoals();
    });

    return () => {
      contract.removeAllListeners();
    };
  };

  const loadGoals = async () => {
    if (!contract) return;

    setLoading(true);
    try {
      const totalGoals = await contract.getTotalGoals();
      const allGoalsData: Goal[] = [];

      for (let i = 0; i < Number(totalGoals); i++) {
        const goal = await contract.getGoal(i);
        allGoalsData.push({
          id: i,
          owner: goal.owner,
          title: goal.title,
          description: goal.description,
          targetAmount: goal.targetAmount,
          deadline: goal.deadline,
          balance: goal.balance,
          isWithdrawn: goal.isWithdrawn,
        });
      }

      setAllGoals(allGoalsData);

      // Filter user's goals
      if (account) {
        const userGoals = allGoalsData.filter(
          (goal) => goal.owner.toLowerCase() === account.toLowerCase()
        );
        setMyGoals(userGoals);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (
    title: string,
    description: string,
    targetAmount: string,
    deadline: number
  ) => {
    if (!contract) throw new Error('Contract not initialized');

    const targetWei = ethers.parseEther(targetAmount);
    const tx = await contract.createGoal(title, description, targetWei, deadline);
    await tx.wait();

    // Switch to my goals tab after creating
    setActiveTab('my-goals');
  };

  const handleDonate = async (goalId: number, amount: string) => {
    if (!contract) throw new Error('Contract not initialized');

    const amountWei = ethers.parseEther(amount);
    const tx = await contract.deposit(goalId, { value: amountWei });
    await tx.wait();

    alert('Donation successful!');
  };

  const handleWithdraw = async (goalId: number) => {
    if (!contract) throw new Error('Contract not initialized');

    const tx = await contract.withdraw(goalId);
    await tx.wait();

    alert('Withdrawal successful!');
  };

  if (!isConnected) {
    return (
      <div className="app">
        <div className="header">
          <h1>Dream Saver</h1>
          <p>Save for your dreams on Ethereum</p>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ marginBottom: '20px', fontSize: '1.1rem' }}>
            Connect your wallet to start saving for your dreams
          </p>
          <button onClick={connectWallet} style={{ fontSize: '1.1rem', padding: '15px 30px' }}>
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <h1>Dream Saver</h1>
        <p>Save for your dreams on Ethereum</p>
      </div>

      <div className="wallet-info">
        <div>
          <strong>Connected:</strong>{' '}
          <span className="wallet-address">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
        </div>
        <button className="secondary" onClick={disconnectWallet}>
          Disconnect
        </button>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'all-goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('all-goals')}
        >
          All Goals ({allGoals.length})
        </button>
        <button
          className={`tab ${activeTab === 'my-goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-goals')}
        >
          My Goals ({myGoals.length})
        </button>
        <button
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Goal
        </button>
      </div>

      {activeTab === 'create' && <CreateGoalForm onCreateGoal={handleCreateGoal} />}

      {activeTab === 'all-goals' && (
        <div>
          <h2 style={{ marginBottom: '20px' }}>All Saving Goals</h2>
          <GoalsList
            goals={allGoals}
            currentAccount={account}
            loading={loading}
            onDonate={handleDonate}
            onWithdraw={handleWithdraw}
          />
        </div>
      )}

      {activeTab === 'my-goals' && (
        <div>
          <h2 style={{ marginBottom: '20px' }}>My Saving Goals</h2>
          <GoalsList
            goals={myGoals}
            currentAccount={account}
            loading={loading}
            onDonate={handleDonate}
            onWithdraw={handleWithdraw}
          />
        </div>
      )}
    </div>
  );
}

export default App;
