# WEB3 CROWDFUNDING APP PROJECT

This is a hardhat project for the backend of a crowdfunding DApp built mainly for the ethereum blockchain but can be modified for any EVM compatible blockchains such as Polygon.

The Project comprises of two smart contracts. Cause.sol and CrowdFunder.sol written in solidity version 0.8.7. The CrowdFunder contract controls the dapp and can deploy cause contracts which will control individual causes.
## CrowdFunder.sol
The Crowdfunder contract controls the operations of the dapp and deploys the cause contracts.
### CrowdFunder.sol Functions
1. createCause=> To be called by the prospective cause owner to create a cause. It takes a string and an integer as arguments.

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.js
node scripts/deploy.js
npx eslint '**/*.js'
npx eslint '**/*.js' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

# Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/deploy.js
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```
