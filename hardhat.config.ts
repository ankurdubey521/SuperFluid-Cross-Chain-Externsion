import "@nomiclabs/hardhat-waffle";
import dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.3",
  networks: {
    goerli: {
      url: "https://goerli.infura.io/v3/98b0477e69b1415cbaf0c6b49da3206a",
      accounts: [process.env.private_key],
    },
    kovan: {
      url: "https://kovan.infura.io/v3/98b0477e69b1415cbaf0c6b49da3206a",
      accounts: [process.env.private_key],
    },
  },
};

export default config;
