const SuperfluidSDK = require("@superfluid-finance/js-sdk");
import { ethers } from "hardhat";
import address from "./address";

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
    receiver: address,
    flowRate: "3",
    userData: abicoder.encode(
      ["uint256", "bytes"],
      [1, abicoder.encode(["uint256"], [3])]
    ),
  });
};

testFlow();
