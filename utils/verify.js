const { run } = require("hardhat")

module.exports.verify = async (contractAddress, args) => {
    console.log(`verifying contract ${contractAddress}`)
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
        console.log(`contract ${contractAddress} has been verified`)
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already verified")
        } else {
            console.log(e)
        }
    }
}
