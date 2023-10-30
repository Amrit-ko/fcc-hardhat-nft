const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts }) => {
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    const basicNft = await ethers.getContract("BasicNft", deployer)
    let tx = await basicNft.mintNft()
    await tx.wait(1)
    console.log(`BasicNft tokenUri at index 0:`, await basicNft.tokenURI(0))

    const randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
    const mintFee = await randomIpfsNft.getMintFee()
    tx = await randomIpfsNft.requestNft({ value: mintFee })
    const txReceipt = await tx.wait(1)
    const requestId = txReceipt.logs[1].args.requestId
    await new Promise(async (resolve, reject) => {
        setTimeout(() => reject("Timeout: 'NFTMinted' event did not fire"), 300000)
        randomIpfsNft.once("NftMinted", async () => {
            console.log("RandomIpfsNft tokenUri at index 0:", await randomIpfsNft.tokenURI(0))
            resolve()
        })
        if (developmentChains.includes(network.name)) {
            vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            tx = await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNft.target)
            await tx.wait(1)
        }
    })

    const dynamicSvgNft = await ethers.getContract("DynamicSvgNft", deployer)
    tx = await dynamicSvgNft.mintNft(108)
    await tx.wait(1)
    console.log("DynamicSvgNft tokenUri at index 0:", await dynamicSvgNft.tokenURI(0))
}

module.exports.tags = ["all", "mint"]
