const { ethers } = require("hardhat")

const networkConfig = {
    80001: {
        name: "mumbai",
        vrfCoordinatorV2Address: "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
        entranceFee: ethers.utils.parseEther("0.0001"),
        gasLane: "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
        subscriptionId: "969",
        callbackGasLimit: "500000",
        interval: "30",
        blockConfirmations: 6
    },
    31337: {
        name: "hardhat",
        entranceFee: ethers.utils.parseEther("1"),
        gasLane: "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
        callbackGasLimit: "500000",
        interval: "30"
    },
    43113 : {
        name: "fuji",
        vrfCoordinatorV2Address: "0x2eD832Ba664535e5886b75D64C46EB9a228C2610",
        entranceFee: ethers.utils.parseEther("0.0001"),
        gasLane: "0x354d2f95da55398f44b7cff77da56283d9c6c829a4bdf1bbcaf2ad6a4d081f61",
        subscriptionId: "227",
        callbackGasLimit: "500000",
        interval: "30",
        blockConfirmations: 6
    }
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains
}