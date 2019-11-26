pragma solidity >0.4.99;
contract Musix {
    
    address public dev;

    event NewMusix(
        bytes32 indexed genre,
        bytes32 indexed artist,
        bytes32 indexed album,
        bytes title,
        bytes id
    );

    constructor() public {
        dev = msg.sender;
    }

    function setMusix(bytes32 _genre, bytes32 _artist, bytes32 _album, bytes calldata _title, bytes calldata _ipfs) external {
        emit NewMusix(_genre, _artist, _album, _title, _ipfs);
    }

    function destroy() public {
        require(msg.sender == dev, "ONLY_DEV");
        selfdestruct(msg.sender);
    }
}