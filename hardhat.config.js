require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

const MUMBAI_RPC_URL = process.env.MUMBAI_RPC_URL
const MUMBAI_PRIVATE_KEY = process.env.MUMBAI_PRIVATE_KEY

const FUJI_PRIVATE_KEY = process.env.FUJI_PRIVATE_KEY
const FUJI_RPC_URL = process.env.FUJI_RPC_URL

const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY
const SNOWTRACE_API_KEY = process.env.SNOWTRACE_API_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
        },

        mumbai: {
            chainId: 80001,
            blockConfirmations: 6,
            url: MUMBAI_RPC_URL,
            accounts: [MUMBAI_PRIVATE_KEY]
        },

        fuji: {
            chainId: 43113,
            blockConfirmations: 6,
            url: FUJI_RPC_URL,
            accounts: [FUJI_PRIVATE_KEY]

        }
    },
    solidity: "0.8.8",
    namedAccounts: {
        deployer: {
            default: 0,
        },
        player: {
            default: 1,
        }
    },
    gasReporter: {
        enabled: false,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    },
    mocha: {
        timeout: 500000, // 500 seconds 
    },
    etherscan: {
        apiKey: {
            polygonMumbai: POLYGONSCAN_API_KEY,
            avalancheFujiTestnet: SNOWTRACE_API_KEY
        },
    },
}
