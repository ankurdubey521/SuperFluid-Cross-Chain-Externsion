import { ethers } from "ethers";
import { Web3Provider } from "@ethersproject/providers";
import abi from "../abi/TokenPool";
const SuperfluidSDK = require("@superfluid-finance/js-sdk");

const TOKEN_POOL_GOERLI = "0x3Cf5a6974368C55F7FAC46e824ddf5dA4D80E24d";
const TOKEN_POOL_ROPSTEN = "0xe6e9f47cb5b6f7cc4474c0d822008708e94353dd";

interface IFlow {
  reqId: ethers.BigNumber;
  sourceChainId: ethers.BigNumber;
  destinationChainId: ethers.BigNumber;
  sender: string;
  superToken: string;
  flowRate: ethers.BigNumber;
  isActive: boolean;
}

const getContract = (
  provider: ethers.providers.JsonRpcProvider,
  chainId: number
): ethers.Contract | undefined => {
  if (chainId === 3) {
    return new ethers.Contract(TOKEN_POOL_ROPSTEN, abi, provider);
  } else if (chainId === 5) {
    return new ethers.Contract(TOKEN_POOL_GOERLI, abi, provider);
  }
};

const getStreams = async (
  address: string,
  provider: ethers.providers.JsonRpcProvider,
  chainId: number
): Promise<IFlow[]> => {
  const contract = getContract(provider, chainId);
  if (contract) {
    const userStreamCount = await contract.userCrossChainStreamsCount(address);
    const userToCrossChainStreamIds = await Promise.all(
      new Array(userStreamCount.toNumber())
        .fill(0)
        .map(
          async (val, index: number): Promise<ethers.BigNumber> =>
            await contract.userToCrossChainStreamIds(address, index)
        )
    );
    const streams: IFlow[] = await Promise.all(
      userToCrossChainStreamIds.map(
        async (id: ethers.BigNumber): Promise<IFlow> => {
          const [
            reqId,
            sourceChainId,
            destinationChainId,
            sender,
            superToken,
            flowRate,
            isActive,
          ] = await contract.crossChainStreams(id);
          return {
            reqId,
            sourceChainId,
            destinationChainId,
            sender,
            superToken,
            flowRate,
            isActive,
          };
        }
      )
    );
    return streams;
  }
  return [];
};

declare global {
  interface Window {
    ethereum: ethers.providers.ExternalProvider;
  }
}
const createStream = async (
  signerAddress: string,
  flowRate: ethers.BigNumber,
  currentChainId: number,
  targetChainId: number,
  tokenAddress: string
) => {
  console.log(targetChainId);
  const sf = new SuperfluidSDK.Framework({
    ethers: new Web3Provider(window.ethereum),
    tokens: ["fDAI"],
  });
  await sf.initialize();
  const abicoder = new ethers.utils.AbiCoder();

  await sf.cfa.createFlow({
    superToken: tokenAddress,
    sender: signerAddress,
    receiver: getContract(new Web3Provider(window.ethereum), currentChainId)
      ?.address,
    flowRate: flowRate,
    userData: abicoder.encode(
      ["uint256", "bytes"],
      [1, abicoder.encode(["uint256"], [targetChainId])]
    ),
  });
};

const cancelStream = async (flow: IFlow): Promise<void> => {
  const sf = new SuperfluidSDK.Framework({
    ethers: new Web3Provider(window.ethereum),
    tokens: ["fDAI"],
  });
  await sf.initialize();
  const abicoder = new ethers.utils.AbiCoder();

  await sf.cfa.deleteFlow({
    superToken: flow.superToken,
    sender: flow.sender,
    receiver: getContract(
      new Web3Provider(window.ethereum),
      flow.sourceChainId.toNumber()
    )?.address,
    userData: abicoder.encode(
      ["uint256", "bytes"],
      [1, abicoder.encode(["uint256"], [flow.reqId])]
    ),
  });
};

export { getContract, getStreams, createStream, cancelStream };
export type { IFlow };
