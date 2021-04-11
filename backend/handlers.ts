import { ethers, providers, Wallet } from "ethers";
import fs from "fs";
import { assert } from "node:console";
import { ENGINE_METHOD_DIGESTS } from "node:constants";
import path from "path";
import { getInfuraUrl } from "./utils";

interface chainElement {
  chainId: number;
  wallet: ethers.Wallet;
  tokenPool: ethers.Contract;
  provider: ethers.providers.JsonRpcProvider;
}

export default class Handlers {
  chainElements: chainElement[];

  abi = JSON.parse(
    fs
      .readFileSync(
        path.resolve(
          __dirname,
          "../artifacts/contracts/TokenPool.sol/TokenPool.json"
        )
      )
      .toString()
  ).abi;

  tokens: Record<string, string>[] = [
    {
      name: "fDAIx",
      ropsten: "0xBF6201a6c48B56d8577eDD079b84716BB4918E8A",
      goerli: "0xF2d68898557cCb2Cf4C10c3Ef2B034b2a69DAD00",
    },
  ];

  constructor() {
    const goerliProvider = new ethers.providers.JsonRpcProvider(
      getInfuraUrl("goerli", "https")
    );
    const goelriWallet = new ethers.Wallet(
      process.env.PRIVATE_KEY as string,
      goerliProvider
    );
    const goelriTokenPool = new ethers.Contract(
      process.env.TOKEN_POOL_GOERLI as string,
      this.abi,
      goelriWallet
    );

    const ropstenProvider = new ethers.providers.JsonRpcProvider(
      getInfuraUrl("ropsten", "https")
    );
    const ropstenWallet = new ethers.Wallet(
      process.env.PRIVATE_KEY as string,
      ropstenProvider
    );
    const ropstenTokenPool = new ethers.Contract(
      process.env.TOKEN_POOL_ROPSTEN as string,
      this.abi,
      ropstenWallet
    );

    this.chainElements = [
      {
        chainId: 5,
        wallet: goelriWallet,
        tokenPool: goelriTokenPool,
        provider: goerliProvider,
      },
      {
        chainId: 3,
        wallet: ropstenWallet,
        tokenPool: ropstenTokenPool,
        provider: ropstenProvider,
      },
    ];
  }

  getChainElement = (targetChainId: number): chainElement => {
    const element = this.chainElements.filter(
      ({ chainId }) => chainId === targetChainId
    )[0];
    if (!element) {
      throw `element for chainId ${targetChainId} not found`;
    }
    return element;
  };

  chainMapper = (chainId: number): string => {
    let result: string = "unknown";
    switch (chainId) {
      case 3:
        result = "ropsten";
        break;
      case 5:
        result = "goerli";
        break;
    }
    return result;
  };

  handle = async (event: ethers.Event, chainId: number) => {
    if (event.event === "CrossChainStreamRequested" && event.args) {
      return await this.handleCrossChainStreamRequest(event.args[0], chainId);
    }
    console.log(`No Handlers found for event ${event.event}`);
  };

  handleCrossChainStreamRequest = async (
    requestId: ethers.BigNumber,
    originChainId: number
  ) => {
    console.log(
      `handleCrossChainStreamRequest: requestId: ${requestId}, originChainId: ${originChainId}`
    );

    const { tokenPool: originTokenPool } = this.getChainElement(originChainId);
    const [
      reqId,
      sourceChainId,
      destinationChainId,
      sender,
      superToken,
      flowRate,
      isActive,
    ] = await originTokenPool.crossChainStreams(requestId.toNumber());
    console.log(
      `Fetched request: ${JSON.stringify({
        reqId,
        sourceChainId,
        destinationChainId,
        sender,
        superToken,
        flowRate,
        isActive,
      })}`
    );

    const { tokenPool: targetTokenPool } = this.getChainElement(
      destinationChainId.toNumber()
    );

    const targetTokenAddress = this.tokens.filter(
      (item) => item[this.chainMapper(originChainId)] === superToken
    )[0][this.chainMapper(destinationChainId.toNumber())] as string;
    console.log(
      `Creating flow on chainId ${destinationChainId} from token ${targetTokenAddress}`
    );

    const txn = await targetTokenPool.createFlow(
      targetTokenAddress,
      sender,
      flowRate
    );
    console.log(`Transaction Hash ${txn.hash}`);
  };
}
