const { ethers } = require("hardhat")

const networkConfig = {
    80001: {
        name: "mumbai",
        vrfCoordinatorV2Address: "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
        entranceFee: ethers.utils.parseEther("10"),
        gasLane: "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
        subscriptionId: "",
        callbackGasLimit: "500000",
        interval: "30"
    },
    31337: {
        name: "hardhat",
        entranceFee: ethers.utils.parseEther("1"),
        gasLane: "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
        callbackGasLimit: "500000",
        interval: "30"
    }
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains
}