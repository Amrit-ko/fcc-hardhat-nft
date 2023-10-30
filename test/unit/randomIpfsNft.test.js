const { network, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.scip
    : describe("RandomIpfsNft Unit Test", async function () {
          let randomIpfs, accounts, deployer, vrfCoordinatorV2Mock, vrfCoordinatorV2Address

          const chainId = network.config.chainId
          const subscriptionId = networkConfig[chainId].subscriptionId
          const gasLane = networkConfig[chainId].gasLane
          const callbackGasLimit = networkConfig[chainId].callbackGasLimit
          const tokenUris = [
              "ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo",
              "ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d",
              "ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm",
          ]
          const mintFee = networkConfig[chainId].mintFee
          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture("all")
              randomIpfs = await ethers.getContract("RandomIpfsNft", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              vrfCoordinatorV2Address = vrfCoordinatorV2Mock.target
          })
          describe("Constructor", function () {
              it("Assigns all variables correctly", async () => {
                  assert.equal(await randomIpfs.name(), "Random IPFS NFT")
                  assert.equal(await randomIpfs.symbol(), "RIN")
                  assert.equal(await randomIpfs.getDogTokenUris(0), tokenUris[0])
                  assert.equal(await randomIpfs.getMintFee(), mintFee)
              })
          })

          describe("requestNft function", function () {
              it("reverts if not enough ETH send", async () => {
                  await expect(randomIpfs.requestNft()).to.be.revertedWithCustomError(
                      randomIpfs,
                      "RandomIpfsNft__NeedMoreETHSent",
                  )
              })

              it("sends request", async () => {
                  const tx = await randomIpfs.requestNft({ value: mintFee })
                  const txReceipt = await tx.wait(1)
                  assert.equal(txReceipt.logs[1].args.requestId, 1n)
              })

              it("emits NftRequested event", async () => {
                  await expect(randomIpfs.requestNft({ value: mintFee })).to.emit(
                      randomIpfs,
                      "NftRequested",
                  )
              })

              it("adds sender address to s_requestIdToSender mapping ", async () => {
                  const tx = await randomIpfs.requestNft({ value: mintFee })
                  const txReceipt = await tx.wait(1)
                  assert.equal(
                      await randomIpfs.s_requestIdToSender(txReceipt.logs[1].args.requestId),
                      deployer.address,
                  )
              })
          })

          describe("fulfillRandomWords function", function () {
              it("fulfills random word", async () => {
                  let tx = await randomIpfs.requestNft({ value: mintFee })
                  let txReceipt = await tx.wait(1)
                  tx = await vrfCoordinatorV2Mock.fulfillRandomWords(
                      txReceipt.logs[1].args.requestId,
                      randomIpfs.target,
                  )
                  txReceipt = await tx.wait(1)
                  assert.equal(txReceipt.logs[2].args.success, true)
              })
              it("mints NFT", async () => {
                  const tokenId = await randomIpfs.getTokenCounter()
                  const tx = await randomIpfs.requestNft({ value: mintFee })
                  const txReceipt = await tx.wait(1)
                  await vrfCoordinatorV2Mock.fulfillRandomWords(
                      txReceipt.logs[1].args.requestId,
                      randomIpfs.target,
                  )

                  assert.equal(await randomIpfs.ownerOf(tokenId), deployer.address)
                  assert.equal(await randomIpfs.getTokenCounter(), tokenId + 1n)
              })
          })
          describe("getBreedFromModdedRng function", () => {
              it("returns pug if moddedRng < 10", async function () {
                  const breed = await randomIpfs.getBreedFromModdedRng(9)
                  assert.equal(0, breed)
              })
              it("returns shiba-inu if moddedRng is between 10 - 39", async function () {
                  const breed = await randomIpfs.getBreedFromModdedRng(33)
                  assert.equal(1, breed)
              })
              it("returns st. bernard if moddedRng is between 40 - 99", async function () {
                  const breed = await randomIpfs.getBreedFromModdedRng(99)
                  assert.equal(2, breed)
              })
              it("reverts if moddedRng > 99", async function () {
                  await expect(randomIpfs.getBreedFromModdedRng(108)).to.be.revertedWithCustomError(
                      randomIpfs,
                      "RandomIpfsNft__RangeOutOfBounds",
                  )
              })
          })
      })
