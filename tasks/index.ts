/* eslint-disable prettier/prettier */
import { task, types } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import { ethers } from "hardhat";

task("createVoting", "Creates a new voting")
    .addParam("contract", "Contract address")
    .addParam("candidates", "Candidates' addresses")
    .setAction(async (args, { ethers }) => {
        
        try {
        const addresses = await args.candidates;
        const candidates = await addresses.split(',');
        const VotingContract = await ethers.getContractFactory("Voting");
        const votingContract = await VotingContract.attach(args.contract);
        const transaction = await votingContract.createVoting(candidates);
        console.log(`Voting with candidates ${candidates} created`);
        }
        catch (e) {
            console.log("e")
        }
    });
task("vote", "Does a vote")
    .addParam("contract", "Contract address")
    .addParam("vid", "Voting ID")
    .addParam("cid", "Candidate ID")
    .setAction(async (args, { ethers }) => {
        
        const VotingContract = await ethers.getContractFactory("Voting");
        const votingContract = await VotingContract.attach(args.contract);
        const transaction = await votingContract.vote(args.vid, args.cid, { value: ethers.utils.parseEther("0.01") });
        console.log(`Sucessfully voted for ${args.cid} candidate from ${args.vid} voting`);
        
    });
task("endVoting", "Finishes voting")
    .addParam("contract", "Contract address")
    .addParam("vid", "Voting ID")
    .setAction(async (args, { ethers }) => {
        
        try {
        const VotingContract = await ethers.getContractFactory("Voting");
        const votingContract = await VotingContract.attach(args.contract);
        const transaction = await votingContract.endVoting(args.vid);
        console.log(`Sucessfully finished ${args.vid} voting`);
        }
        catch (e) {
            console.log("e")
        }
    });
task("transfer", "Transfers comission to the address")
    .addParam("contract", "Contract address")
    .addParam("to", "Address to transfer comission")
    .setAction(async (args, { ethers }) => {
        
        
        const VotingContract = await ethers.getContractFactory("Voting");
        const votingContract = await VotingContract.attach(args.contract);
        const transaction = await votingContract.transfer(args.to);
        console.log(`Sucessfully transfered comission to ${args.to}`);
        
    });
task("comission", "Comission on the platfrom")
    .addParam("contract", "Contract address")
    .setAction(async (args, { ethers }) => {
        
        try {
        const VotingContract = await ethers.getContractFactory("Voting");
        const votingContract = await VotingContract.attach(args.contract);
        const transaction = await votingContract.comissionInfo();
        console.log(`Comission is ${transaction}`);
        }
        catch (e) {
            console.log("e")
        }
    });
task("cinfo", "Info about candidate")
    .addParam("contract", "Contract address")
    .addParam("vid", "Voting ID")
    .addParam("cid", "Candidate ID")
    .setAction(async (args, { ethers }) => {
        
        try {
        const VotingContract = await ethers.getContractFactory("Voting");
        const votingContract = await VotingContract.attach(args.contract);
        const transaction = await votingContract.candidateInfo(args.vid, args.cid);
        console.log(`Candidates votes - ${transaction}`);
        }
        catch (e) {
            console.log("e")
        }
    });