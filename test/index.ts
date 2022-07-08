// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

import hre from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

describe("VotingContract", function () {
  let VotingContract;
  let votingContract: Contract;
  let owner: SignerWithAddress;
  let cnd1: SignerWithAddress;
  let cnd2: SignerWithAddress;
  let cnd3: SignerWithAddress;

  let votingID: number;

  beforeEach(async () => {
    [owner, cnd1, cnd2, cnd3] = await ethers.getSigners();
    const candidates = [cnd1.address, cnd2.address];
    VotingContract = await ethers.getContractFactory("Voting", owner);
    votingContract = await VotingContract.deploy();

    const votingTransaction = await votingContract.createVoting(candidates);
    const rc = await votingTransaction.wait();
    const votingCreatedEvent = rc.events.find(
      (event: { event: string }) => event.event === "votingCreated"
    );
    [votingID] = votingCreatedEvent.args;
  });

  describe("Deployment", function () {
    it("Deploys with correct address", async function () {
      expect(votingContract.address).to.be.properAddress;
    });
    it("Checks an owner", async function () {
      expect(await votingContract.owner()).to.equal(owner.address);
    });
  });
  describe("CreateVoting", function () {
    it("Should revert attempt to create voting not by owner", async function () {
      const candidates = [cnd1.address, cnd2.address];
      await expect(
        votingContract.connect(cnd1).createVoting(candidates)
      ).to.be.revertedWith("You are not an owner");
    });
  });
  describe("Vote", function () {
    it("Should revert attempts to double vote", async function () {
      const candidates = [cnd1.address, cnd2.address];
      votingContract.connect(owner).createVoting(candidates);
      votingContract
        .connect(cnd1)
        .vote(0, 0, { value: ethers.utils.parseEther("0.01") });
      await expect(
        votingContract
          .connect(cnd1)
          .vote(0, 0, { value: ethers.utils.parseEther("0.01") })
      ).to.be.revertedWith("You have already voted");
    });
    it("Should revert attempts to vote without wrong deposit", async function () {
      const candidates = [cnd1.address, cnd2.address];
      votingContract.connect(owner).createVoting(candidates);
      await expect(
        votingContract
          .connect(cnd1)
          .vote(0, 0, { value: ethers.utils.parseEther("0.001") })
      ).to.be.revertedWith("Transfer 0.01 ETH to vote");
    });
    it("Should revert attempt to vote in the ended voting", async function () {
      const candidates = [cnd1.address, cnd2.address];
      votingContract.connect(owner).createVoting(candidates);
      await hre.network.provider.send("evm_increaseTime", [60 * 60 * 24 * 3]);
      await expect(
        votingContract
          .connect(cnd1)
          .vote(0, 0, { value: ethers.utils.parseEther("0.01") })
      ).to.be.revertedWith("Voting has already finished");
    });
  });
  describe("EndVoting", function () {
    it("Should to be able to end voting when time has come", async function () {
      const candidates = [cnd1.address, cnd2.address];
      await votingContract.connect(owner).createVoting(candidates);
      await votingContract
        .connect(cnd1)
        .vote(0, 0, { value: ethers.utils.parseEther("0.01") });
      await hre.network.provider.send("evm_increaseTime", [60 * 60 * 24 * 3]);
      await expect(await votingContract.connect(cnd1).endVoting(0));
    });
    it("Should revert attempt to finish empty voting", async function () {
      const candidates = [cnd1.address, cnd2.address];
      await votingContract.connect(owner).createVoting(candidates);
      await hre.network.provider.send("evm_increaseTime", [60 * 60 * 24 * 3]);
      await expect(
        votingContract.connect(cnd1).endVoting(0)
      ).to.be.revertedWith("Nobody has voted");
    });
    it("Should correclty transfer prizepull", async function () {
      const candidates = [cnd1.address, cnd2.address, cnd3.address];
      await votingContract.connect(owner).createVoting(candidates);
      await votingContract
        .connect(cnd1)
        .vote(0, 0, { value: ethers.utils.parseEther("0.01") });
      await hre.network.provider.send("evm_increaseTime", [60 * 60 * 24 * 3]);
      let cnd1InitalBalance = await cnd1.getBalance();
      await votingContract.connect(owner).endVoting(0);
      await expect((await cnd1.getBalance()) > cnd1InitalBalance);
    });
    it("Should revert attempt to end voting too early", async function () {
      const candidates = [cnd1.address, cnd2.address];
      await votingContract.connect(owner).createVoting(candidates);
      await expect(
        votingContract.connect(cnd1).endVoting(0)
      ).to.be.revertedWith("Cant be finished");
    });
    it("Should display correct info about ended voting", async function () {
      const candidates = [cnd1.address, cnd2.address];
      await votingContract.connect(owner).createVoting(candidates);
      await votingContract
        .connect(cnd1)
        .vote(0, 0, { value: ethers.utils.parseEther("0.01") });
      await hre.network.provider.send("evm_increaseTime", [60 * 60 * 24 * 3]);
      const votingTransaction = await votingContract
        .connect(owner)
        .endVoting(0);
      const rc = await votingTransaction.wait();
      const votingEndedEvent = await rc.events.find(
        (event: { event: string }) => event.event === "votingFinished"
      );
      [votingID] = votingEndedEvent.args;
      await expect(votingID === 0);
    });
    it("Should increase voting end time", async function () {
      const candidates = [cnd1.address, cnd2.address];
      await votingContract.connect(owner).createVoting(candidates);
      await votingContract
        .connect(cnd1)
        .vote(0, 0, { value: ethers.utils.parseEther("0.01") });
      await votingContract
        .connect(owner)
        .vote(0, 1, { value: ethers.utils.parseEther("0.01") });
      await hre.network.provider.send("evm_increaseTime", [60 * 60 * 24 * 3]);
      const info = await votingContract.connect(owner).endInfo(0);
      const votingTransaction = await votingContract
        .connect(owner)
        .endVoting(0);
      await expect((await votingContract.connect(owner).endInfo(0)) > info);
    });
    it("Should display correct info about candidate", async function () {
      const candidates = [cnd1.address, cnd2.address];
      await votingContract.connect(owner).createVoting(candidates);
      await votingContract
        .connect(cnd1)
        .vote(0, 0, { value: ethers.utils.parseEther("0.01") });
      await votingContract
        .connect(owner)
        .vote(0, 0, { value: ethers.utils.parseEther("0.01") });
      await hre.network.provider.send("evm_increaseTime", [60 * 60 * 24 * 3]);
      const info = await votingContract.connect(owner).candidateInfo(0, 0);
      await expect(await info).to.be.equal(2);
    });
  });
  describe("Transfer", function () {
    it("Should revert attempts to transfer comission not by the owner", async function () {
      const candidates = [cnd1.address, cnd2.address];
      await votingContract.connect(owner).createVoting(candidates);
      await votingContract
        .connect(cnd1)
        .vote(0, 0, { value: ethers.utils.parseEther("0.01") });
      await expect(
        votingContract.connect(cnd3).transfer(cnd3.address)
      ).to.be.revertedWith("You are not an owner");
    });
    it("Should revert attempts to transfer null value", async function () {
      const candidates = [cnd1.address, cnd2.address];
      await votingContract.connect(owner).createVoting(candidates);
      await expect(
        votingContract.connect(owner).transfer(cnd3.address)
      ).to.be.revertedWith("Cant transfer null value");
    });
    it("Owner should be ably transfer", async function () {
      const candidates = [cnd1.address, cnd2.address];
      await votingContract.connect(owner).createVoting(candidates);
      await votingContract
        .connect(cnd1)
        .vote(0, 0, { value: ethers.utils.parseEther("0.01") });
      let cnd3InitialBalance = cnd3.getBalance();
      await votingContract.connect(owner).transfer(cnd3.address);
      await expect((await cnd3InitialBalance) < (await cnd3.getBalance()));
    });
    it("Should transfer correctly", async function () {
      const candidates = [cnd1.address, cnd2.address];
      await votingContract.connect(owner).createVoting(candidates);
      await votingContract
        .connect(cnd1)
        .vote(0, 0, { value: ethers.utils.parseEther("0.01") });
      let votingTransaction = await votingContract
        .connect(owner)
        .transfer(cnd3.address);
      let rc = await votingTransaction.wait();
      let transferEvent = rc.events.find(
        (event: { event: string }) => event.event === "transfered"
      );
      let to;
      [to] = await transferEvent.args;
      await expect(await to).to.be.equal(cnd3.address);
    });
    it("Should transfer correctly", async function () {
      const candidates = [cnd1.address, cnd2.address];
      await votingContract.connect(owner).createVoting(candidates);
      await votingContract
        .connect(cnd1)
        .vote(0, 0, { value: ethers.utils.parseEther("0.01") });
      await votingContract.connect(owner).transfer(cnd3.address);
      await expect(
        await votingContract.connect(owner).comissionInfo()
      ).to.be.equal(0);
    });
  });
});
