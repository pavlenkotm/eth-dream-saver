// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DreamSaver
 * @dev A smart contract piggy bank for saving towards goals on Ethereum
 * @notice Users can create saving goals, receive donations, and withdraw when conditions are met
 */
contract DreamSaver {
    struct SavingGoal {
        address owner;
        string title;
        string description;
        uint256 targetAmount;
        uint256 deadline;
        uint256 balance;
        bool isWithdrawn;
    }

    // Storage
    mapping(uint256 => SavingGoal) private goals;
    mapping(address => uint256[]) private ownerGoals;
    uint256 private nextGoalId;

    // Events
    event GoalCreated(
        uint256 indexed goalId,
        address indexed owner,
        uint256 targetAmount,
        uint256 deadline
    );

    event Deposited(
        uint256 indexed goalId,
        address indexed from,
        uint256 amount,
        uint256 newBalance
    );

    event Withdrawn(
        uint256 indexed goalId,
        address indexed to,
        uint256 amount
    );

    /**
     * @dev Creates a new saving goal
     * @param title The title of the saving goal
     * @param description A description of what the goal is for
     * @param targetAmount The target amount to save (in wei)
     * @param deadline Unix timestamp when the goal can be withdrawn regardless of target
     * @return goalId The ID of the newly created goal
     */
    function createGoal(
        string memory title,
        string memory description,
        uint256 targetAmount,
        uint256 deadline
    ) external returns (uint256) {
        require(targetAmount > 0, "Target amount must be greater than 0");
        require(deadline > block.timestamp, "Deadline must be in the future");
        require(bytes(title).length > 0, "Title cannot be empty");

        uint256 goalId = nextGoalId;
        nextGoalId++;

        goals[goalId] = SavingGoal({
            owner: msg.sender,
            title: title,
            description: description,
            targetAmount: targetAmount,
            deadline: deadline,
            balance: 0,
            isWithdrawn: false
        });

        ownerGoals[msg.sender].push(goalId);

        emit GoalCreated(goalId, msg.sender, targetAmount, deadline);

        return goalId;
    }

    /**
     * @dev Deposits ETH into a saving goal
     * @param goalId The ID of the goal to deposit to
     */
    function deposit(uint256 goalId) external payable {
        require(goalExists(goalId), "Goal does not exist");
        require(msg.value > 0, "Deposit amount must be greater than 0");
        require(!goals[goalId].isWithdrawn, "Goal has already been withdrawn");

        goals[goalId].balance += msg.value;

        emit Deposited(goalId, msg.sender, msg.value, goals[goalId].balance);
    }

    /**
     * @dev Withdraws the balance from a saving goal
     * @param goalId The ID of the goal to withdraw from
     * @notice Can only be called by the goal owner
     * @notice Withdrawal is allowed if deadline passed OR target amount reached
     */
    function withdraw(uint256 goalId) external {
        require(goalExists(goalId), "Goal does not exist");
        require(msg.sender == goals[goalId].owner, "Only goal owner can withdraw");
        require(!goals[goalId].isWithdrawn, "Goal has already been withdrawn");

        SavingGoal storage goal = goals[goalId];

        bool deadlinePassed = block.timestamp >= goal.deadline;
        bool targetReached = goal.balance >= goal.targetAmount;

        require(
            deadlinePassed || targetReached,
            "Cannot withdraw: deadline not passed and target not reached"
        );

        uint256 amount = goal.balance;
        require(amount > 0, "No balance to withdraw");

        goal.isWithdrawn = true;
        goal.balance = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawn(goalId, msg.sender, amount);
    }

    /**
     * @dev Gets the details of a saving goal
     * @param goalId The ID of the goal
     * @return The SavingGoal struct
     */
    function getGoal(uint256 goalId) external view returns (SavingGoal memory) {
        require(goalExists(goalId), "Goal does not exist");
        return goals[goalId];
    }

    /**
     * @dev Gets all goal IDs owned by an address
     * @param owner The address to get goals for
     * @return An array of goal IDs
     */
    function getGoalsByOwner(address owner) external view returns (uint256[] memory) {
        return ownerGoals[owner];
    }

    /**
     * @dev Gets the total number of goals created
     * @return The total number of goals
     */
    function getTotalGoals() external view returns (uint256) {
        return nextGoalId;
    }

    /**
     * @dev Checks if a goal can be withdrawn
     * @param goalId The ID of the goal
     * @return True if the goal can be withdrawn
     */
    function canWithdraw(uint256 goalId) external view returns (bool) {
        if (!goalExists(goalId)) return false;

        SavingGoal memory goal = goals[goalId];

        if (goal.isWithdrawn) return false;
        if (goal.balance == 0) return false;

        bool deadlinePassed = block.timestamp >= goal.deadline;
        bool targetReached = goal.balance >= goal.targetAmount;

        return deadlinePassed || targetReached;
    }

    /**
     * @dev Internal function to check if a goal exists
     * @param goalId The ID of the goal
     * @return True if the goal exists
     */
    function goalExists(uint256 goalId) private view returns (bool) {
        return goalId < nextGoalId;
    }
}
