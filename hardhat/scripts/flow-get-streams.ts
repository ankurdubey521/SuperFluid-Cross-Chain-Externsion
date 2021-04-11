import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import path from "path";
import fs from "fs";
import address from "./address";

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
  const [signer] = await ethers.getSigners();
  const contract = new ethers.Contract(address, abi, signer);
  console.log(await contract.getUserCrossChainStreams(signer.address));
};

main();
