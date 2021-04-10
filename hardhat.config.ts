import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.7.6",
  networks: {
    mainnet: {
      url: "https://mainnet.infura.io/v3/98b0477e69b1415cbaf0c6b49da3206a",
      accounts: [process.env.PRIVATE_KEY as string],
    },
    goerli: {
      url: "https://goerli.infura.io/v3/98b0477e69b1415cbaf0c6b49da3206a",
      accounts: [process.env.PRIVATE_KEY as string],
    },
    kovan: {
      url: "https://kovan.infura.io/v3/98b0477e69b1415cbaf0c6b49da3206a",
      accounts: [process.env.PRIVATE_KEY as string],
    },
  },
};

export default config;
