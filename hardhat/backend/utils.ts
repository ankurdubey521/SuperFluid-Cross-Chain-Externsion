const getInfuraUrl = (networkName: string, protocol: string): string =>
  `${protocol}://${networkName}.infura.io/${
    protocol === "wss" ? "ws/" : ""
  }v3/${process.env.INFURA_ID}`;

export { getInfuraUrl };
