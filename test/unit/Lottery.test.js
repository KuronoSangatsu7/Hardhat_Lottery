const { inputToConfig } = require("@ethereum-waffle/compiler")
const { expect, assert } = require("chai")
const { deployments, getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery", async function () {
          let lottery,
              vrfCoordinatorV2Mock,
              chainId,
              accounts,
              lotteryEntranceFee,
              deployer,
              interval

          beforeEach(async () => {
              chainId = network.config.chainId
              accounts = await ethers.getSigners()

              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])

              lottery = await ethers.getContract("Lottery", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)

              lotteryEntranceFee = await lottery.getEntranceFee()
              interval = await lottery.getInterval()
          })

          describe("constructor", async function () {
              it("initializes the lottery correctly", async function () {
                  const lotteryState = await lottery.getLotteryState()

                  expect(lotteryState.toString()).to.equal("0")
                  expect(interval.toString()).to.equal(networkConfig[chainId]["interval"])
              })
          })

          describe("enterLottery", async function () {
              it("reverts when entrance fee is not met", async function () {
                  const value = ethers.utils.parseEther("0.1")

                  await expect(lottery.enterLottery({ value: value })).to.be.revertedWith(
                      "Lottery__FeeNotMet"
                  )
              })

              it("keeps track of players when they enter the lottery", async function () {
                  const txResponse = await lottery.enterLottery({ value: lotteryEntranceFee })
                  await txResponse.wait(1)

                  const playerAddress = await lottery.getPlayer(0)

                  expect(playerAddress).to.equal(deployer)
              })

              it("emits event on enter", async function () {
                  const txResponse = await lottery.enterLottery({ value: lotteryEntranceFee })
                  await txResponse.wait(1)

                  await expect(txResponse).to.emit(lottery, "LotteryEnter")
              })

              it("doesnt allow entrance when lottery is in calculating state", async function () {
                  const txResponse = await lottery.enterLottery({ value: lotteryEntranceFee })

                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])

                  await lottery.performUpkeep([])
                  await expect(
                      lottery.enterLottery({ value: lotteryEntranceFee })
                  ).to.be.revertedWith("Lottery__NotOpen")
              })
          })

          describe("checkUpkeep", async function () {
              it("returns false when no one is enrolled", async function () {
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])

                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([])
                  expect(upkeepNeeded).to.be.false
              })

              it("returns false if lottery isn't in an open state", async function () {
                  const txResponse = await lottery.enterLottery({ value: lotteryEntranceFee })

                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])

                  await lottery.performUpkeep([])

                  const lotteryState = await lottery.getLotteryState()
                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([])

                  expect(lotteryState).to.equal(1)
                  expect(upkeepNeeded).to.be.false
              })

              it("returns false if enough time hasn't passed", async function () {
                  await lottery.enterLottery({ value: lotteryEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep("0x")
                  expect(upkeepNeeded).to.be.false
              })

              it("returns true if enough time has passed, has players, eth, and is open", async function () {
                  await lottery.enterLottery({ value: lotteryEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  expect(upkeepNeeded).to.be.true
              })
          })

          describe("performUpkeep", async function () {
              it("it can only run if checkUpkeep is true", async function () {
                  await lottery.enterLottery({ value: lotteryEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  //assert(txResponse)
                  expect(await lottery.performUpkeep([]))
              })

              it("reverts when checkUpkeep is false", async function () {
                  await expect(lottery.performUpkeep("0x")).to.be.revertedWith(
                      "Lottery__UpKeepNotNeeded"
                  )
              })

              it("updates the lottery state, emits an event, and calls the VRFCoordinator", async function () {
                  await lottery.enterLottery({ value: lotteryEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])

                  const txResponse = await lottery.performUpkeep([])
                  const txReceipt = await txResponse.wait(1)

                  const lotteryState = await lottery.getLotteryState()
                  expect(lotteryState).to.equal(1)

                  //OR txReceipt.events[0]
                  expect(txResponse).to.emit(lottery, "RequestedLotteryWinner")

                  expect(txResponse).to.emit(vrfCoordinatorV2Mock, "RandomWordsRequested")
              })
          })

          describe("fulfillRandomWords", async function () {
              beforeEach(async function () {
                  await lottery.enterLottery({ value: lotteryEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
              })

              it("can only be called after performUpkeep", async function () {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(0, lottery.address)
                  ).to.be.revertedWith("nonexistent request")
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(1, lottery.address)
                  ).to.be.revertedWith("nonexistent request")
              })

              it("picks a winner, resets, and awards winner", async function () {
                  const additionalPlayers = accounts.slice(1, 4)
                  for (player of additionalPlayers) {
                      await lottery.connect(player).enterLottery({ value: lotteryEntranceFee })
                  }

                  const startingTimeStamp = await lottery.getLatestTimeStamp()

                  await new Promise(async (resolve, reject) => {
                      lottery.once("WinnerPicked", async () => {
                          try {
                              const recentWinner = await lottery.getRecentWinner()
                              const lotteryState = await lottery.getLotteryState()
                              const endingTimeStamp = await lottery.getLatestTimeStamp()
                              const numPlayers = await lottery.getNumPlayers()
                              const winnerEndingBalance = await accounts[1].getBalance()

                              expect(numPlayers).to.equal(0)
                              expect(lotteryState).to.equal(0)
                              expect(endingTimeStamp.toNumber()).to.be.greaterThan(
                                  startingTimeStamp.toNumber()
                              )
                              expect(winnerEndingBalance.toString()).to.equal(
                                  winnerStartingBalance
                                      .add(
                                          lotteryEntranceFee
                                              .mul(additionalPlayers.length)
                                              .add(lotteryEntranceFee)
                                      )
                                      .toString()
                              )
                          } catch (e) {
                              reject(e)
                          }
                          resolve()
                      })

                      const txResponse = await lottery.performUpkeep([])
                      const txReceipt = await txResponse.wait(1)
                      const winnerStartingBalance = await accounts[1].getBalance()
                      await vrfCoordinatorV2Mock.fulfillRandomWords(
                          txReceipt.events[1].args.requestId,
                          lottery.address
                      )
                  })
              })
          })
      })
