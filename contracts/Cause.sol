// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;


contract Cause {
    //State Variables
    uint256 public s_causeBalance;
    uint256 public immutable i_goal;
    bool public s_isGoalReached;
    bool public s_isOpenToDonations;
    address public s_causeOwner;
    string public s_causeName;
    mapping(address => uint256) public donorToAmountDonated;
    address[] public donorList;

    //Custom Errors
    error Cause__IsNotOpenToDonations();
    error Cause__GoalAlreadyReached();

    //Events
    event DonationMade(address indexed donor, uint256 amount);

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
    receive() external payable{
        donate();
    }
    fallback() external payable{
        donate();
    }

    //Pure functions
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
}
