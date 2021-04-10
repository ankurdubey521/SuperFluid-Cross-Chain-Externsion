// SPDX-License-Identifier: MIT
// Contract matic testnet address : 0x81010d6147Ac567865bB95D31E59569F16716800
pragma solidity 0.7.6;
pragma abicoder v2;

import {
  SuperAppBase
} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";
import {
  ISuperfluid,
  ISuperToken,
  ISuperAgreement,
  SuperAppDefinitions
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {
  IConstantFlowAgreementV1
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "hardhat/console.sol";

contract TokenPool is SuperAppBase {
  // Superfluid
  ISuperfluid private _superfluid_host; // host
  IConstantFlowAgreementV1 private _superfluid_cfa; // the stored constant flow agreement class address

  event CrossChainStreamRequest(
    uint256 destinationChainId,
    address sender,
    address superTokenAddress,
    int256 flowRate
  );
  event StreamConverstionRequest(address fromSuperToken, address toSuperToken);

  constructor(ISuperfluid host, IConstantFlowAgreementV1 cfa) {
    // Verify superfluid addresses
    assert(address(host) != address(0));
    assert(address(cfa) != address(0));

    // Set superfluid contract addresses
    _superfluid_host = host;
    _superfluid_cfa = cfa;

    // Register contract with superfluid to enable callback functionality
    uint256 configWord = SuperAppDefinitions.APP_LEVEL_FINAL;
    _superfluid_host.registerApp(configWord);
    console.log("constructor: contract deployed on address ", address(this));
  }

  // Superfluid Functions
  modifier onlySuperfluidHost() {
    require(
      msg.sender == address(_superfluid_host),
      "onlySuperfluidHost: callback called from wrong sender"
    );
    _;
  }

  function beforeAgreementCreated(
    ISuperToken, /* superToken */
    address, /* agreementClass */
    bytes32, /*agreementId*/
    bytes calldata, /*agreementData*/
    bytes calldata /*ctx*/
  ) external view override onlySuperfluidHost returns (bytes memory cbdata) {
    cbdata = bytes("");
  }

  function handleCrossChainRequest(
    bytes calldata ctx,
    ISuperToken superToken,
    int256 flowRate
  ) internal {
    (, bytes memory params) =
      abi.decode(_superfluid_host.decodeCtx(ctx).userData, (uint256, bytes));

    uint256 destinationChainId = abi.decode(params, (uint256));
    emit CrossChainStreamRequest(
      destinationChainId,
      _superfluid_host.decodeCtx(ctx).msgSender,
      address(superToken),
      flowRate
    );
  }

  function afterAgreementCreated(
    ISuperToken superToken,
    address, /*agreementClass*/
    bytes32 agreementId,
    bytes calldata, /* agreementData*/
    bytes calldata, /*cbdata*/
    bytes calldata ctx
  ) external override onlySuperfluidHost returns (bytes memory) {
    // Decode data
    // address sender = _superfluid_host.decodeCtx(ctx).msgSender;
    (, int256 flowRate, , ) =
      _superfluid_cfa.getFlowByID(superToken, agreementId);

    (uint256 action, ) =
      abi.decode(_superfluid_host.decodeCtx(ctx).userData, (uint256, bytes));

    // Cross Chain Request
    if (action == 1) {
      handleCrossChainRequest(ctx, superToken, flowRate);
    }

    return ctx;
  }

  function beforeAgreementTerminated(
    ISuperToken, /*superToken*/
    address, /* agreementClass */
    bytes32, /*agreementId*/
    bytes calldata, /*agreementData*/
    bytes calldata /*ctx*/
  ) external view override onlySuperfluidHost returns (bytes memory cbdata) {
    // According to the app basic law, we should never revert in a termination callback
    return bytes("");
  }

  function afterAgreementTerminated(
    ISuperToken, /* superToken */
    address, /* agreementClass */
    bytes32, /* agreementId */
    bytes calldata agreementData,
    bytes calldata, /* cbdata */
    bytes calldata ctx
  ) external override onlySuperfluidHost returns (bytes memory newCtx) {
    // note that msgSender can be either flow sender, receiver or liquidator
    // one must decode agreementData to determine who is the actual player
    (address user, ) = abi.decode(agreementData, (address, address));

    return ctx;
  }
}
