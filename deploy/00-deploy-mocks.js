const { developmentChains } = require("../helper-hardhat-config")
const { ethers } = require("hardhat")

const DECIMALS = "18"
const INITIAL_PRICE = ethers.parseUnits("2000", "ether")

module.exports = async function (hre) {
    const { deployments, getNamedAccounts, network, ethers } = hre

    const BASE_FEE = ethers.parseEther("0.25")
    const GAS_PRICE_LINK = 1e9

    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const args = [BASE_FEE, GAS_PRICE_LINK]

    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying Mocks...")
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        })
        await deploy("MockV3Aggregator", {
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_PRICE],
        })
        log("Mocks deployed!")
        log("--------------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
