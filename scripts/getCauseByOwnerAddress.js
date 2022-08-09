const {ethers, getNamedAccounts}=require("hardhat")


const main=async()=>{
    const deployer=(await getNamedAccounts()).deployer
    const crowdFunder=await ethers.getContract("CrowdFunder", deployer)
    const result=await crowdFunder.getCauseIdByOwnerAddress("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")
    console.log(result.toString())
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });