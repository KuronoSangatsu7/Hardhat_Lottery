const { expect, assert } = require("chai")
const { deployments, getNamedAccounts, ethers, network } = require("hardhat")
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery", async function () {
          let lottery, lotteryEntranceFee, deployer, accounts

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              lottery = await ethers.getContract("Lottery", deployer)
              lotteryEntranceFee = await lottery.getEntranceFee()
              accounts = await ethers.getSigners()
          })

          describe("fulfillRandomWords", async function () {
              it("works with live chainlink keepers and VRF to get a random winner", async function () {
                  const startingTimeStamp = await lottery.getLatestTimeStamp()

                  await new Promise(async (resolve, reject) => {
                      lottery.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired")

                          try {
                              const recentWinner = await lottery.getRecentWinner()
                              const lotteryState = await lottery.getLotteryState()
                              const winnerEndingBalance = await accounts[0].getBalance()
                              const endingTimeStamp = await lottery.getLatestTimeStamp()

                              await expect(lottery.getPlayer(0)).to.be.reverted
                              expect(recentWinner.toString()).to.equal(accounts[0].address)
                              expect(lotteryState).to.equal(0)
                              expect(winnerEndingBalance.toString()).to.equal(
                                  (winnerStartingBalance.add(lotteryEntranceFee)).toString()
                              )
                              expect(endingTimeStamp.toNumber()).to.be.greaterThan(
                                  startingTimeStamp.toNumber()
                              )
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      const khra = await ethers.provider.getBalance(deployer)
                      await lottery.enterLottery({ value: lotteryEntranceFee })
                      const winnerStartingBalance = await accounts[0].getBalance()
                  })
              })
          })
      })
