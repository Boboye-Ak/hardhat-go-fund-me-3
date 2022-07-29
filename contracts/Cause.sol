// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract Cause {
    //State Variables
    uint256 public s_causeBalance;
    uint256 public immutable i_goal;
    bool public s_isGoalReached;
    bool public s_isOpenToDonations;
    bool internal s_isWithdrawn;
    address public s_causeOwner;
    string public s_causeName;
    mapping(address => uint256) public donorToAmountDonated;
    address[] public donorList;

    //Custom Errors
    error Cause__IsNotOpenToDonations();
    error Cause__GoalAlreadyReached();
    error Cause__OnlyCauseOwnerCanCall();
    error Cause__ErrorWithdrawing();
    error Cause__CannotOpenToDonationsAfterWithdrawal();

    //Events
    event DonationMade(address indexed donor, uint256 amount);
    event WithdrawalMade(address indexed withdrawer, uint256 amount);

    modifier onlyOwner() {
        if (msg.sender != s_causeOwner) {
            revert Cause__OnlyCauseOwnerCanCall();
        }
        _;
    }

    //Constructor
    constructor(
        string memory causeName,
        uint256 goal,
        address payable causeOwner
    ) {
        s_causeName = causeName;
        s_causeOwner = causeOwner;
        i_goal = goal;
        s_isOpenToDonations = true;
    }

    //Receive and Fallback Functions
    receive() external payable {
        donate();
    }

    fallback() external payable {
        donate();
    }

    //PURE FUNCTIONS
    //Donate Function
    function donate() public payable {
        if (s_isGoalReached) {
            revert Cause__GoalAlreadyReached();
        }
        if (!s_isOpenToDonations) {
            revert Cause__IsNotOpenToDonations();
        }

        s_causeBalance += msg.value;
        donorList.push(msg.sender);
        donorToAmountDonated[msg.sender] += msg.value;
        if (s_causeBalance >= i_goal) {
            s_isGoalReached = true;
            s_isOpenToDonations = false;
        }
        emit DonationMade(msg.sender, msg.value);
    }

    //Withdraw Function
    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        bool success = payable(msg.sender).send(amount);
        if (!success) {
            revert Cause__ErrorWithdrawing();
        } else {
            s_isOpenToDonations = false;
            s_causeBalance = 0;
            s_isWithdrawn=true;
            emit WithdrawalMade(msg.sender, amount);
        }
    }

    function changeOwnership(address payable newOwner) public onlyOwner {
        s_causeOwner = newOwner;
    }
    function switchIsOpenToDonations() public onlyOwner{
        if(s_isOpenToDonations){
            s_isOpenToDonations=false;

        }else{
            if(s_isWithdrawn){
                revert Cause__CannotOpenToDonationsAfterWithdrawal();

            }
        }
    }

    //VIEW FUNCTIONS
    function getCauseBalance() public view returns (uint256) {
        return s_causeBalance;
    }

    function getGoal() public view returns (uint256) {
        return i_goal;
    }

    function getCauseName() public view returns (string memory) {
        return s_causeName;
    }

    function getCauseOwner() public view returns (address) {
        return s_causeOwner;
    }

    function getIsGoalReached() public view returns (bool) {
        return s_isGoalReached;
    }

    function getIsOpenToDonations() public view returns (bool) {
        return s_isOpenToDonations;
    }
}
