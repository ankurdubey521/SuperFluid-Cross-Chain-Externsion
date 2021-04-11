import React from "react";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import { IFlow } from "../utils/token-pool-utils";

interface IonCancel {
  (flow: IFlow): Promise<void>;
}
interface FlowProp {
  flow: IFlow;
  onCancel: IonCancel;
}
function Flow(props: FlowProp): JSX.Element {
  const { flow, onCancel } = props;
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography color="textSecondary" gutterBottom>
          Cross Chain Stream
        </Typography>
        <Typography variant="h5" component="h2">
          {`Token ${flow.superToken}`}
        </Typography>
        <Typography color="textSecondary">
          {`From chain ${flow.sourceChainId.toString()} to chain ${flow.destinationChainId.toString()} @${flow.flowRate.toString()} Tokens/s`}
        </Typography>
        <Typography variant="body2" component="p">
          {flow.isActive
            ? "Loopback steam active to your account ♻️"
            : "Flow Terminated ⛌"}
        </Typography>
      </CardContent>
      {flow.isActive && (
        <CardActions>
          <Button size="small" onClick={async () => await onCancel(flow)}>
            Cancel
          </Button>
        </CardActions>
      )}
    </Card>
  );
}

export default Flow;
