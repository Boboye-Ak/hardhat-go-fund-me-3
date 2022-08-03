const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const hre = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { deploy, log } = deployments

developmentChains.includes(network.name)
    ? describe.skip
    : describe("CrowdFunder", () => {
          let crowdFunder, deployer
          const chainId = network.config.chainId
          const causeName = "My Cause Name"
          const goal = networkConfig[chainId]["goal"]
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              crowdFunder = await ethers.getContract("CrowdFunder", deployer)
          })
      })
