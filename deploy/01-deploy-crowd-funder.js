const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config.js")

module.exports = async (hre) => {
  const { getNamedAccounts, deployments } = hre
  const {deployer} = await getNamedAccounts()
  const { deploy, log } = deployments
  const chainId = network.config.chainId
  const percentCut = networkConfig[chainId]["percentCut"]
  args = [percentCut]
  log(deployer)
  const crowdFunder = await deploy("CrowdFunder", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  })
  log(`CrowdFunder address is ${crowdFunder.address}`)
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    console.log("Verifying...")
    await verify(crowdFunder.address, args)
  }
  log("----------------------------- ")
}

module.exports.tags = ["all", "crowd-funder"]
