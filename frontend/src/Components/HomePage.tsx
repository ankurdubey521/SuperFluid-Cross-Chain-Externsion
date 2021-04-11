import React, { useState } from "react";
import { Paper, Tabs, Tab, Grid } from "@material-ui/core";

import TitleBar from "./TitleBar";
import Flows from "./Flows";

const Homepage = (): JSX.Element => {
  const [value, setValue] = useState(0);

  return (
    <>
      <TitleBar />
      <Grid container spacing={1} justify="center" style={{ marginTop: 50 }}>
        <Grid item xs={12} sm={6}>
          <Paper>
            <Tabs
              value={value}
              onChange={(event, newValue) => {
                setValue(newValue);
              }}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              centered
            >
              <Tab label="Flows" fullWidth />
              <Tab label="Add Liquidity" fullWidth />
            </Tabs>
            {value === 0 && <Flows />}
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};

export default Homepage;
