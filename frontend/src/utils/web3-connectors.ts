import { InjectedConnector } from "@web3-react/injected-connector";

const Injected = new InjectedConnector({
  supportedChainIds: [3, 5],
});

export { Injected };
