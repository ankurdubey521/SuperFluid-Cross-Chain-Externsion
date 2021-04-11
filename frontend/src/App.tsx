import { Web3Provider } from "@ethersproject/providers";
import { Web3ReactProvider } from "@web3-react/core";
import HomePage from "./Components/HomePage";
import "./App.css";

const App = () => {
  return (
    <Web3ReactProvider
      getLibrary={(provider, connector) => new Web3Provider(provider)}
    >
      <HomePage />
    </Web3ReactProvider>
  );
};

export default App;
