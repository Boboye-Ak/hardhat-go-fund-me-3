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
        let signer, signerCrowdFunder, causeABI
        beforeEach(async () => {
          signer = (await ethers.getSigners())[1]
          signerCrowdFunder = crowdFunder.connect(signer)
          await signerCrowdFunder.createCause(causeName, goal)
          causeABI = (await hre.artifacts.readArtifact("Cause")).abi
        })
        it("doesn't allow multiple cause creation by same wallet", async () => {
          await expect(
            signerCrowdFunder.createCause(causeName, goal)
          ).to.be.revertedWith("CrowdFunder__ThisWalletAlreadyHasACause")
        })
        it("Initializes cause contract properly", async () => {
          //get latest cause contract
          const latestCauseAddress = await crowdFunder.getLatestCauseAddress()
          const latestCause = new ethers.Contract(
            latestCauseAddress,
            causeABI,
            signer
          )
          const expectedCauseCreatorContractAddress = await crowdFunder.address
          const causeCreatorContractAddress =
            await latestCause.s_causeCreatorContract()
          const expectedCauseName = await latestCause.s_causeName()
          const causeOwner = await latestCause.s_causeOwner()
          const expectedGoal = await latestCause.i_goal()
          assert.equal(expectedCauseName, causeName)
          assert.equal(causeOwner, signer.address)
          assert.equal(goal, expectedGoal.toString())
          assert.equal(
            expectedCauseCreatorContractAddress,
            causeCreatorContractAddress
          )
        })
        it("Updates state variables", async () => {
          const latestCauseAddress = await crowdFunder.getLatestCauseAddress()
          assert.equal((await crowdFunder.s_nextCauseId()).toString(), "2")
          assert.equal(await crowdFunder.s_causes(0), latestCauseAddress)
          assert.equal(await crowdFunder.hasCause(signer.address), "1")
        })
      })
      describe("sponsorSite", () => {
        it("accepts donations", async () => {
          await crowdFunder.sponsorSite({ value: ethers.utils.parseEther("0.1") })
          const contractBalance = await crowdFunder.provider.getBalance(
            crowdFunder.address
          )
          assert.equal(
            ethers.utils.parseEther("0.1"),
            contractBalance.toString()
          )
        })
      })
      describe("Withdraw", () => {})
    })
