const hre = require("hardhat")
const { ethers, network } = require("hardhat")
const fs = require("fs")

const CAUSE_ABI_FILE = "../nextjs-go-fund-me3/constants/causeabi.json"
const CROWD_FUNDER_ABI_FILE = "../nextjs-go-fund-me3/constants/crowdfunderabi.json"
const CROWD_FUNDER_ADDRESSES_FILE = "../nextjs-go-fund-me3/constants/crowdfunderAddresses.json"
const chainId = network.config.chainId
module.exports = async () => {
    console.log("Updating frontend constants...")
    await updateAddresses()
    await updateABI()
}

const updateAddresses = async () => {
    const crowdFunder = await ethers.getContract("CrowdFunder")
    const currentAddresses = JSON.parse(fs.readFileSync(CROWD_FUNDER_ADDRESSES_FILE, "utf-8"))
    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(crowdFunder.address)) {
            currentAddresses[chainId].push(crowdFunder.address)
        }
    }
    currentAddresses[chainId] = [crowdFunder.address]
    fs.writeFileSync(CROWD_FUNDER_ADDRESSES_FILE, JSON.stringify(currentAddresses))
}
const updateABI = async () => {
    let causeABI = (await hre.artifacts.readArtifact("Cause")).abi
    let crowdFunderABI = (await hre.artifacts.readArtifact("CrowdFunder")).abi
    causeABI = { abi: causeABI }
    crowdFunderABI = { abi: crowdFunderABI }
    console.log(causeABI)
    console.log(crowdFunderABI)
    fs.writeFileSync(CAUSE_ABI_FILE, JSON.stringify(causeABI))
    fs.writeFileSync(CROWD_FUNDER_ABI_FILE, JSON.stringify(crowdFunderABI))
}

module.exports.tags = ["all", "update-frontend"]
