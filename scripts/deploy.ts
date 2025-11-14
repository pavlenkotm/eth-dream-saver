import { ethers } from "hardhat";

async function main() {
  console.log("Deploying DreamSaver contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const DreamSaver = await ethers.getContractFactory("DreamSaver");
  const dreamSaver = await DreamSaver.deploy();

  await dreamSaver.waitForDeployment();

  const contractAddress = await dreamSaver.getAddress();

  console.log("✅ DreamSaver deployed to:", contractAddress);
  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log("Contract Address:", contractAddress);
  console.log("Deployer:", deployer.address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);

  // Save deployment info
  console.log("\n📝 Save this contract address for your frontend:");
  console.log(`VITE_CONTRACT_ADDRESS=${contractAddress}`);

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
