import { useState } from 'react';

interface CreateGoalFormProps {
  onCreateGoal: (
    title: string,
    description: string,
    targetAmount: string,
    deadline: number
  ) => Promise<void>;
}

export function CreateGoalForm({ onCreateGoal }: CreateGoalFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadlineDays, setDeadlineDays] = useState('30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      setError('Target amount must be greater than 0');
      return;
    }

    const days = parseInt(deadlineDays);
    if (!days || days <= 0) {
      setError('Deadline must be at least 1 day in the future');
      return;
    }

    setLoading(true);

    try {
      const deadline = Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
      await onCreateGoal(title, description, targetAmount, deadline);

      // Reset form
      setTitle('');
      setDescription('');
      setTargetAmount('');
      setDeadlineDays('30');
      setSuccess('Goal created successfully!');

      setTimeout(() => setSuccess(''), 5000);
    } catch (error: any) {
      console.error('Error creating goal:', error);
      setError(error.message || 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Create Your Dream Saving Goal</h2>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Goal Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., My Dream Car, House Down Payment"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your dream and why you're saving for it..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="targetAmount">Target Amount (ETH) *</label>
          <input
            id="targetAmount"
            type="number"
            step="0.001"
            min="0"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="1.0"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="deadline">Deadline (days from now) *</label>
          <input
            id="deadline"
            type="number"
            min="1"
            value={deadlineDays}
            onChange={(e) => setDeadlineDays(e.target.value)}
            placeholder="30"
            required
          />
          <small style={{ color: '#666', fontSize: '0.9rem' }}>
            You can withdraw after this deadline, even if target is not reached
          </small>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Goal'}
        </button>
      </form>
    </div>
  );
}
