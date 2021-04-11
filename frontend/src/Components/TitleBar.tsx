import React from "react";
import { Injected } from "../utils/web3-connectors";
import { useWeb3React } from "@web3-react/core";
import { AppBar, Grid, Typography } from "@material-ui/core";
const { MetaMaskButton, EthAddress } = require("rimble-ui");

const styles = {
  appbar: {
    background: "transparent",
    boxShadow: "none",
    backdropFilter: "blur(15px)",
    marginTop: 10,
  },
};

const Titlebar = () => {
  const { account, activate } = useWeb3React();
  return (
    <AppBar position="static" style={styles.appbar}>
      <Grid container>
        <Grid item xs={12} sm={6}>
          <Typography variant="h4" color="textPrimary">
            SuperFluid Cross Chain
          </Typography>
        </Grid>
        <Grid
          container
          item
          xs={12}
          sm={6}
          spacing={2}
          alignItems="center"
          justify="flex-end"
        >
          {account && (
            <Grid item>
              <EthAddress address={account} />
            </Grid>
          )}
          <Grid item>
            <MetaMaskButton onClick={() => activate(Injected)}>
              Metamask
            </MetaMaskButton>
          </Grid>
        </Grid>
      </Grid>
    </AppBar>
  );
};

export default Titlebar;
