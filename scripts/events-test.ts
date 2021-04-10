import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { providers } from "ethers";
import { ethers } from "hardhat";
import path from "path";
import fs from "fs";

const projectKey =
  "wss://goerli.infura.io/ws/v3/98b0477e69b1415cbaf0c6b49da3206a";
const address = "0xe53fd0c24F83b447EB3D3C4Df9CBcaC7f81dcdcF";
const abi = JSON.parse(
  fs
    .readFileSync(
      path.resolve(
        __dirname,
        "../artifacts/contracts/TokenPool.sol/TokenPool.json"
      )
    )
    .toString()
).abi;

const main = async () => {
  const websocketProvider = new ethers.providers.WebSocketProvider(projectKey);
  const contract = new ethers.Contract(address, abi, websocketProvider);
  contract.on({}, (data) => console.log(data));
};

main();
