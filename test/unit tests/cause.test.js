const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const hre = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { deploy, log } = deployments

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Cause", () => {
          let crowdFunder, deployer, latestCause, signer, donor
          const chainId = network.config.chainId
          const causeName = "My Cause Name"
          const goal = networkConfig[chainId]["goal"]
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["crowd-funder"])
              crowdFunder = await ethers.getContract("CrowdFunder", deployer)
              signer = (await ethers.getSigners())[1]
              donor = (await ethers.getSigners())[2]
              signerCrowdFunder = crowdFunder.connect(signer)
              await signerCrowdFunder.createCause(causeName, goal)
              const causeABI = (await hre.artifacts.readArtifact("Cause")).abi
              const latestCauseAddress = await crowdFunder.getLatestCauseAddress()
              latestCause = new ethers.Contract(latestCauseAddress, causeABI, signer)
              donorLatestCause = new ethers.Contract(latestCauseAddress, causeABI, donor)
          })
          describe("donate", () => {
              it("reverts if goal is already reached", async () => {
                  await donorLatestCause.donate({ value: ethers.utils.parseEther("4.0") })
                  await expect(
                      donorLatestCause.donate({ value: ethers.utils.parseEther("1.0") })
                  ).to.be.revertedWith("Cause__GoalAlreadyReached")
              })
              it("reverts if cause is blocked", async () => {
                  await crowdFunder.lock(1)
                  await expect(
                      donorLatestCause.donate({ value: ethers.utils.parseEther("1.0") })
                  ).to.be.revertedWith("Cause__IsBlocked")
              })
              it("updates state variables and increases cause balance", async () => {
                  const donationValue = ethers.utils.parseEther("2.0")
                  await donorLatestCause.donate({ value: donationValue })
                  assert.equal((await latestCause.s_causeBalance()).toString(), donationValue)
                  assert.equal(
                      (await latestCause.provider.getBalance(latestCause.address)).toString(),
                      (await latestCause.s_causeBalance()).toString()
                  )
                  assert.equal(
                      (await latestCause.provider.getBalance(latestCause.address)).toString(),
                      donationValue
                  )
              })
          })
      })
