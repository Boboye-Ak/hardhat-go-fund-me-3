const { network } = require("hardhat")
const {networkConfig}=require("../helper-hardhat-config.js")

module.exports = async (hre) => {
  const { getNamedAccounts, deployments } = hre
  const deployer=await getNamedAccounts()
  const {deploy, log}=deployments

}

module.exports.tags = ["all", "cause"]
