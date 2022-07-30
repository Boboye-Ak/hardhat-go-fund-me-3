// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./Cause.sol";

contract CrowdFunder {
    //STATE VARIABLES
    address payable public immutable i_crowdFunderOwner;
    mapping(address => address) public walletToCauseOwned;
    mapping(address => uint256) public hasCause;
    uint256 public immutable i_percentCut;
    uint256 public s_nextCauseId;
    Cause[] public s_causes;

    //CUSTOM ERRORS
    error CrowdFunder__OnlyOwnerCanCallThis();
    error CrowdFunder__ThisWalletAlreadyHasACause();
    error CrowdFunder__ErrorWithdrawing();

    //EVENTS
    event DonationReceived(uint256 indexed amount);
    event WithdrawalMade(uint256 indexed amount);

    //MODIFIERS
    modifier onlyOwner() {
        if (msg.sender != i_crowdFunderOwner) {
            revert CrowdFunder__OnlyOwnerCanCallThis();
        }
        _;
    }

    //CONSTRUCTOR
    constructor(
        uint256 percentCut /*Percentage given in Basis Points ie 100 basis points=1% */
    ) {
        i_crowdFunderOwner = payable(msg.sender);
        i_percentCut = percentCut;
        s_nextCauseId = 1;
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
        if (hasCause[msg.sender] != 0) {
            revert CrowdFunder__ThisWalletAlreadyHasACause();
        }
        Cause newCause = new Cause(
            causeName,
            goal,
            payable(msg.sender),
            i_percentCut,
            s_nextCauseId
        );
        s_causes.push(newCause);
        walletToCauseOwned[msg.sender] = address(newCause);
        hasCause[msg.sender] = s_nextCauseId;
        s_nextCauseId = s_nextCauseId + 1;
    }

    function withdraw() public payable onlyOwner {
        uint256 amount = address(this).balance;
        bool success = payable(msg.sender).send(amount);
        if (!success) {
            revert CrowdFunder__ErrorWithdrawing();
        }
    }

    //VIEW FUNCTIONS
    function getCauseById(uint256 causeId) public view returns (address) {
        address causeAddress = address(s_causes[causeId - 1]);
        return causeAddress;
    }

    function getCauseByOwnerWallet(address owner)
        public
        view
        returns (address)
    {
        address causeAddress = walletToCauseOwned[owner];
        return causeAddress;
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
