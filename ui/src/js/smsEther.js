/*
 * abi, bin, low-level interaction w/ simple multisig contract
 */
const common = require('./common');
const ether = require('./ether');
const ethUtils = require('ethereumjs-util');
const web3Utils = require('web3-utils');
const ethabi = require('ethereumjs-abi');
const Buffer = require('buffer/').Buffer;
const BN = require("bn.js");

const smsEther = module.exports = {

    bin:
    '608060405234801561001057600080fd5b506040516108fd3803806108fd8339810180604052606081101561003357600080fd5b81516020830180519193928301929164010000000081111561005457600080fd5b8201602081018481111561006757600080fd5b815185602082028301116401000000008211171561008457600080fd5b505060209091015181519193509150600a108015906100a4575081518311155b80156100b05750600083115b15156100bb57600080fd5b6000805b83518110156101655781600160a060020a031684828151811015156100e057fe5b60209081029091010151600160a060020a0316116100fd57600080fd5b600160026000868481518110151561011157fe5b602090810291909101810151600160a060020a03168252810191909152604001600020805460ff1916911515919091179055835184908290811061015157fe5b6020908102909101015191506001016100bf565b508251610179906003906020860190610252565b505060019290925550604080517fd87cd6ef79d4e2b95e15ce8abf732db51ec771f1ca2edccf22a46c729ac564726020808301919091527fb7a0bfa1b79f2443f4d73ebb9259cddbcd510b18be6fc4da7d1aa7b1786e73e6828401527fc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6606083015260808201939093523060a08201527f251543af6a222378665a76fe38dbceae4871a070b7fdaf5c6c30cf758dc33cc060c0808301919091528251808303909101815260e090910190915280519101206004556102de565b8280548282559060005260206000209081019282156102a7579160200282015b828111156102a75782518254600160a060020a031916600160a060020a03909116178255602090920191600190910190610272565b506102b39291506102b7565b5090565b6102db91905b808211156102b3578054600160a060020a03191681556001016102bd565b90565b610610806102ed6000396000f3fe60806040526004361061005b577c0100000000000000000000000000000000000000000000000000000000600035046342cde4e8811461005d578063a0ab965314610084578063aa5df9e2146102e7578063affed0e01461032d575b005b34801561006957600080fd5b50610072610342565b60408051918252519081900360200190f35b34801561009057600080fd5b5061005b60048036036101008110156100a857600080fd5b8101906020810181356401000000008111156100c357600080fd5b8201836020820111156100d557600080fd5b803590602001918460208302840111640100000000831117156100f757600080fd5b919080806020026020016040519081016040528093929190818152602001838360200280828437600092019190915250929594936020810193503591505064010000000081111561014757600080fd5b82018360208201111561015957600080fd5b8035906020019184602083028401116401000000008311171561017b57600080fd5b91908080602002602001604051908101604052809392919081815260200183836020028082843760009201919091525092959493602081019350359150506401000000008111156101cb57600080fd5b8201836020820111156101dd57600080fd5b803590602001918460208302840111640100000000831117156101ff57600080fd5b9190808060200260200160405190810160405280939291908181526020018383602002808284376000920191909152509295600160a060020a038535169560208601359591945092506060810191506040013564010000000081111561026457600080fd5b82018360208201111561027657600080fd5b8035906020019184600183028401116401000000008311171561029857600080fd5b91908080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525092955050600160a060020a038335169350505060200135610348565b3480156102f357600080fd5b506103116004803603602081101561030a57600080fd5b50356105b6565b60408051600160a060020a039092168252519081900360200190f35b34801561033957600080fd5b506100726105de565b60015481565b60015487511461035757600080fd5b85518751148015610369575087518751145b151561037457600080fd5b600160a060020a0382163314806103925750600160a060020a038216155b151561039d57600080fd5b825160208085019190912060008054604080517f3ee892349ae4bbe61dce18f95115b5dc02daf49204cc602458cd4c1f540d56d781870152600160a060020a03808c1682840152606082018b9052608082019590955260a081019290925292861660c082015260e080820186905283518083039091018152610100820184528051908501206004547f19010000000000000000000000000000000000000000000000000000000000006101208401526101228301526101428083018290528451808403909101815261016290920190935280519301929092209091805b6001548110156105825760006001848e8481518110151561049757fe5b906020019060200201518e858151811015156104af57fe5b906020019060200201518e868151811015156104c757fe5b9060200190602002015160405160008152602001604052604051808581526020018460ff1660ff1681526020018381526020018281526020019450505050506020604051602081039080840390855afa158015610528573d6000803e3d6000fd5b50505060206040510351905082600160a060020a031681600160a060020a031611801561056d5750600160a060020a03811660009081526002602052604090205460ff165b151561057857600080fd5b915060010161047a565b5060008054600101815586518190819060208a018b8d8af190508015156105a857600080fd5b505050505050505050505050565b60038054829081106105c457fe5b600091825260209091200154600160a060020a0316905081565b6000548156fea165627a7a723058207715998a969bc5f0e251d5961811d9940702fa06a112d4d0c195a698e5d3ac7b0029',

    abi:
    '[{"constant":true,"inputs":[],"name":"threshold","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"sigV","type":"uint8[]"},{"name":"sigR","type":"bytes32[]"},{"name":"sigS","type":"bytes32[]"},{"name":"destination","type":"address"},{"name":"value","type":"uint256"},{"name":"data","type":"bytes"},{"name":"executor","type":"address"},{"name":"gasLimit","type":"uint256"}],"name":"execute","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"ownersArr","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"nonce","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"threshold_","type":"uint256"},{"name":"owners_","type":"address[]"},{"name":"chainId","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"}]',

    SALT:
    '0x251543af6a222378665a76fe38dbceae4871a070b7fdaf5c6c30cf758dc33cc0',


    source:
    '\
	<p>\
	  The multi-sig wallet that is deployed by this front-end was compiled from the Simple MultiSig Wallet Contract written by Christian Lundkvist.\
	  Mr. Lundkvist presented the idea <a href="https://medium.com/@ChrisLundkvist/exploring-simpler-ethereum-multisig-contracts-b71020c19037" target="_blank">here</a>.\
	</p>\
	<p>\
	  Mr. Lundkvist\'s code is available on <a href="https://github.com/christianlundkvist/simple-multisig" target="_blank">Christian Lundkvist\'s github</a>, while\
	  the forked respoitory, which contains this user interface is available\
	  on <a href="https://github.com/AlejandroDiaz666/simple-multisig" target="_blank">Alejandro Diaz\'s github</a>.\
	</p>\
	<p>\
	  The contract source code is reproduced below for your reference:</br>\
	</p>\
	<p class="code">\
pragma solidity ^0.5.0;<br/>\
<br/>\
contract SimpleMultiSig {<br/>\
<br/>\
// EIP712 Precomputed hashes:<br/>\
// keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,bytes32 salt)")<br/>\
bytes32 constant EIP712DOMAINTYPE_HASH = 0xd87cd6ef79d4e2b95e15ce8abf732db51ec771f1ca2edccf22a46c729ac56472;<br/>\
<br/>\
// kekkac256("Simple MultiSig")<br/>\
bytes32 constant NAME_HASH = 0xb7a0bfa1b79f2443f4d73ebb9259cddbcd510b18be6fc4da7d1aa7b1786e73e6;<br/>\
<br/>\
// kekkac256("1")<br/>\
bytes32 constant VERSION_HASH = 0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6;<br/>\
<br/>\
// kekkac256("MultiSigTransaction(address destination,uint256 value,bytes data,uint256 nonce,address executor,uint256 gasLimit)")<br/>\
bytes32 constant TXTYPE_HASH = 0x3ee892349ae4bbe61dce18f95115b5dc02daf49204cc602458cd4c1f540d56d7;<br/>\
<br/>\
bytes32 constant SALT = 0x251543af6a222378665a76fe38dbceae4871a070b7fdaf5c6c30cf758dc33cc0;<br/>\
<br/>\
  uint public nonce;                 // (only) mutable state<br/>\
  uint public threshold;             // immutable state<br/>\
  mapping (address => bool) isOwner; // immutable state<br/>\
  address[] public ownersArr;        // immutable state<br/>\
<br/>\
  bytes32 DOMAIN_SEPARATOR;          // hash for EIP712, computed from contract address<br/>\
<br/>\
  // Note that owners_ must be strictly increasing, in order to prevent duplicates<br/>\
  constructor(uint threshold_, address[] memory owners_, uint chainId) public {<br/>\
    require(owners_.length <= 10 && threshold_ <= owners_.length && threshold_ > 0);<br/>\
<br/>\
    address lastAdd = address(0);<br/>\
    for (uint i = 0; i < owners_.length; i++) {<br/>\
      require(owners_[i] > lastAdd);<br/>\
      isOwner[owners_[i]] = true;<br/>\
      lastAdd = owners_[i];<br/>\
    }<br/>\
    ownersArr = owners_;<br/>\
    threshold = threshold_;<br/>\
<br/>\
    DOMAIN_SEPARATOR = keccak256(abi.encode(EIP712DOMAINTYPE_HASH,<br/>\
                                            NAME_HASH,<br/>\
                                            VERSION_HASH,<br/>\
                                            chainId,<br/>\
                                            this,<br/>\
                                            SALT));<br/>\
  }<br/>\
<br/>\
  // Note that address recovered from signatures must be strictly increasing, in order to prevent duplicates<br/>\
  function execute(uint8[] memory sigV, bytes32[] memory sigR, bytes32[] memory sigS, address destination, uint value, bytes memory data, address executor, uint gasLimit) public {<br/>\
    require(sigR.length == threshold);<br/>\
    require(sigR.length == sigS.length && sigR.length == sigV.length);<br/>\
    require(executor == msg.sender || executor == address(0));<br/>\
<br/>\
    // EIP712 scheme: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md<br/>\
    bytes32 txInputHash = keccak256(abi.encode(TXTYPE_HASH, destination, value, keccak256(data), nonce, executor, gasLimit));<br/>\
    bytes32 totalHash = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, txInputHash));<br/>\
<br/>\
    address lastAdd = address(0); // cannot have address(0) as an owner<br/>\
    for (uint i = 0; i < threshold; i++) {<br/>\
      address recovered = ecrecover(totalHash, sigV[i], sigR[i], sigS[i]);<br/>\
      require(recovered > lastAdd && isOwner[recovered]);<br/>\
      lastAdd = recovered;<br/>\
    }<br/>\
<br/>\
    // If we make it here all signatures are accounted for.<br/>\
    // The address.call() syntax is no longer recommended, see:<br/>\
    // https://github.com/ethereum/solidity/issues/2884<br/>\
    nonce = nonce + 1;<br/>\
    bool success = false;<br/>\
    assembly { success := call(gasLimit, destination, value, add(data, 0x20), mload(data), 0, 0) }<br/>\
    require(success);<br/>\
  }<br/>\
<br/>\
  function () payable external {}<br/>\
}<br/>\
',


    abiEncodeConstructorParms: function(thresholdHex, owners, chainId) {
	if (thresholdHex.startsWith('0x'))
	    thresholdHex = thresholdHex.substring(2);
	const chainIdHex = chainId.toString(16);
	console.log('abiEncodeConstructorParms: owners =  ' + owners.toString());
	console.log('abiEncodeConstructorParms: thresholdHex = ' + thresholdHex + ', chainIdHex = ' + chainIdHex);
	encoded = ethabi.rawEncode([ 'uint256', 'address[]', 'uint256' ], [ new BN(thresholdHex, 16), owners, new BN(chainIdHex, 16) ] ).toString('hex');
	return(encoded);
    },


    // cb(err, nonce)
    getNonce: function(contractAddr, cb) {
	const ABIArray = JSON.parse(smsEther.abi);
	const contract = common.web3.eth.contract(ABIArray);
	const contractInstance = contract.at(contractAddr);
	contractInstance.nonce(cb);
    },

    // cb(err, threshold)
    getThreshold: function(contractAddr, cb) {
	const ABIArray = JSON.parse(smsEther.abi);
	const contract = common.web3.eth.contract(ABIArray);
	const contractInstance = contract.at(contractAddr);
	contractInstance.threshold(cb);
    },

    // cb(err, owners)
    getOwners: function(contractAddr, cb) {
	const ABIArray = JSON.parse(smsEther.abi);
	const contract = common.web3.eth.contract(ABIArray);
	const contractInstance = contract.at(contractAddr);
	const owners = [];
	getOwner(contractInstance, 0, owners, cb);
    },


    //
    // create typed data for a transaction ala EIP 712
    //
    eip712TypedData: function(fromAddr, contractAddr, destination, valueBN, dataHex, nonceBN, executor, gasLimitBN, cb) {
	console.log('eip712TypedData: contractAddr = ' + contractAddr + ', destination = ' + destination +
		    ', valueBN = ' + valueBN.toString(10) + ', dataHex = ' + dataHex + ', nonceBN = ' + nonceBN.toString(10));
	console.log('ether.chainId = ' + ether.chainId);
	console.log('eip712TypedData: fromAddr = ' + fromAddr);
	const domain = [
	    { name: "name", type: "string" },
	    { name: "version", type: "string" },
	    { name: "chainId", type: "uint256" },
	    { name: "verifyingContract", type: "address" },
	    { name: "salt", type: "bytes32" },
	];
	const domainData = {
	    name: 'Simple MultiSig',
	    version: '1',
	    chainId: ether.chainId,
	    verifyingContract: contractAddr,
	    salt: smsEther.SALT,
	};
	const transaction = [
    	    { name: "destination", type: "address" },
    	    { name: "value",       type: "uint256" },
    	    { name: "data",        type: "bytes"   },
    	    { name: "nonce",       type: "uint256" },
    	    { name: "executor",    type: "address" },
    	    { name: "gasLimit",    type: "uint256" },

	];
	const transactionData = {
    	    destination: destination,
    	    value: '0x' + valueBN.toString(16),
    	    data: dataHex,
	    nonce: '0x' + nonceBN.toString(16),
	    executor: executor,
	    gasLimit: '0x' + gasLimitBN.toString(16),
	};
	const data = JSON.stringify({
	    types: {
		EIP712Domain: domain,
		MultiSigTransaction: transaction,
	    },
	    domain: domainData,
	    primaryType: 'MultiSigTransaction',
	    message: transactionData,
	});
	const typedDataParms = {
	    method: 'eth_signTypedData_v3',
	    params: [fromAddr, data],
	    from: fromAddr,
	};
	return(typedDataParms);
    },


    //
    // returns(recoveredAddr)
    //
    recoverAddr: function(signature, contractAddr, destination, valueBN, dataHex, nonceBN, executor, gasLimitBN) {
	console.log('recoverAddr');
	const TRANSACTION_TYPEHASH = web3Utils.soliditySha3("MultiSigTransaction(address destination,uint256 value,bytes data,uint256 nonce,address executor,uint256 gasLimit)");
	const EIP712DOMAIN_TYPEHASH = web3Utils.soliditySha3("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,bytes32 salt)");
	console.log('recoverAddr: TRANSACTION_TYPEHASH = ' + TRANSACTION_TYPEHASH);
	console.log('recoverAddr: EIP712DOMAIN_TYPEHASH = ' + EIP712DOMAIN_TYPEHASH);
	const nameHash = web3Utils.soliditySha3('Simple MultiSig');
	const versionHash = web3Utils.soliditySha3( { type: 'string', value: '1' } );
	let domainEncoded = ethabi.rawEncode([ 'bytes32', 'bytes32', 'bytes32', 'uint256', 'address', 'bytes32'],
					     [ EIP712DOMAIN_TYPEHASH, nameHash, versionHash, ether.chainId, contractAddr, smsEther.SALT ]);
	const DOMAIN_SEPARATOR = web3Utils.soliditySha3('0x' + domainEncoded.toString('hex'));
	console.log('recoverAddr: DOMAIN_SEPARATOR = ' + DOMAIN_SEPARATOR);
	const bytesHash = common.web3.sha3(dataHex, {encoding: 'hex'});
	console.log('recoverAddr: bytesHash = ' + bytesHash);
	const txEncoded = ethabi.rawEncode([ 'bytes32', 'address', 'uint256', 'bytes32', 'uint256', 'address', 'uint256' ],
    					   [ TRANSACTION_TYPEHASH, destination, valueBN, bytesHash, nonceBN, executor, gasLimitBN ]);
	const txHash = web3Utils.soliditySha3('0x' + txEncoded.toString('hex'));
	console.log('recoverAddr: txEncoded = 0x' + txEncoded.toString('hex') + ', txHash = ' + txHash);
	const domainTxHash = ethabi.soliditySHA3([ 'uint8', 'uint8', 'bytes32', 'bytes32' ],
						 [ 0x19, 0x01, DOMAIN_SEPARATOR, txHash]).toString('hex');
	console.log('recoverAddr: domainTxHash = ' + domainTxHash);
	const res = ethUtils.fromRpcSig(signature);
	const pub = ethUtils.ecrecover(ethUtils.toBuffer('0x' + domainTxHash), res.v, res.r, res.s);
	const addrBuf = ethUtils.pubToAddress(pub);
	const recoveredAddr = ethUtils.bufferToHex(addrBuf);
	console.log('recoverAddr: got address = ' + recoveredAddr);
	return(recoveredAddr);
    },


    //
    // cb(err, txid)
    // function execute(uint8[] sigV, bytes32[] sigR, bytes32[] sigS, address dest, uint value, bytes data, address executor, uint gasLimit);
    //
    execute: function(contractAddr, signatures, toAddr, valueBN, dataHex, executor, gasLimitBN, cb) {
	console.log('smsEther.execute');
	let sigR = [];
	let sigS = [];
	let sigV = [];
	console.log('smsEther.execute: 0');
	for (let i = 0; i < signatures.length; ++i) {
	    const sig = ethUtils.stripHexPrefix(signatures[i]);
	    console.log('smsEther.execute: 0b sig = ' + sig);
	    sigR.push('0x' + sig.substring(0, 64));
	    sigS.push('0x' + sig.substring(64, 128));
	    sigV.push('0x' + sig.substring(128, 130));
	    console.log('smsEther.execute: 0c');
	}
	console.log('smsEther.execute: a');
	const ABIArray = JSON.parse(smsEther.abi);
	console.log('smsEther.execute: b');
	const contract = common.web3.eth.contract(ABIArray);
	console.log('smsEther.execute: c');
	const contractInstance = contract.at(contractAddr);
	console.log('smsEther.execute: about to execute');
	contractInstance.execute(sigV, sigR, sigS, toAddr, '0x' + valueBN.toString(16), dataHex, executor, '0x' + gasLimitBN.toString(16), cb);
    },

}


//
// cb(err, owners)
// recursively fill the passed owners array
//
function getOwner(contractInstance, idx, owners, cb) {
    contractInstance.ownersArr(idx, function(err, ownerX) {
	console.log('getOwner: err = ' + err + ', ownersArr[' + idx + '] = ' + ownerX);
	if (!err && !!ownerX && common.web3.isAddress(ownerX)) {
	    owners.push(ownerX);
	    if (idx <= 10) {
		getOwner(contractInstance, idx + 1, owners, cb);
		return;
	    }
	}
	cb(err, owners);
    });
}
