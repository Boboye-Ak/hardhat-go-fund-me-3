const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const hre = require("hardhat")
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("CrowdFunder", () => {
      let crowdFunder, deployer
      const chainId = network.config.chainId
      const causeName = "My Cause Name"
      const goal = networkConfig[chainId]["goal"]
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["crowd-funder"])
        crowdFunder = await ethers.getContract("CrowdFunder", deployer)
      })
      describe("constructor", () => {
        it("initializes correctly", async () => {
          let contractOwner = await crowdFunder.getContractOwner()
          let percentCut = await crowdFunder.getPercentCut()
          let nextCauseId = await crowdFunder.s_nextCauseId()
          assert.equal(deployer, contractOwner)
          assert.equal(networkConfig[chainId]["percentCut"], percentCut)
          assert.equal("1", nextCauseId.toString())
        })
      })
      describe("createCause", () => {
        let signer, signerCrowdFunder
        beforeEach(async () => {
          signer = (await ethers.getSigners())[1]
          signerCrowdFunder = crowdFunder.connect(signer)
          await signerCrowdFunder.createCause(causeName, goal)
          const causeABI = await hre.artifacts.readArtifact("Cause").abi
        })
        it("doesn't allow multiple cause creation by same wallet", async () => {
          await expect(
            signerCrowdFunder.createCause(causeName, goal)
          ).to.be.revertedWith("CrowdFunder__ThisWalletAlreadyHasACause")
        })
      })
    })
