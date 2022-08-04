const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const hre = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { deploy, log } = deployments

developmentChains.includes(network.name)
    ? describe.skip
    : describe("CrowdFunder", () => {
          //account 0 deploys CrowdFunder,
          //account 1 creates cause,
          //accounts 2, 3 and 4 donate to the cause
          //and account 1 withdraws
          let crowdFunder, deployer, accounts, donationValue
          const chainId = network.config.chainId
          const causeName = "My Cause Name"
          const goal = networkConfig[chainId]["goal"]
          donationValue = ethers.utils.parseEther("1.0")
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              crowdFunder = await ethers.getContract("CrowdFunder", deployer)
              accounts = await ethers.getSigners()
          })
          it("Creates a cause, takes donations and allows the owner to withdraw from the cause", async () => {
              //create cause
              const causeCrowdFunder = await crowdFunder.connect(accounts[1])
              await causeCrowdFunder.createCause(causeName, goal)
              const latestCauseAddress = await crowdFunder.getLatestCauseAddress()
              const causeABI = (await hre.artifacts.readArtifact("Cause")).abi
              const latestCause = new ethers.Contract(latestCauseAddress, causeABI, accounts[1])
              const donor1LatestCause = await latestCause.connect(accounts[2])
              const donor2LatestCause = await latestCause.connect(accounts[3])
              const donor3LatestCause = await latestCause.connect(accounts[4])
              //donors donate to cause
              await donor1LatestCause.donate({ value: donationValue })
              await donor2LatestCause.donate({ value: donationValue })
              await donor3LatestCause.donate({ value: donationValue })
              const causeInitialBalance = await latestCause.provider.getBalance(latestCause.address)
              const causeOwnerInitialBalance = await accounts[1].getBalance()
              //owner withdraws from cause
              await latestCause.withdraw()
              const causeOwnerFinalBalance = await accounts[1].getBalance()
          })
      })
