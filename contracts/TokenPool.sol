// SPDX-License-Identifier: MIT
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
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

contract TokenPool is SuperAppBase, Ownable {
  // Superfluid
  ISuperfluid private _superfluid_host; // host
  IConstantFlowAgreementV1 private _superfluid_cfa; // the stored constant flow agreement class address

  struct CrossChainStream {
    uint256 requestId;
    uint256 sourceChainId;
    uint256 destinationChainId;
    address sender;
    ISuperToken superToken;
    int256 flowRate;
    bool isActive;
  }

  struct TokenConversionStream {
    uint256 requestId;
    address sender;
    ISuperToken fromToken;
    ISuperToken toToken;
    int256 flowRate;
    bool isActive;
  }

  // Streams
  mapping(address => uint256[]) public userToCrossChainStreamIds;
  mapping(address => uint256[]) public userToStreamConversionIds;
  mapping(uint256 => CrossChainStream) public crossChainStreams;
  mapping(uint256 => TokenConversionStream) public tokenConversionStreams;

  uint256 private nextCrossChainStreamId = 1;
  uint256 private nextTokenConversionId = 1;

  // Liquidity Providers (supertoken -> user -> amount)
  mapping(address => mapping(address => uint256)) public liquidityProvided;

  event CrossChainStreamRequested(uint256 id);
  event CrossChainStreamClosed(uint256 id);
  event StreamConversionRequested(uint256 id);
  event StreamConversionRequestClosed(uint256 id);

  event StreamCreated(
    address sender,
    address recepient,
    address superToken,
    int256 flowRate
  );
  event StreamDeleted(address sender, address recepient, address superToken);

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

  // Liquidity
  function provideLiquidity(ISuperToken superToken, uint256 amount) external {
    require(
      superToken.transferFrom(msg.sender, address(this), amount),
      "TRANSFER_FAILED"
    );
    liquidityProvided[address(superToken)][msg.sender] += amount;
  }

  function extractLiquidity(ISuperToken superToken, uint256 amount) external {
    require(
      superToken.balanceOf(address(this)) >= amount,
      "INSUFFICIENT_BALANCE"
    );
    require(
      liquidityProvided[address(superToken)][msg.sender] >= amount,
      "INVALID_AMOUNT"
    );
    require(superToken.transfer(msg.sender, amount), "TRANSFER_FAILED");
    liquidityProvided[address(superToken)][msg.sender] -= amount;
  }

  // Cross Chain Streaming
  function getNextCrossChainRequestId() internal returns (uint256) {
    nextCrossChainStreamId += 1;
    return nextCrossChainStreamId - 1;
  }

  function handleCrossChainRequestCreation(
    bytes calldata ctx,
    ISuperToken superToken,
    int256 flowRate
  ) internal {
    uint256 id = getNextCrossChainRequestId();
    (, bytes memory params) =
      abi.decode(_superfluid_host.decodeCtx(ctx).userData, (uint256, bytes));

    uint256 destinationChainId = abi.decode(params, (uint256));
    address sender = _superfluid_host.decodeCtx(ctx).msgSender;
    uint256 chainId;

    assembly {
      chainId := chainid()
    }

    CrossChainStream memory crossChainStream =
      CrossChainStream(
        id,
        chainId,
        destinationChainId,
        sender,
        superToken,
        flowRate,
        true
      );
    crossChainStreams[id] = crossChainStream;
    userToCrossChainStreamIds[sender].push(id);

    emit CrossChainStreamRequested(id);
  }

  function handleCrossChainRequestCancellation(
    bytes calldata ctx,
    ISuperToken superToken
  ) internal {
    (, bytes memory params) =
      abi.decode(_superfluid_host.decodeCtx(ctx).userData, (uint256, bytes));

    uint256 requestId = abi.decode(params, (uint256));
    crossChainStreams[requestId].isActive = false;

    emit CrossChainStreamClosed(requestId);
  }

  // Token Conversion Streaming
  function getNextTokenConversionRequestId() internal returns (uint256) {
    nextTokenConversionId += 1;
    return nextTokenConversionId - 1;
  }

  function handleLocalStreamConversionRequest(
    bytes calldata ctx,
    ISuperToken superToken,
    int96 flowRate
  ) internal {
    (, bytes memory params) =
      abi.decode(_superfluid_host.decodeCtx(ctx).userData, (uint256, bytes));
    ISuperToken targetToken = ISuperToken(abi.decode(params, (address)));
    address sender = _superfluid_host.decodeCtx(ctx).msgSender;
    uint256 id = getNextTokenConversionRequestId();

    TokenConversionStream memory tokenConversionStream =
      TokenConversionStream(
        id,
        sender,
        superToken,
        targetToken,
        flowRate,
        true
      );

    tokenConversionStreams[id] = tokenConversionStream;
    userToStreamConversionIds[sender].push(id);

    _createFlow(targetToken, sender, flowRate);
  }

  function handleLocalStreamConversionRequestCancellation(bytes calldata ctx)
    internal
  {
    (, bytes memory params) =
      abi.decode(_superfluid_host.decodeCtx(ctx).userData, (uint256, bytes));
    uint256 id = abi.decode(params, (uint256));
    address sender = _superfluid_host.decodeCtx(ctx).msgSender;

    _deleteFlow(
      tokenConversionStreams[id].fromToken,
      address(this),
      tokenConversionStreams[id].sender
    );

    tokenConversionStreams[id].isActive = false;
    emit StreamConversionRequestClosed(id);
  }

  function _createFlow(
    ISuperToken superToken,
    address recipient,
    int96 flowRate
  ) internal {
    _superfluid_host.callAgreement(
      _superfluid_cfa,
      abi.encodeWithSelector(
        _superfluid_cfa.createFlow.selector,
        superToken,
        recipient,
        flowRate,
        new bytes(0)
      ),
      "0x"
    );
    emit StreamCreated(address(this), recipient, address(superToken), flowRate);
  }

  // Superfluid helpers
  function createFlow(
    ISuperToken superToken,
    address recipient,
    int96 flowRate
  ) external onlyOwner {
    _createFlow(superToken, recipient, flowRate);
  }

  function _deleteFlow(
    ISuperToken superToken,
    address sender,
    address receiver
  ) internal {
    _superfluid_host.callAgreement(
      _superfluid_cfa,
      abi.encodeWithSelector(
        _superfluid_cfa.deleteFlow.selector,
        superToken,
        sender,
        receiver,
        new bytes(0)
      ),
      "0x"
    );
    emit StreamDeleted(sender, receiver, address(superToken));
  }

  function deleteFlow(
    ISuperToken superToken,
    address sender,
    address receiver
  ) external onlyOwner {
    _deleteFlow(superToken, sender, receiver);
  }

  // Superfluid Callbacks

  function beforeAgreementCreated(
    ISuperToken, /* superToken */
    address, /* agreementClass */
    bytes32, /*agreementId*/
    bytes calldata, /*agreementData*/
    bytes calldata /*ctx*/
  ) external view override onlySuperfluidHost returns (bytes memory cbdata) {
    cbdata = bytes("");
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
    (, int96 flowRate, , ) =
      _superfluid_cfa.getFlowByID(superToken, agreementId);

    (uint256 action, ) =
      abi.decode(_superfluid_host.decodeCtx(ctx).userData, (uint256, bytes));

    // Cross Chain Request
    if (action == 1) {
      handleCrossChainRequestCreation(ctx, superToken, flowRate);
    }
    // Stream Conversion Request
    else if (action == 2) {
      handleLocalStreamConversionRequest(ctx, superToken, flowRate);
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
    ISuperToken superToken,
    address, /* agreementClass */
    bytes32, /* agreementId */
    bytes calldata agreementData,
    bytes calldata, /* cbdata */
    bytes calldata ctx
  ) external override onlySuperfluidHost returns (bytes memory newCtx) {
    // Decode data
    // address sender = _superfluid_host.decodeCtx(ctx).msgSender;

    (uint256 action, ) =
      abi.decode(_superfluid_host.decodeCtx(ctx).userData, (uint256, bytes));

    // Cross Chain Request
    if (action == 1) {
      handleCrossChainRequestCancellation(ctx, superToken);
    }
    // Stream Conversion Request
    else if (action == 2) {
      handleLocalStreamConversionRequestCancellation(ctx);
    }
    return ctx;
  }
}
