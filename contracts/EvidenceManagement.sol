// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EvidenceManagement {

    // ================================
    // STRUCTS
    // ================================

    struct Evidence {
        string ipfsHash;
        string caseNumber;
        string location;
        string crimeDescription;
        string evidenceType;
        string officerName;
        uint256 timestamp;
        bytes32 passwordHash;
        bool exists;
    }

    // ================================
    // STATE VARIABLES
    // ================================

    mapping(string => Evidence) private evidenceRecords;
    string[] private evidenceIds;

    mapping(address => string) private userRoles;
    mapping(address => string) private userNames;
    mapping(address => bool) private registeredUsers;

    // ================================
    // EVENTS
    // ================================

    event EvidenceAdded(
        string evidenceId,
        string ipfsHash,
        string officerName,
        uint256 timestamp
    );

    event EvidenceAccessed(
        string evidenceId,
        address accessedBy,
        uint256 timestamp
    );

    event UserRegistered(
        address userAddress,
        string role,
        string name
    );

    // ================================
    // MODIFIERS
    // ================================

    modifier onlyRegistered() {
        require(registeredUsers[msg.sender], "User not registered");
        _;
    }

    modifier onlyPolice() {
        require(
            keccak256(bytes(userRoles[msg.sender])) ==
            keccak256(bytes("Police")),
            "Only police officers can add evidence"
        );
        _;
    }

    // ================================
    // USER REGISTRATION
    // ================================

    function registerUser(
        string memory _name,
        string memory _role
    ) public {

        require(!registeredUsers[msg.sender], "User already registered");
        require(bytes(_name).length > 0, "Name required");

        require(
            keccak256(bytes(_role)) == keccak256(bytes("Police")) ||
            keccak256(bytes(_role)) == keccak256(bytes("Court")),
            "Role must be Police or Court"
        );

        userRoles[msg.sender] = _role;
        userNames[msg.sender] = _name;
        registeredUsers[msg.sender] = true;

        emit UserRegistered(msg.sender, _role, _name);
    }

    // ================================
    // ADD EVIDENCE (POLICE ONLY)
    // ================================

    function addEvidence(
        string memory _evidenceId,
        string memory _ipfsHash,
        string memory _caseNumber,
        string memory _location,
        string memory _crimeDescription,
        string memory _evidenceType,
        string memory _password
    )
        public
        onlyRegistered
        onlyPolice
    {
        require(bytes(_evidenceId).length > 0, "Evidence ID required");
        require(bytes(_password).length > 0, "Password required");
        require(
            !evidenceRecords[_evidenceId].exists,
            "Evidence ID already exists"
        );

        evidenceRecords[_evidenceId] = Evidence({
            ipfsHash: _ipfsHash,
            caseNumber: _caseNumber,
            location: _location,
            crimeDescription: _crimeDescription,
            evidenceType: _evidenceType,
            officerName: userNames[msg.sender],
            timestamp: block.timestamp,
            passwordHash: keccak256(bytes(_password)),
            exists: true
        });

        evidenceIds.push(_evidenceId);

        emit EvidenceAdded(
            _evidenceId,
            _ipfsHash,
            userNames[msg.sender],
            block.timestamp
        );
    }

    // ================================
    // VIEW EVIDENCE (PASSWORD PROTECTED)
    // ================================

    function getEvidence(
        string memory _evidenceId,
        string memory _inputPassword
    )
        public
        view
        onlyRegistered
        returns (
            string memory ipfsHash,
            string memory caseNumber,
            string memory location,
            string memory crimeDescription,
            string memory evidenceType,
            string memory officerName,
            uint256 timestamp
        )
    {
        require(
            evidenceRecords[_evidenceId].exists,
            "Evidence does not exist"
        );

        Evidence memory evidence = evidenceRecords[_evidenceId];

        require(
            evidence.passwordHash ==
            keccak256(bytes(_inputPassword)),
            "Incorrect password"
        );

        return (
            evidence.ipfsHash,
            evidence.caseNumber,
            evidence.location,
            evidence.crimeDescription,
            evidence.evidenceType,
            evidence.officerName,
            evidence.timestamp
        );
    }

    // ================================
    // HELPER FUNCTIONS
    // ================================

    function getEvidenceCount() public view returns (uint256) {
        return evidenceIds.length;
    }

    function getEvidenceId(uint256 index)
        public
        view
        returns (string memory)
    {
        require(index < evidenceIds.length, "Invalid index");
        return evidenceIds[index];
    }

    function isUserRegistered(address _userAddress)
        public
        view
        returns (bool)
    {
        return registeredUsers[_userAddress];
    }

    function getUserRole(address _userAddress)
        public
        view
        returns (string memory)
    {
        require(registeredUsers[_userAddress], "User not registered");
        return userRoles[_userAddress];
    }

    function getUserName(address _userAddress)
        public
        view
        returns (string memory)
    {
        require(registeredUsers[_userAddress], "User not registered");
        return userNames[_userAddress];
    }
}