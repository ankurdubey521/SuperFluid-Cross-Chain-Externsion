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
  //goerli
  const contract = new ethers.Contract(address, abi, signer);
  console.log(
    await contract.provideLiquidity(
      "0xf2d68898557ccb2cf4c10c3ef2b034b2a69dad00",
      ethers.BigNumber.from("100000000000000000")
    )
  );
//   console.log(
//     `liquidity provided: ${await contract.liquidityProvided(
//       signer.address,
//       "0xf2d68898557ccb2cf4c10c3ef2b034b2a69dad00"
//     )}`
//   );
//   console.log(
//     await contract.provideLiquidity(
//       "0x8aE68021f6170E5a766bE613cEA0d75236ECCa9a",
//       ethers.BigNumber.from("100000000000000000")
//     )
//   );

//   // Ropsten
//   console.log(
//     await contract.provideLiquidity(
//       "0xBF6201a6c48B56d8577eDD079b84716BB4918E8A",
//       ethers.BigNumber.from("100000000000000000")
//     )
//   );
};

main();
