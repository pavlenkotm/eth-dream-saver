import { useState } from 'react';
import { ethers } from 'ethers';

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

interface GoalCardProps {
  goal: Goal;
  currentAccount: string;
  onDonate: (goalId: number, amount: string) => Promise<void>;
  onWithdraw: (goalId: number) => Promise<void>;
}

export function GoalCard({ goal, currentAccount, onDonate, onWithdraw }: GoalCardProps) {
  const [donateAmount, setDonateAmount] = useState('');
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const isOwner = currentAccount.toLowerCase() === goal.owner.toLowerCase();
  const progress = Number(goal.balance) / Number(goal.targetAmount) * 100;
  const deadlineDate = new Date(Number(goal.deadline) * 1000);
  const isPastDeadline = Date.now() > deadlineDate.getTime();
  const isTargetReached = goal.balance >= goal.targetAmount;
  const remainingAmount =
    goal.targetAmount > goal.balance ? goal.targetAmount - goal.balance : 0n;
  const remainingEth = Number(ethers.formatEther(remainingAmount));
  const millisecondsInDay = 24 * 60 * 60 * 1000;
  const daysRemaining = Math.max(
    Math.ceil((deadlineDate.getTime() - Date.now()) / millisecondsInDay),
    0
  );
  const requiredDaily = daysRemaining > 0 ? remainingEth / daysRemaining : remainingEth;
  const requiredWeekly = requiredDaily * 7;

  const getStatus = () => {
    if (goal.isWithdrawn) return { label: 'Completed', class: 'completed' };
    if (isPastDeadline && !isTargetReached) return { label: 'Expired', class: 'expired' };
    if (isTargetReached) return { label: 'Target Reached!', class: 'completed' };
    return { label: 'Active', class: 'active' };
  };

  const status = getStatus();

  const formatEthValue = (value: number) => {
    if (value === 0) return '0';
    if (value < 0.001) return value.toFixed(6);
    if (value < 0.1) return value.toFixed(4);
    return value.toFixed(3);
  };

  const getCoachMessage = () => {
    if (goal.isWithdrawn) return 'Goal closed: funds already withdrawn.';
    if (isTargetReached) return 'Target hit! Withdraw anytime or keep the momentum going.';
    if (daysRemaining === 0)
      return 'Deadline reached: every new donation accelerates your unlock window.';
    if (requiredDaily === 0) return 'All set! You can already meet your target on time.';
    if (requiredDaily < 0.01)
      return 'Micro-savings pace: even tiny daily boosts will secure the goal.';
    if (requiredDaily < 0.05)
      return 'Sustainable rhythm: invite a friend or schedule light daily boosts.';
    return 'Ambitious sprint: pair consistent deposits with community support to finish strong.';
  };

  const handleDonate = async () => {
    if (!donateAmount || parseFloat(donateAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await onDonate(goal.id, donateAmount);
      setDonateAmount('');
      setShowDonateModal(false);
    } catch (error) {
      console.error('Donation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!confirm('Are you sure you want to withdraw?')) return;

    setLoading(true);
    try {
      await onWithdraw(goal.id);
    } catch (error) {
      console.error('Withdrawal error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="goal-card">
        <span className={`status-badge ${status.class}`}>{status.label}</span>
        <h3>{goal.title}</h3>
        <p>{goal.description}</p>

        <div className="goal-stats">
          <div className="goal-stat">
            <label>Target:</label>
            <value>{ethers.formatEther(goal.targetAmount)} ETH</value>
          </div>
          <div className="goal-stat">
            <label>Collected:</label>
            <value>{ethers.formatEther(goal.balance)} ETH</value>
          </div>
          <div className="goal-stat">
            <label>Deadline:</label>
            <value>{deadlineDate.toLocaleDateString()}</value>
          </div>
          <div className="goal-stat">
            <label>Owner:</label>
            <value style={{ fontSize: '0.8em', fontFamily: 'monospace' }}>
              {goal.owner.slice(0, 6)}...{goal.owner.slice(-4)}
            </value>
          </div>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
        <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
          {progress.toFixed(1)}% of goal
        </div>

        <div className="insights-panel">
          <div className="insights-header">
            <span>Smart savings coach</span>
            <span className="pill">beta</span>
          </div>

          <div className="insights-grid">
            <div className="insight-tile">
              <label>Days remaining</label>
              <div className="insight-value">
                {daysRemaining > 0 ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}` : 'Deadline reached'}
              </div>
              <small>Deadline {deadlineDate.toLocaleDateString()}</small>
            </div>
            <div className="insight-tile">
              <label>Daily pace to finish</label>
              <div className="insight-value">{formatEthValue(requiredDaily)} ETH</div>
              <small>Matching this pace reaches the target on time</small>
            </div>
            <div className="insight-tile">
              <label>Weekly boost</label>
              <div className="insight-value">{formatEthValue(requiredWeekly)} ETH</div>
              <small>Cover this weekly to stay ahead of schedule</small>
            </div>
          </div>

          <div className="insight-note">{getCoachMessage()}</div>
        </div>

        {!goal.isWithdrawn && (
          <div className="goal-actions">
            {!isOwner && (
              <button onClick={() => setShowDonateModal(true)} disabled={loading}>
                Donate
              </button>
            )}
            {isOwner && (isPastDeadline || isTargetReached) && (
              <button onClick={handleWithdraw} disabled={loading}>
                {loading ? 'Processing...' : 'Withdraw'}
              </button>
            )}
          </div>
        )}
      </div>

      {showDonateModal && (
        <div className="modal" onClick={() => setShowDonateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Donate to: {goal.title}</h3>
            <div className="form-group">
              <label>Amount (ETH)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={donateAmount}
                onChange={(e) => setDonateAmount(e.target.value)}
                placeholder="0.1"
              />
            </div>
            <div className="modal-actions">
              <button onClick={handleDonate} disabled={loading}>
                {loading ? 'Processing...' : 'Confirm Donation'}
              </button>
              <button
                className="secondary"
                onClick={() => setShowDonateModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
