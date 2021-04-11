import { ethers } from "ethers";
import React, { useState, useEffect } from "react";
import {
  Grid,
  TextField,
  MenuItem,
  Typography,
  Button,
} from "@material-ui/core";
import { useWeb3React } from "@web3-react/core";
import {
  getStreams,
  createStream,
  cancelStream,
  IFlow,
} from "../utils/token-pool-utils";
import Flow from "./Flow";

const Flows = (): JSX.Element => {
  const { active, account, library, chainId } = useWeb3React();
  const [flows, setFlows] = useState<IFlow[]>([]);
  const [superToken, setSuperToken] = useState("");
  const [flowRate, setFlowRate] = useState(ethers.BigNumber.from(0));
  const [targetChain, setTargetChain] = useState(0);

  useEffect(() => {
    if (active) {
      const signer = library.getSigner(account);
      if (account && chainId) {
        getStreams(account, signer, chainId).then((flows: IFlow[]) => {
          setFlows(flows);
          console.log(flows);
        });
      }
    }
  }, [active, library, account, chainId]);

  return account && chainId ? (
    <Grid
      container
      spacing={1}
      style={{ paddingTop: 20, paddingLeft: 10, paddingRight: 10 }}
    >
      <Grid item xs={12}>
        <Typography variant="h5">Create a new Loopback Flow</Typography>
      </Grid>
      <Grid item xs={4}>
        <TextField
          id="standard-select-token"
          select
          label="Select Token"
          value={superToken}
          fullWidth
          onChange={(event) => setSuperToken(event.target.value)}
        >
          {[
            {
              label: "fDaix",
              value: "0xf2d68898557ccb2cf4c10c3ef2b034b2a69dad00",
            },
            {
              label: "fUSDCx",
              value: "0x8aE68021f6170E5a766bE613cEA0d75236ECCa9a",
            },
          ].map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={4}>
        <TextField
          id="standard-select-token"
          select
          label="Select Chain"
          value={chainId}
          fullWidth
          onChange={(event) => setTargetChain(parseInt(event.target.value))}
        >
          {[
            {
              label: "Ropsten",
              value: 3,
            },
            {
              label: "Goerli",
              value: 5,
            },
          ].map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={4}>
        <TextField
          id="flow-rate-basic"
          label="Flow Rate"
          value={flowRate.toString()}
          fullWidth
          onChange={(event) => {
            try {
              setFlowRate(
                ethers.BigNumber.from(
                  event.target.value === "" ? 0 : event.target.value
                )
              );
            } catch (error) {
              console.log(error);
            }
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <Button
          fullWidth
          onClick={() =>
            createStream(account, flowRate, chainId, targetChain, superToken)
          }
        >
          Create Loopback Flow
        </Button>
      </Grid>
      {flows.length > 0 && (
        <Grid item xs={12} style={{ marginTop: 20 }}>
          <Typography variant="h5">Existing Flows</Typography>
        </Grid>
      )}
      {flows.length > 0 &&
        flows.map((flow) => (
          <Grid item xs={12} key={flow.sender + flow.superToken}>
            <Flow flow={flow} onCancel={cancelStream} />
          </Grid>
        ))}
    </Grid>
  ) : (
    <></>
  );
};

export default Flows;
