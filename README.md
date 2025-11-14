# Dream Saver - Ethereum Saving Goals DApp

**Dream Saver** is a decentralized application (DApp) built on Ethereum that allows users to create saving goals (piggy banks) for their dreams. Users can set a target amount and deadline, receive donations from others, and withdraw funds when conditions are met.

## Overview

Dream Saver demonstrates a complete Web3 development stack:
- **Smart Contract**: Written in Solidity with comprehensive security checks
- **Testing**: Full test coverage using Hardhat and Chai
- **Frontend**: Modern React + TypeScript interface with Ethers.js
- **Deployment**: Ready for testnet and mainnet deployment

## Features

### Smart Contract Features
- **Create Saving Goals**: Set a title, description, target amount, and deadline
- **Receive Donations**: Anyone can contribute ETH to any goal
- **Withdraw Funds**: Goal owners can withdraw when:
  - Target amount is reached, OR
  - Deadline has passed
- **Track Progress**: View all goals and their current status
- **Security**: Built-in protections against common vulnerabilities

### Frontend Features
- **Wallet Integration**: Connect with MetaMask or compatible wallets
- **Create Goals**: User-friendly form to create new saving goals
- **Browse Goals**: View all goals or filter by your own goals
- **Donate**: Send ETH to support others' dreams
- **Withdraw**: Claim your funds when conditions are met
- **Real-time Updates**: Automatic updates when blockchain events occur

## Technology Stack

- **Smart Contract**: Solidity ^0.8.20
- **Framework**: Hardhat
- **Testing**: Hardhat, Chai, Ethers.js
- **Frontend**: React 18, TypeScript, Vite
- **Web3 Library**: Ethers.js v6
- **Styling**: CSS3 with responsive design

## Installation

### Prerequisites

- Node.js v18 or higher
- npm or yarn
- MetaMask or compatible Ethereum wallet

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/eth-dream-saver.git
cd eth-dream-saver
```

### 2. Install Smart Contract Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 4. Configure Environment

Copy the example environment files and configure them:

```bash
# Root .env for Hardhat
cp .env.example .env

# Frontend .env for contract address
cp frontend/.env.example frontend/.env
```

Edit `.env` and add your configuration:
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**⚠️ IMPORTANT**: Never commit your `.env` file with real private keys!

## Usage

### Compile Smart Contract

```bash
npm run compile
```

This will compile the smart contract and generate TypeScript types in `typechain-types/`.

### Run Tests

```bash
npm test
```

Expected output:
```
  DreamSaver
    Goal Creation
      ✓ Should create a goal successfully
      ✓ Should fail if target amount is 0
      ✓ Should fail if deadline is in the past
      ... (more tests)

  30 passing (2s)
```

### Deploy to Local Network

1. Start a local Hardhat node:
```bash
npm run node
```

2. In a new terminal, deploy the contract:
```bash
npm run deploy:localhost
```

3. Copy the deployed contract address and update `frontend/.env`:
```env
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_CHAIN_ID=31337
```

### Deploy to Sepolia Testnet

1. Get Sepolia ETH from a faucet:
   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
   - [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

2. Deploy:
```bash
npm run deploy:sepolia
```

3. Update `frontend/.env` with the contract address and chain ID:
```env
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
VITE_CHAIN_ID=11155111
```

### Run Frontend

```bash
npm run frontend:dev
```

The frontend will be available at `http://localhost:3000`

### Using the DApp

1. **Connect Wallet**: Click "Connect Wallet" and approve the connection
2. **Create a Goal**:
   - Click "Create Goal" tab
   - Fill in title, description, target amount (in ETH), and deadline
   - Click "Create Goal" and confirm the transaction
3. **Donate to Goals**:
   - Browse "All Goals"
   - Click "Donate" on any goal
   - Enter amount and confirm transaction
4. **Withdraw Funds**:
   - Go to "My Goals"
   - Click "Withdraw" when conditions are met
   - Confirm transaction

## Smart Contract Architecture

### Main Functions

#### `createGoal(title, description, targetAmount, deadline)`
Creates a new saving goal.

**Parameters:**
- `title`: Goal title (string)
- `description`: Goal description (string)
- `targetAmount`: Target amount in wei (uint256)
- `deadline`: Unix timestamp for deadline (uint256)

**Requirements:**
- Target amount > 0
- Deadline > current time
- Title not empty

#### `deposit(goalId)`
Deposit ETH to a goal.

**Parameters:**
- `goalId`: ID of the goal (uint256)

**Requirements:**
- Goal must exist
- Amount > 0
- Goal not already withdrawn

#### `withdraw(goalId)`
Withdraw funds from your goal.

**Parameters:**
- `goalId`: ID of the goal (uint256)

**Requirements:**
- Caller must be goal owner
- Goal not already withdrawn
- Either deadline passed OR target reached
- Balance > 0

### Events

```solidity
event GoalCreated(uint256 indexed goalId, address indexed owner, uint256 targetAmount, uint256 deadline);
event Deposited(uint256 indexed goalId, address indexed from, uint256 amount, uint256 newBalance);
event Withdrawn(uint256 indexed goalId, address indexed to, uint256 amount);
```

### Security Considerations

- **Reentrancy Protection**: Uses checks-effects-interactions pattern
- **Access Control**: Withdrawal restricted to goal owner
- **Input Validation**: All inputs validated with `require` statements
- **Integer Overflow**: Safe with Solidity 0.8.x built-in checks
- **Failed Transfers**: Proper error handling for ETH transfers

## Testing

The test suite covers:

- ✅ Goal creation (success and failure cases)
- ✅ Deposits (success and edge cases)
- ✅ Withdrawals (by deadline and target)
- ✅ Withdrawal restrictions
- ✅ View functions
- ✅ Event emissions
- ✅ Access control
- ✅ Edge cases (zero amounts, non-existent goals, etc.)

Run tests with coverage:
```bash
npx hardhat coverage
```

## Project Structure

```
eth-dream-saver/
├── contracts/
│   └── DreamSaver.sol          # Main smart contract
├── test/
│   └── DreamSaver.test.ts      # Comprehensive test suite
├── scripts/
│   └── deploy.ts               # Deployment script
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── GoalCard.tsx
│   │   │   ├── CreateGoalForm.tsx
│   │   │   └── GoalsList.tsx
│   │   ├── hooks/              # Custom React hooks
│   │   │   └── useContract.ts
│   │   ├── pages/              # Page components
│   │   ├── utils/              # Utility functions
│   │   │   └── contract.ts
│   │   ├── App.tsx             # Main app component
│   │   ├── main.tsx            # Entry point
│   │   └── index.css           # Styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── hardhat.config.ts           # Hardhat configuration
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Roadmap

### Phase 1: Core Features (Completed)
- ✅ Basic smart contract
- ✅ Comprehensive testing
- ✅ Frontend interface
- ✅ Wallet integration

### Phase 2: Enhancements (Planned)
- [ ] Multi-token support (ERC20 tokens)
- [ ] Goal categories and tags
- [ ] Social features (comments, likes)
- [ ] Goal sharing and embedding
- [ ] Advanced analytics dashboard

### Phase 3: Advanced Features (Future)
- [ ] Automated savings (scheduled deposits)
- [ ] Milestone rewards
- [ ] NFT badges for completed goals
- [ ] Integration with DeFi protocols (yield farming)
- [ ] Mobile app (React Native)
- [ ] Gasless transactions (meta-transactions)

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Hardhat](https://hardhat.org/)
- Frontend powered by [React](https://react.dev/) and [Vite](https://vitejs.dev/)
- Web3 integration via [Ethers.js](https://docs.ethers.org/)
- Inspired by the Ethereum community

## Support

For questions or issues:
- Open an issue on GitHub
- Contact: your-email@example.com

## Disclaimer

This is educational software. Use at your own risk. Always test thoroughly on testnets before deploying to mainnet.

---

**Happy Saving! 💰✨**
