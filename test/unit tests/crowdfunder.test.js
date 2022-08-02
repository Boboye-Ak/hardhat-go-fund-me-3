const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const hre = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

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
                  await expect(signerCrowdFunder.createCause(causeName, goal)).to.be.revertedWith(
                      "CrowdFunder__ThisWalletAlreadyHasACause"
                  )
              })
              it("Initializes cause contract properly", async () => {
                  //get latest cause contract
                  const latestCauseAddress = await crowdFunder.getLatestCauseAddress()
                  const latestCause = new ethers.Contract(latestCauseAddress, causeABI, signer)
                  const expectedCauseCreatorContractAddress = await crowdFunder.address
                  const causeCreatorContractAddress = await latestCause.s_causeCreatorContract()
                  const expectedCauseName = await latestCause.s_causeName()
                  const causeOwner = await latestCause.s_causeOwner()
                  const expectedGoal = await latestCause.i_goal()
                  assert.equal(expectedCauseName, causeName)
                  assert.equal(causeOwner, signer.address)
                  assert.equal(goal, expectedGoal.toString())
                  assert.equal(expectedCauseCreatorContractAddress, causeCreatorContractAddress)
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
                  await crowdFunder.sponsorSite({
                      value: ethers.utils.parseEther("0.1"),
                  })
                  const contractBalance = await crowdFunder.provider.getBalance(crowdFunder.address)
                  assert.equal(ethers.utils.parseEther("0.1"), contractBalance.toString())
              })
          })
          describe("Withdraw", () => {
              beforeEach(async () => {
                  await crowdFunder.sponsorSite({
                      value: ethers.utils.parseEther("0.1"),
                  })
              })
              it("only allows the owner of the contract to call it", async () => {
                  const attacker = (await ethers.getSigners())[1]
                  const attackerCrowdFunder = await crowdFunder.connect(attacker)
                  await expect(attackerCrowdFunder.withdraw()).to.be.revertedWith(
                      "CrowdFunder__OnlyOwnerCanCallThis"
                  )
              })
              it("pays the balance of the contract to the owner", async () => {
                  const initialDeployerBalance = await crowdFunder.provider.getBalance(deployer)
                  const initialCrowdfunderBalance = await crowdFunder.provider.getBalance(
                      crowdFunder.address
                  )
                  const transactionResponse = await crowdFunder.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const endingDeployerBalance = await crowdFunder.provider.getBalance(deployer)
                  const endingCrowdFunderBalance = await crowdFunder.provider.getBalance(
                      crowdFunder.address
                  )
                  assert(endingCrowdFunderBalance.toString(), "0")
                  assert(
                      endingDeployerBalance.add(gasCost),
                      initialCrowdfunderBalance.add(initialDeployerBalance)
                  )
              })
          })
          describe("lock and unlock", () => {
              let signer, signerCrowdFunder, causeABI, latestCauseAddress, latestCause
              beforeEach(async () => {
                  signer = (await ethers.getSigners())[1]
                  signerCrowdFunder = crowdFunder.connect(signer)
                  await signerCrowdFunder.createCause(causeName, goal)
                  causeABI = (await hre.artifacts.readArtifact("Cause")).abi
                  latestCauseAddress = await crowdFunder.getLatestCauseAddress()
                  latestCause = new ethers.Contract(latestCauseAddress, causeABI, signer)
              })
              it("doesn't allow nonOwner addresses lock or unlock", async () => {
                  await expect(signerCrowdFunder.lock(1)).to.be.revertedWith(
                      "CrowdFunder__OnlyOwnerCanCallThis"
                  )
                  await expect(signerCrowdFunder.unlock(1)).to.be.revertedWith(
                      "CrowdFunder__OnlyOwnerCanCallThis"
                  )
              })
              it("locks a selected cause when called", async () => {
                  await crowdFunder.lock(1)
                  assert.equal(await latestCause.s_isBlocked(), true)
              })
              it("unlocks a selected cause when called", async () => {
                  await crowdFunder.lock(1)
                  await crowdFunder.unlock(1)
                  assert.equal(await latestCause.s_isBlocked(), false)
              })
          })
          describe("View Functions", () => {
              let signer,
                  donor,
                  signerCrowdFunder,
                  latestCause,
                  donorLatestCause,
                  latestCauseAddress
              beforeEach(async () => {
                  signer = (await ethers.getSigners())[1]
                  donor = (await ethers.getSigners())[2]
                  signerCrowdFunder = crowdFunder.connect(signer)
                  await signerCrowdFunder.createCause(causeName, goal)
                  const causeABI = (await hre.artifacts.readArtifact("Cause")).abi
                  latestCauseAddress = await crowdFunder.getLatestCauseAddress()
                  latestCause = new ethers.Contract(latestCauseAddress, causeABI, signer)
                  donorLatestCause = new ethers.Contract(latestCauseAddress, causeABI, donor)
              })
              it("gets cause address correctly by Id correctly", async () => {
                  assert(await crowdFunder.getCauseById(1), latestCauseAddress)
              })
              it("gets cause address correctly by owner wallet", async()=>{
                assert((await crowdFunder.getCauseAddressByOwnerWallet(signer.address)), latestCauseAddress)
              })
              it("gets cause address based on the sender address", async()=>{
                assert((await signerCrowdFunder.getMyCause()), latestCauseAddress)
              })
          })
      })
