// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./Cause.sol";

contract CrowdFunder {
    //STATE VARIABLES
    address payable public immutable i_crowdFunderOwner;
    mapping(address => address) public walletToCauseOwned;
    mapping(address => uint256) public hasCause;
    mapping(address => uint256) public causeToId;
    uint256 public immutable i_percentCut;
    uint256 public s_nextCauseId;
    Cause[] public s_causes;

    //CUSTOM ERRORS
    error CrowdFunder__OnlyOwnerCanCallThis();
    error CrowdFunder__ThisWalletAlreadyHasACause();
    error CrowdFunder__ErrorWithdrawing();

    //EVENTS
    event CauseCreated(address indexed causeAddress);
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
    function createCause(string memory causeName, uint256 goal) public returns (address) {
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
        newCause.unlock();
        s_causes.push(newCause);
        walletToCauseOwned[msg.sender] = address(newCause);
        hasCause[msg.sender] = s_nextCauseId;
        causeToId[address(newCause)] = s_nextCauseId;
        s_nextCauseId = s_nextCauseId + 1;
        emit CauseCreated(address(newCause));
        return address(newCause);
    }

    function sponsorSite() public payable {
        emit DonationReceived(msg.value);
    }

    //Withdraw Function
    function withdraw() public payable onlyOwner {
        uint256 amount = address(this).balance;
        bool success = payable(msg.sender).send(amount);
        if (!success) {
            revert CrowdFunder__ErrorWithdrawing();
        }
    }

    //Block Cause Function
    function lock(uint256 causeId) public onlyOwner {
        Cause cause = s_causes[causeId - 1];
        cause.lock();
    }

    function unlock(uint256 causeId) public onlyOwner {
        Cause cause = s_causes[causeId - 1];
        cause.unlock();
    }

    //Handover Function

    function handover(address newOwner) public {
        require((hasCause[msg.sender] != 0) && (hasCause[newOwner] == 0));
        hasCause[newOwner] = hasCause[msg.sender];
        hasCause[msg.sender] = 0;
        walletToCauseOwned[newOwner] = walletToCauseOwned[msg.sender];
        walletToCauseOwned[msg.sender] = address(0);
    }

    //VIEW FUNCTIONS
    function getCauseById(uint256 causeId) public view returns (address) {
        address causeAddress = address(s_causes[causeId - 1]);
        return causeAddress;
    }

    function getCauseAddressByOwnerWallet(address owner) public view returns (address) {
        address causeAddress = walletToCauseOwned[owner];
        return causeAddress;
    }

    function getCauseIdByOwnerAddress(address owner) public view returns (uint256) {
        uint256 causeId = hasCause[owner];
        return causeId;
    }

    function getCauseIdByCauseAddress(address causeAddress) public view returns (uint256) {
        uint256 causeId = causeToId[causeAddress];
        return causeId;
    }

    function getMyCauseId() public view returns (uint256) {
        uint256 causeId = hasCause[msg.sender];
        return (causeId);
    }

    function getLatestCauseAddress() public view returns (address) {
        address latestCauseAddress = address(s_causes[s_nextCauseId - 2]);
        return latestCauseAddress;
    }

    function getLatestCauseId() public view returns (uint256) {
        uint256 latestCauseId = s_nextCauseId - 1;
        return latestCauseId;
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getContractOwner() public view returns (address) {
        return i_crowdFunderOwner;
    }

    function getPercentCut() public view returns (uint256) {
        return i_percentCut;
    }

    function confirmCause(address causeToCheck) public view returns (bool) {
        /*Returns true if the Cause is truly deployed by this contract */
        if (causeToId[causeToCheck] != 0) {
            return true;
        } else {
            return false;
        }
    }
}
