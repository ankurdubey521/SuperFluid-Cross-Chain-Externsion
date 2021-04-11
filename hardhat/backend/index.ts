import { ethers } from "ethers";
import { config } from "dotenv";
config();
import path from "path";
import fs from "fs";
import { getInfuraUrl } from "./utils";
import Handlers from "./handlers";

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

const handlers = new Handlers();

const main = async () => {
  const goerliWebSocketProvider = new ethers.providers.WebSocketProvider(
    getInfuraUrl("goerli", "wss")
  );
  const ropstenWebSocketProvider = new ethers.providers.WebSocketProvider(
    getInfuraUrl("ropsten", "wss")
  );

  const goerliTokenPool = new ethers.Contract(
    process.env.TOKEN_POOL_GOERLI as string,
    abi,
    goerliWebSocketProvider
  );
  const ropstenTokenPool = new ethers.Contract(
    process.env.TOKEN_POOL_ROPSTEN as string,
    abi,
    ropstenWebSocketProvider
  );

  goerliTokenPool.on({}, (event) => {
    handlers.handle(event, 5).then(console.log).catch(console.error);
  });
  ropstenTokenPool.on({}, (event) => {
    handlers.handle(event, 5).then(console.log).catch(console.error);
  });
};
main().then(console.log).catch(console.error);
