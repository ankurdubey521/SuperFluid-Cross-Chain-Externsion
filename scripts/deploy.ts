import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { providers } from "ethers";
import { ethers } from "hardhat";
import path from "path";
import fs from "fs";

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
  const contractFactory = await ethers.getContractFactory("TokenPool");
  const contract = await contractFactory.deploy(
    "0x22ff293e14F1EC3A09B137e9e06084AFd63adDF9",
    "0xEd6BcbF6907D4feEEe8a8875543249bEa9D308E8"
  );
  console.log(contract.address);
};

main();
