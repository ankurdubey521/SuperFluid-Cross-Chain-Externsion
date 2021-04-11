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
    "0x22ff293e14f1ec3a09b137e9e06084afd63addf9",
    "0xed6bcbf6907d4feeee8a8875543249bea9d308e8"
  );
  // const contract = await contractFactory.deploy(
  //   "0xF2B4E81ba39F5215Db2e05B2F66f482BB8e87FD2",
  //   "0xaD2F1f7cd663f6a15742675f975CcBD42bb23a88"
  // );
  console.log(contract.address);
};

main();
