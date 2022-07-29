// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./Cause.sol";

contract CrowdFunder {
    //STATE VARIABLES
    address payable public immutable i_crowdFunderOwner;
    mapping(address => address) public walletToCauseOwned;
    mapping(address => bool) public hasCause;
    uint256 public immutable i_percentCut;
    uint256 public s_nextCauseId;
    Cause[] public s_causes;

    //CUSTOM ERRORS
    error CrowdFunder__OnlyOwnerCanCallThis();
    error CrowdFunder__ThisAddressAlreadyHasACause();

    //EVENTS
    event DonationReceived(uint256 indexed amount);

    //MODIFIERS
    modifier onlyOwner() {
        if (msg.sender == i_crowdFunderOwner) {
            revert CrowdFunder__OnlyOwnerCanCallThis();
        }
        _;
    }

    //CONSTRUCTOR
    constructor(uint256 percentCut) {
        i_crowdFunderOwner = payable(msg.sender);
        i_percentCut = percentCut;
        s_nextCauseId = 0;
    }

    //RECEIVE AND FALLBACK FUNCTIONS
    receive() external payable {
        emit DonationReceived(msg.value);
    }

    fallback() external payable {
        emit DonationReceived(msg.value);
    }

    //PURE FUNCTIONS
    //Create Cause Function
    function createCause(string memory causeName, uint256 goal) public {
        if (hasCause[msg.sender]) {
            revert CrowdFunder__ThisAddressAlreadyHasACause();
        }
        Cause newCause = new Cause(
            causeName,
            goal,
            payable(msg.sender),
            i_percentCut,
            s_nextCauseId
        );
        s_causes.push(newCause);
        s_nextCauseId = s_nextCauseId + 1;
        walletToCauseOwned[msg.sender] = address(newCause);
        hasCause[msg.sender]=true;
    }
}