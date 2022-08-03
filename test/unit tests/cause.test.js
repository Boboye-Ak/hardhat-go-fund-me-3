const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const hre = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { deploy, log } = deployments

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Cause", () => {
          let crowdFunder, deployer, latestCause, signer, donor, latestCauseAddress, percentCut
          const chainId = network.config.chainId
          const causeName = "My Cause Name"
          const goal = networkConfig[chainId]["goal"]
          percentCut = networkConfig[chainId]["percentCut"]
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["crowd-funder"])
              crowdFunder = await ethers.getContract("CrowdFunder", deployer)
              signer = (await ethers.getSigners())[1]
              donor = (await ethers.getSigners())[2]
              signerCrowdFunder = crowdFunder.connect(signer)
              await signerCrowdFunder.createCause(causeName, goal)
              const causeABI = (await hre.artifacts.readArtifact("Cause")).abi
              latestCauseAddress = await crowdFunder.getLatestCauseAddress()
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

          describe("Cause withdraw", () => {
              beforeEach(async () => {
                  const donationValue = ethers.utils.parseEther("2.0")
                  await donorLatestCause.donate({ value: donationValue })
              })
              it("reverts if cause is locked", async () => {
                  await crowdFunder.lock(1)
                  await expect(latestCause.withdraw()).to.be.revertedWith("Cause__IsBlocked")
              })
              it("reverts if attacker tries to withdraw", async () => {
                  await expect(donorLatestCause.withdraw()).to.be.revertedWith(
                      "Cause__OnlyCauseOwnerCanCall"
                  )
              })
              it("pays out majority share of balance of the contract to the owner and creatorContract gets a cut", async () => {
                  const initialCauseBalance = await latestCause.provider.getBalance(
                      latestCauseAddress
                  )
                  const initialSignerBalance = await latestCause.provider.getBalance(signer.address)
                  const initialCreatorContractBalance = await latestCause.provider.getBalance(
                      crowdFunder.address
                  )
                  const txResponse = await latestCause.withdraw()
                  const txReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const finalCauseBalance = await latestCause.provider.getBalance(
                      latestCauseAddress
                  )
                  const finalCreatorContractBalance = await latestCause.provider.getBalance(
                      crowdFunder.address
                  )
                  const finalSignerBalance = await latestCause.provider.getBalance(signer.address)
                  assert.isAbove(finalSignerBalance, initialSignerBalance)
                  assert.equal(finalCauseBalance.toString(), "0")
                  assert.isAbove(finalCreatorContractBalance, initialCreatorContractBalance)
              })
              it("updates state variables after withdrawing", async () => {
                  const txResponse = await latestCause.withdraw()
                  assert.equal(await latestCause.s_causeBalance(), "0")
                  assert.equal(await latestCause.s_isWithdrawn(), true)
                  assert.equal(await latestCause.s_isOpenToDonations(), false)
              })
          })
          describe("changeOwnership", () => {
              it("changes the owner of the cause when called", async () => {
                  await latestCause.changeOwnership(donor.address)
                  assert.equal(donor.address, await latestCause.s_causeOwner())
              })
          })
          describe("switchIsOpenToDonations", () => {
              it("won't allow nonOwner to close off donations", async () => {
                  await expect(donorLatestCause.switchIsOpenToDonations()).to.be.revertedWith(
                      "Cause__OnlyCauseOwnerCanCall"
                  )
              })
              it("can close off donations if owner calls", async () => {
                  await latestCause.switchIsOpenToDonations()
                  assert.equal(await latestCause.s_isOpenToDonations(), false)
              })
              it("can open donations after closing", async () => {
                  await latestCause.switchIsOpenToDonations()
                  await latestCause.switchIsOpenToDonations()
                  assert.equal(await latestCause.s_isOpenToDonations(), true)
              })
              it("can't reopen donations after withdrawal", async () => {
                  const donationValue = ethers.utils.parseEther("2.0")
                  await donorLatestCause.donate({ value: donationValue })
                  await latestCause.withdraw()
                  await expect(latestCause.switchIsOpenToDonations()).to.be.revertedWith(
                      "Cause__CannotOpenToDonationsAfterWithdrawal"
                  )
              })
          })
      })
