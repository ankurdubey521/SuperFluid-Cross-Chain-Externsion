const SuperfluidSDK = require("@superfluid-finance/js-sdk");
import { Web3Provider } from "@ethersproject/providers";
import { ethers } from "hardhat";

const testFlow = async () => {
  const [signer] = await ethers.getSigners();
  const sf = new SuperfluidSDK.Framework({
    ethers: ethers.provider,
    tokens: ["fDAI"],
  });
  await sf.initialize();
  const abicoder = new ethers.utils.AbiCoder();

  await sf.cfa.createFlow({
    superToken: "0xf2d68898557ccb2cf4c10c3ef2b034b2a69dad00",
    sender: signer.address,
    receiver: "0xe53fd0c24F83b447EB3D3C4Df9CBcaC7f81dcdcF",
    flowRate: "3",
    userData: abicoder.encode(
      ["uint256", "bytes"],
      [1, abicoder.encode(["uint256"], [80001])]
    ),
  });
};

testFlow();
