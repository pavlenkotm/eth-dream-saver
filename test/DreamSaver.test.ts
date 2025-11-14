import { expect } from "chai";
import { ethers } from "hardhat";
import { DreamSaver } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("DreamSaver", function () {
  let dreamSaver: DreamSaver;
  let owner: HardhatEthersSigner;
  let donor1: HardhatEthersSigner;
  let donor2: HardhatEthersSigner;

  const ONE_ETH = ethers.parseEther("1");
  const TWO_ETH = ethers.parseEther("2");
  const HALF_ETH = ethers.parseEther("0.5");

  beforeEach(async function () {
    [owner, donor1, donor2] = await ethers.getSigners();

    const DreamSaverFactory = await ethers.getContractFactory("DreamSaver");
    dreamSaver = await DreamSaverFactory.deploy();
    await dreamSaver.waitForDeployment();
  });

  describe("Goal Creation", function () {
    it("Should create a goal successfully", async function () {
      const futureDeadline = (await time.latest()) + 86400; // 1 day from now

      const tx = await dreamSaver.createGoal(
        "My Dream Car",
        "Saving for a Tesla Model 3",
        ONE_ETH,
        futureDeadline
      );

      await expect(tx)
        .to.emit(dreamSaver, "GoalCreated")
        .withArgs(0, owner.address, ONE_ETH, futureDeadline);

      const goal = await dreamSaver.getGoal(0);
      expect(goal.owner).to.equal(owner.address);
      expect(goal.title).to.equal("My Dream Car");
      expect(goal.description).to.equal("Saving for a Tesla Model 3");
      expect(goal.targetAmount).to.equal(ONE_ETH);
      expect(goal.deadline).to.equal(futureDeadline);
      expect(goal.balance).to.equal(0);
      expect(goal.isWithdrawn).to.equal(false);
    });

    it("Should fail if target amount is 0", async function () {
      const futureDeadline = (await time.latest()) + 86400;

      await expect(
        dreamSaver.createGoal(
          "My Dream",
          "Description",
          0,
          futureDeadline
        )
      ).to.be.revertedWith("Target amount must be greater than 0");
    });

    it("Should fail if deadline is in the past", async function () {
      const pastDeadline = (await time.latest()) - 86400;

      await expect(
        dreamSaver.createGoal(
          "My Dream",
          "Description",
          ONE_ETH,
          pastDeadline
        )
      ).to.be.revertedWith("Deadline must be in the future");
    });

    it("Should fail if title is empty", async function () {
      const futureDeadline = (await time.latest()) + 86400;

      await expect(
        dreamSaver.createGoal(
          "",
          "Description",
          ONE_ETH,
          futureDeadline
        )
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("Should increment goal IDs correctly", async function () {
      const futureDeadline = (await time.latest()) + 86400;

      await dreamSaver.createGoal("Goal 1", "First", ONE_ETH, futureDeadline);
      await dreamSaver.createGoal("Goal 2", "Second", ONE_ETH, futureDeadline);
      await dreamSaver.createGoal("Goal 3", "Third", ONE_ETH, futureDeadline);

      expect(await dreamSaver.getTotalGoals()).to.equal(3);
    });

    it("Should track goals by owner", async function () {
      const futureDeadline = (await time.latest()) + 86400;

      await dreamSaver.connect(owner).createGoal("Owner Goal 1", "Description", ONE_ETH, futureDeadline);
      await dreamSaver.connect(donor1).createGoal("Donor1 Goal 1", "Description", ONE_ETH, futureDeadline);
      await dreamSaver.connect(owner).createGoal("Owner Goal 2", "Description", ONE_ETH, futureDeadline);

      const ownerGoals = await dreamSaver.getGoalsByOwner(owner.address);
      const donor1Goals = await dreamSaver.getGoalsByOwner(donor1.address);

      expect(ownerGoals.length).to.equal(2);
      expect(donor1Goals.length).to.equal(1);
      expect(ownerGoals[0]).to.equal(0);
      expect(ownerGoals[1]).to.equal(2);
      expect(donor1Goals[0]).to.equal(1);
    });
  });

  describe("Deposits", function () {
    let goalId: number;

    beforeEach(async function () {
      const futureDeadline = (await time.latest()) + 86400;
      const tx = await dreamSaver.createGoal(
        "My Dream",
        "Description",
        TWO_ETH,
        futureDeadline
      );
      await tx.wait();
      goalId = 0;
    });

    it("Should accept deposits successfully", async function () {
      const depositTx = await dreamSaver.connect(donor1).deposit(goalId, {
        value: ONE_ETH,
      });

      await expect(depositTx)
        .to.emit(dreamSaver, "Deposited")
        .withArgs(goalId, donor1.address, ONE_ETH, ONE_ETH);

      const goal = await dreamSaver.getGoal(goalId);
      expect(goal.balance).to.equal(ONE_ETH);
    });

    it("Should accumulate multiple deposits", async function () {
      await dreamSaver.connect(donor1).deposit(goalId, { value: ONE_ETH });
      await dreamSaver.connect(donor2).deposit(goalId, { value: HALF_ETH });

      const goal = await dreamSaver.getGoal(goalId);
      expect(goal.balance).to.equal(ONE_ETH + HALF_ETH);
    });

    it("Should allow owner to deposit to their own goal", async function () {
      await dreamSaver.connect(owner).deposit(goalId, { value: ONE_ETH });

      const goal = await dreamSaver.getGoal(goalId);
      expect(goal.balance).to.equal(ONE_ETH);
    });

    it("Should fail if deposit amount is 0", async function () {
      await expect(
        dreamSaver.connect(donor1).deposit(goalId, { value: 0 })
      ).to.be.revertedWith("Deposit amount must be greater than 0");
    });

    it("Should fail if goal does not exist", async function () {
      await expect(
        dreamSaver.connect(donor1).deposit(999, { value: ONE_ETH })
      ).to.be.revertedWith("Goal does not exist");
    });

    it("Should fail if goal has been withdrawn", async function () {
      // Deposit enough to reach target
      await dreamSaver.connect(donor1).deposit(goalId, { value: TWO_ETH });

      // Withdraw
      await dreamSaver.connect(owner).withdraw(goalId);

      // Try to deposit again
      await expect(
        dreamSaver.connect(donor1).deposit(goalId, { value: ONE_ETH })
      ).to.be.revertedWith("Goal has already been withdrawn");
    });
  });

  describe("Withdrawals", function () {
    let goalId: number;
    let futureDeadline: number;

    beforeEach(async function () {
      futureDeadline = (await time.latest()) + 86400;
      const tx = await dreamSaver.createGoal(
        "My Dream",
        "Description",
        TWO_ETH,
        futureDeadline
      );
      await tx.wait();
      goalId = 0;
    });

    it("Should allow withdrawal when target is reached", async function () {
      await dreamSaver.connect(donor1).deposit(goalId, { value: TWO_ETH });

      const initialBalance = await ethers.provider.getBalance(owner.address);

      const withdrawTx = await dreamSaver.connect(owner).withdraw(goalId);
      const receipt = await withdrawTx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      await expect(withdrawTx)
        .to.emit(dreamSaver, "Withdrawn")
        .withArgs(goalId, owner.address, TWO_ETH);

      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.equal(initialBalance + TWO_ETH - gasUsed);

      const goal = await dreamSaver.getGoal(goalId);
      expect(goal.isWithdrawn).to.equal(true);
      expect(goal.balance).to.equal(0);
    });

    it("Should allow withdrawal when deadline has passed", async function () {
      await dreamSaver.connect(donor1).deposit(goalId, { value: ONE_ETH });

      // Fast forward time past deadline
      await time.increaseTo(futureDeadline + 1);

      const withdrawTx = await dreamSaver.connect(owner).withdraw(goalId);

      await expect(withdrawTx)
        .to.emit(dreamSaver, "Withdrawn")
        .withArgs(goalId, owner.address, ONE_ETH);

      const goal = await dreamSaver.getGoal(goalId);
      expect(goal.isWithdrawn).to.equal(true);
    });

    it("Should fail if called by non-owner", async function () {
      await dreamSaver.connect(donor1).deposit(goalId, { value: TWO_ETH });

      await expect(
        dreamSaver.connect(donor1).withdraw(goalId)
      ).to.be.revertedWith("Only goal owner can withdraw");
    });

    it("Should fail if target not reached and deadline not passed", async function () {
      await dreamSaver.connect(donor1).deposit(goalId, { value: ONE_ETH });

      await expect(
        dreamSaver.connect(owner).withdraw(goalId)
      ).to.be.revertedWith("Cannot withdraw: deadline not passed and target not reached");
    });

    it("Should fail if already withdrawn", async function () {
      await dreamSaver.connect(donor1).deposit(goalId, { value: TWO_ETH });
      await dreamSaver.connect(owner).withdraw(goalId);

      await expect(
        dreamSaver.connect(owner).withdraw(goalId)
      ).to.be.revertedWith("Goal has already been withdrawn");
    });

    it("Should fail if balance is 0", async function () {
      // Fast forward time past deadline
      await time.increaseTo(futureDeadline + 1);

      await expect(
        dreamSaver.connect(owner).withdraw(goalId)
      ).to.be.revertedWith("No balance to withdraw");
    });

    it("Should fail if goal does not exist", async function () {
      await expect(
        dreamSaver.connect(owner).withdraw(999)
      ).to.be.revertedWith("Goal does not exist");
    });
  });

  describe("View Functions", function () {
    it("Should return correct goal details", async function () {
      const futureDeadline = (await time.latest()) + 86400;
      await dreamSaver.createGoal(
        "Test Goal",
        "Test Description",
        ONE_ETH,
        futureDeadline
      );

      const goal = await dreamSaver.getGoal(0);

      expect(goal.owner).to.equal(owner.address);
      expect(goal.title).to.equal("Test Goal");
      expect(goal.description).to.equal("Test Description");
      expect(goal.targetAmount).to.equal(ONE_ETH);
      expect(goal.deadline).to.equal(futureDeadline);
    });

    it("Should return correct canWithdraw status", async function () {
      const futureDeadline = (await time.latest()) + 86400;
      await dreamSaver.createGoal("Test", "Desc", TWO_ETH, futureDeadline);

      // Initially cannot withdraw
      expect(await dreamSaver.canWithdraw(0)).to.equal(false);

      // After reaching target, can withdraw
      await dreamSaver.connect(donor1).deposit(0, { value: TWO_ETH });
      expect(await dreamSaver.canWithdraw(0)).to.equal(true);

      // After withdrawal, cannot withdraw again
      await dreamSaver.withdraw(0);
      expect(await dreamSaver.canWithdraw(0)).to.equal(false);
    });

    it("Should return correct canWithdraw after deadline", async function () {
      const futureDeadline = (await time.latest()) + 86400;
      await dreamSaver.createGoal("Test", "Desc", TWO_ETH, futureDeadline);
      await dreamSaver.connect(donor1).deposit(0, { value: ONE_ETH });

      // Before deadline, cannot withdraw
      expect(await dreamSaver.canWithdraw(0)).to.equal(false);

      // After deadline, can withdraw
      await time.increaseTo(futureDeadline + 1);
      expect(await dreamSaver.canWithdraw(0)).to.equal(true);
    });

    it("Should fail to get non-existent goal", async function () {
      await expect(dreamSaver.getGoal(999)).to.be.revertedWith("Goal does not exist");
    });
  });
});
