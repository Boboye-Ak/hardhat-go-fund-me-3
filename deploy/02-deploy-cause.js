const { network, ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config.js")
const { verify } = require("../utils/verify.js")

module.exports = async (hre) => {
    const { getNamedAccounts, deployments } = hre
    const { deployer } = await getNamedAccounts()
    const { deploy, log } = deployments
    const chainId = network.config.chainId
    console.log(chainId)
    const signers = await ethers.getSigners()
    const causeOwner = signers[1]
    const crowdFunder = await ethers.getContract("CrowdFunder")
    const causeOwnerCrowdFunder = await crowdFunder.connect(causeOwner)
    const causeName = "Dummy Cause Name"
    const goal = networkConfig[chainId]["goal"]
    const causeId = await causeOwnerCrowdFunder.s_nextCauseId()
    constructorArgs = [
        causeName,
        goal,
        causeOwner.address,
        networkConfig[chainId]["percentCut"],
        causeId,
    ]
    args = [causeName, goal]
    const transactionResponse = await causeOwnerCrowdFunder.createCause(causeName, goal)
    const transactionReceipt = await transactionResponse.wait(1)
    const latestCause = await causeOwnerCrowdFunder.getLatestCauseAddress()
    log(
        `New Cause deployed at ${latestCause} with ${transactionReceipt.gasUsed} gas used from ${causeOwner.address}`
    )

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        console.log("Verifying...")
        await verify(latestCause, constructorArgs)
    }
    const causeABI = (await hre.artifacts.readArtifact("Cause")).abi

    const latestCauseContract = new ethers.Contract(latestCause, causeABI, causeOwner)
    await latestCauseContract.setCauseURI(
        "https://gateway.pinata.cloud/ipfs/QmNQo4nRyPgNzCJwix6N1FGwiEKBnU2V7H8AtSex5Ahid5"
    )
    log("----------------------------- ")
}

module.exports.tags = ["all", "cause"]
