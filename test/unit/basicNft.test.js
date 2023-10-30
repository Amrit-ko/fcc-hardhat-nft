const { network, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.scip
    : describe("BasicNft Unit Test", async function () {
          let basicNft, accounts, deployer
          const chainId = network.config.chainId

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture("basicNft")
              basicNft = await ethers.getContract("BasicNft", deployer)
          })
          describe("Constructor", function () {
              it("Assigns all variables correctly", async () => {
                  assert.equal(await basicNft.name(), "Doggie")
                  assert.equal(await basicNft.symbol(), "DOG")
                  assert.equal(await basicNft.getTokenCounter(), 0n)
              })
          })
          describe("mintNft function", function () {
              it("Assigns NFT to sender", async () => {
                  const tx = await basicNft.mintNft()
                  await tx.wait(1)
                  assert.equal(await basicNft.ownerOf(0), deployer.address)
              })
              it("Increases token counter", async () => {
                  const counterBefore = await basicNft.getTokenCounter()
                  const tx = await basicNft.mintNft()
                  await tx.wait(1)
                  assert.equal(await basicNft.getTokenCounter(), counterBefore + 1n)
              })
          })
      })
