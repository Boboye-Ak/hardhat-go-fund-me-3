const { ethers } = require("hardhat")

const networkConfig = {
    4: {
        name: "rinkeby",
        goal: ethers.utils.parseEther("3.0"),
        percentCut: "300",
    },

    31337: {
        name: "hardhat",
        goal: ethers.utils.parseEther("3.0"),
        percentCut: "300",
    },
    5: {
        name: "goerli",
        goal: ethers.utils.parseEther("3.0"),
        percentCut: "300",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = { networkConfig, developmentChains }
