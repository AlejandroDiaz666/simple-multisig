const common = require('./common');
const ether = require('./ether');
const smsEther = require('./smsEther');
const smsUtil = require('./smsUtil');
const ethUtils = require('ethereumjs-util');
const web3Utils = require('web3-utils');
const ethabi = require('ethereumjs-abi');
const Buffer = require('buffer/').Buffer;
const BN = require("bn.js");


const xaction = module.exports = {
    doXaction: function() {
	common.setMenuButtonState('newButton',  'Enabled');
	common.setMenuButtonState('loadButton', 'Enabled');
	common.setMenuButtonState('viewButton', 'Enabled');
	common.setMenuButtonState('xactButton', 'Selected');
	common.replaceElemClassFromTo('newWalletDiv',     'visibleB', 'hidden', true);
	common.replaceElemClassFromTo('loadWalletDiv',    'visibleB', 'hidden', true);
	common.replaceElemClassFromTo('viewWalletDiv',    'visibleB', 'hidden', true);
	common.replaceElemClassFromTo('xactionDiv',       'hidden',   'visibleB', true);
	makeXactionForm();
    },

    setButtonHandlers: function() {
	console.log('xaction: setButtonHandlers 0');
	document.getElementById('xactionWalletSelector').addEventListener('change', xactionWalletSelectorHandler);
	document.getElementById('xactionToInput').addEventListener('change', toAddrChangeHandler);
	document.getElementById('xactionValueInput').addEventListener('change', savableChangeHandler);
	document.getElementById('xactionUnitSelector').addEventListener('change', savableChangeHandler);
	document.getElementById('xactionNonceInput').addEventListener('change', savableChangeHandler);
	document.getElementById('xactionData').addEventListener('change', savableChangeHandler);
	document.getElementById('xactionExecutor').addEventListener('change', executorChangeHandler);
	document.getElementById('xactionGasInput').addEventListener('change', savableChangeHandler);
	document.getElementById('xactionSignButton').addEventListener('click', signHandler);
	document.getElementById('xactionExecuteButton').addEventListener('click', executeHandler);
	document.getElementById('xactionJsonButton').addEventListener('click', loadJsonHandler);
    },

    transaction: null,
    signatureInputs: null,
    selectedWallet: null,
    mySigInput: null,
};


function Transaction(contractAddr, toAddr, value, dataHex, nonce, executor, gasLimit, signatures) {
    console.log('Transaction');
    this.contractAddr = contractAddr;
    this.toAddr = toAddr;
    this.value = value;
    this.dataHex = dataHex;
    this.nonce = nonce;
    this.executor = executor;
    this.gasLimit = gasLimit;
    this.signatures = signatures;
}



//
// select the wallet upon which we will execute the transaction
//
function makeXactionForm() {
    const walletList = smsUtil.getWalletList();
    const xactionWalletSelector = document.getElementById('xactionWalletSelector');
    common.clearDivChildren(xactionWalletSelector);
    for (let i = 0; i < walletList.length; ++i) {
        const option = document.createElement("option");
        const wallet = smsUtil.getWallet(walletList[i]);
        option.text = wallet.name + ': ' + wallet.contractAddr;
        option.value = wallet.contractAddr;
        xactionWalletSelector.appendChild(option);
    }
    if (walletList.length > 0) {
	xactionWalletView(walletList[0])
    } else {
	const option = document.createElement('option');
	option.text = 'No wallets in local storage';
	option.value = '';
	xactionWalletSelector.appendChild(option);
    }
}


function xactionWalletSelectorHandler() {
    console.log('xactionWalletSelectorHandler');
    const xactionWalletSelector = document.getElementById("xactionWalletSelector");
    const contractAddr = xactionWalletSelector.value;
    if (!!contractAddr)
	xactionWalletView(contractAddr);
}


function xactionWalletView(contractAddr) {
    console.log('xactionWalletView: contract = ' + contractAddr);
    const wallet = smsUtil.getWallet(contractAddr);
    xaction.selectedWallet = wallet;
    console.log('xactionWalletView: wallet = ' + JSON.stringify(wallet));
    xaction.mySigInput = null;
    document.getElementById('xactionSignButton').disabled = true;
    document.getElementById('xactionExecuteButton').disabled = true;
    //init xaction data
    document.getElementById('xactionJsonArea').value = '';
    document.getElementById('xactionJsonArea').placeholder =
	'If you have JSON data for a transaction, paste it here and then click the\n' +
	' \'Load transaction from JSON\' button.\n' +
	'As you modify the transaction, updated JSON data will be displayed here.';
    document.getElementById('xactionToInput').value = '';
    document.getElementById('xactionValueInput').value = '';
    document.getElementById('xactionNonceInput').value = 'loading';
    document.getElementById('xactionData').value = '';
    document.getElementById('xactionExecutor').value = '';
    document.getElementById('xactionGasInput').value = '21000';
    var xactionAccountsListDiv = document.getElementById('xactionAccountsListDiv');
    xaction.signatureInputs = smsUtil.listAccounts(xactionAccountsListDiv, wallet.ownerAddrs, wallet.ownerLabels, null, [], signatureHandler);
    for (let i = 0; i < xaction.signatureInputs.length; ++i) {
	if (wallet.ownerAddrs[i].toLowerCase() == common.web3.eth.accounts[0].toLowerCase())
            xaction.mySigInput = xaction.signatureInputs[i];
    }
    if (!!xaction.mySigInput)
	console.log('xactionWalletView: found mySigInput');
    else
	console.log('xactionWalletView: did not find mySigInput');
    //init wallet-bar: name/addr, threshold, balance, nonce
    const xactionContractNameAddr = document.getElementById('xactionContractNameAddr');
    xactionContractNameAddr.value = wallet.name + ': ' + wallet.contractAddr;
    const xactionContractThreshold = document.getElementById('xactionContractThreshold');
    xactionContractThreshold.value = 'Threshold: ' + wallet.thresholdHex.toString(10);
    const xactionContractBalance = document.getElementById('xactionContractBalance');
    xactionContractBalance.value = 'Balance: refreshing...';
    ether.getBalance(wallet.contractAddr, 'ether', function(err, balanceEth) {
        xactionContractBalance.value = 'Balance: ' + balanceEth.toString(10);
    });
    const xactionContractNonce = document.getElementById('xactionContractNonce');
    xactionContractNonce.value = 'Nonce: refreshing...';
    smsEther.getNonce(wallet.contractAddr, function(err, nonce) {
        console.log('viewWalletView: err = ' + err + ', nonce = ' + nonce);
	const nonceStr = common.numberToBN(nonce).toString(10);
        xactionContractNonce.value = 'Nonce: ' + nonceStr;
	document.getElementById('xactionNonceInput').value = nonceStr;
    });
    //
    viewWalletSaveButton.disabled = true;
    var xactionExecuteButton = document.getElementById('xactionExecuteButton');
    xactionExecuteButton.disabled = true;
}


//
// initialize all input fields from json
//
function loadJsonHandler() {
    const transactionJson = document.getElementById('xactionJsonArea').value;
    if (!transactionJson) {
	alert('Error!\n\Nothing to parse');
	return;
    }
    const transaction = JSON.parse(transactionJson);
    if (!transaction || !transaction.contractAddr) {
	alert('Error!\n\nUnable to parse JSON');
	return;
    }
    if (transaction.contractAddr.toLowerCase() != xaction.selectedWallet.contractAddr.toLowerCase()) {
	alert('Error!\n\Transaction is not from this wallet');
	return;
    }
    const valueBN = common.numberToBN(transaction.value);
    const numberAndUnits = ether.convertWeiBNToNumberAndUnits(valueBN);
    document.getElementById('xactionToInput').value = transaction.toAddr;
    document.getElementById('xactionValueInput').value = numberAndUnits.number.toString(10);
    const unitsElem = document.getElementById('xactionUnitSelector');
    for (let option = unitsElem.firstChild; option !== null; option = option.nextSibling) {
	if (option.value == numberAndUnits.multiplyer) {
	    option.selected = true;
	    break;
	}
    }
    document.getElementById('xactionData').value = transaction.dataHex;
    document.getElementById('xactionNonceInput').value = transaction.nonce;
    document.getElementById('xactionExecutor').value = transaction.executor;
    document.getElementById('xactionGasInput').value = transaction.gasLimit;
    if (savableChangeHandler(false)) {
	for (let i = 0; i < xaction.signatureInputs.length; ++i) {
	    if (transaction.signatures && transaction.signatures.length >= i && !!transaction.signatures[i])
		xaction.signatureInputs[i].value = transaction.signatures[i];
	}
	signatureHandler();
    }
}


//
// precursor to savableChangeHandler, specifically for the toAddr input
// replaces ens names if necessary
//
function toAddrChangeHandler() {
    document.getElementById('xactionSignButton').disabled = true;
    document.getElementById('xactionExecuteButton').disabled = true;
    for (let i = 0; i < xaction.signatureInputs.length; ++i)
        xaction.signatureInputs[i].value = '';
    const xactionToInput = document.getElementById('xactionToInput');
    let toAddr = xactionToInput.value;
    if (!toAddr)
	return;
    if (toAddr.indexOf('(') >= 0) {
	//for ens names, actual addr is beween parens
	toAddr = toAddr.replace(/[^\(]*\(([^]*)\).*/, "$1");
    }
    if (!ether.validateAddr(toAddr)) {
	ether.ensLookup(toAddr, function(err, addr) {
	    if (!!err || !addr) {
		alert('Error: invalid destination address.');
		return;
	    }
	    xactionToInput.value = toAddr + ' (' + addr + ')';
	    savableChangeHandler();
	});
	return;
    }
    savableChangeHandler();
}


//
// precursor to savableChangeHandler, specifically for the executor input
// replaces ens names and zero address if necessary
//
function executorChangeHandler() {
    const xactionExecutor = document.getElementById('xactionExecutor');
    let toAddr = xactionToInput.value;
    let executorAddr = xactionExecutor.value;
    document.getElementById('xactionSignButton').disabled = true;
    document.getElementById('xactionExecuteButton').disabled = true;
    for (let i = 0; i < xaction.signatureInputs.length; ++i)
        xaction.signatureInputs[i].value = '';
    if (!executorAddr)
	return;
    console.log('executorAddr = ' + executorAddr + ', length = ' + executorAddr.length);
    if (executorAddr.indexOf('(') >= 0) {
	//for ens names, actual addr is beween parens
	executorAddr = executorAddr.replace(/[^\(]*\(([^]*)\).*/, "$1");
    }
    if (executorAddr.startsWith('0x0') && executorAddr.length < 42)
	xactionExecutor.value = executorAddr = common.rightPadTo(executorAddr, 42, '0');
    console.log('executorAddr = ' + executorAddr + ', length = ' + executorAddr.length);
    if (!ether.validateAddr(executorAddr)) {
	ether.ensLookup(executorAddr, function(err, addr) {
	    if (!!err || !addr) {
		alert('Error: invalid executor address.');
		return;
	    }
	    xactionExecutor.value = executorAddr + ' (' + addr + ')';
	    savableChangeHandler();
	});
	return;
    }
    savableChangeHandler();
}


//
// enable the xactionSignButton if all fields are properly filled in.
// returns true if everything is filled-in, otherwise false
//
// clearSignatures is optional, default true
//
function savableChangeHandler(clearSignatures) {
    console.log('savableChangeHandler: clearSignatures = ' + clearSignatures);
    if (clearSignatures === undefined)
	clearSignatures = true;
    if (clearSignatures) {
	document.getElementById('xactionSignButton').disabled = true;
	document.getElementById('xactionExecuteButton').disabled = true;
	for (let i = 0; i < xaction.signatureInputs.length; ++i)
            xaction.signatureInputs[i].value = '';
    }
    const xactionToInput = document.getElementById('xactionToInput');
    const xactionExecutor = document.getElementById('xactionExecutor');
    let toAddr = xactionToInput.value;
    let executorAddr = xactionExecutor.value;
    const value = document.getElementById('xactionValueInput').value;
    const units = document.getElementById('xactionUnitSelector').value;
    const valueBN = common.numberToBN(value);
    valueBN.imul(common.numberToBN(units));
    const dataHex = document.getElementById('xactionData').value;
    const nonce = document.getElementById('xactionNonceInput').value;
    const gasLimit = document.getElementById('xactionGasInput').value;
    xaction.transaction = new Transaction(xaction.selectedWallet.contractAddr, toAddr, '0x' + valueBN.toString(16), dataHex, nonce, executorAddr, gasLimit, []);
    document.getElementById('xactionJsonArea').value = JSON.stringify(xaction.transaction);
    if (!toAddr || !executorAddr || !value || !nonce ||	!gasLimit)
	return(false);
    console.log('savableChangeHandler: 0');
    //for ens names, actual addr is beween parens
    if (toAddr.indexOf('(') >= 0)
	toAddr = toAddr.replace(/[^\(]*\(([^]*)\).*/, "$1");
    if (executorAddr.indexOf('(') >= 0)
	executorAddr = executorAddr.replace(/[^\(]*\(([^]*)\).*/, "$1");
    if (!ether.validateAddr(toAddr) || !ether.validateAddr(executorAddr))
	return(false);
    if (!!xaction.mySigInput)
	document.getElementById('xactionSignButton').disabled = false;
    return(true);
}



function signHandler() {
    console.log('signHandler');
    if (!savableChangeHandler(false))
	return;
    const xactionToInput = document.getElementById('xactionToInput');
    let toAddr = xactionToInput.value;
    if (toAddr.indexOf('(') >= 0) {
	//for ens names, actual addr is beween parens
	toAddr = msgAddrArea.value.replace(/[^\(]*\(([^]*)\).*/, "$1");
    }
    if (!toAddr || !common.web3.isAddress(toAddr)) {
        alert('Error comupting transaction hash:\n\n' + 'Transaction destination, ' + toAddr + ' is not a valid address!');
	return;
    }
    const xactInfo = collectXactInfo();
    console.log('signHandler: xactInfo = ' + JSON.stringify(xactInfo));
    const typedDataParms = smsEther.eip712TypedData(common.web3.eth.accounts[0], xactInfo.contractAddr, xactInfo.toAddr, xactInfo.valueBN,
						    xactInfo.dataHex, xactInfo.nonceBN, xactInfo.executor, xactInfo.gasLimitBN);
    common.web3.currentProvider.sendAsync(typedDataParms, function(err, result) {
	if (err) {
	    alert('Error signing transaction: ' + err);
	    return;
	}
	console.log('signHandler: signature = ' + result.result);
        xaction.mySigInput.value = result.result;
        signatureHandler();
    });
}


//
// call this handler whenever a signature is added
//
function signatureHandler() {
    console.log('signatureHandler');
    const xactionExecuteButton = document.getElementById('xactionExecuteButton');
    xactionExecuteButton.disabled = true;
    const xactInfo = collectXactInfo();
    console.log('signatureHandler: xactInfo = ' + JSON.stringify(xactInfo));
    let sigCount = 0;
    const signatures = [];
    for (let i = 0; i < xaction.signatureInputs.length; ++i) {
        const signature = xaction.signatureInputs[i].value;
	signatures[i] = signature;
        if (!!signature) {
	    console.log('signatureHandler: checking address #' + i.toString(10));
	    const address = smsEther.recoverAddr(signature, xactInfo.contractAddr, xactInfo.toAddr, xactInfo.valueBN,
						 xactInfo.dataHex, xactInfo.nonceBN, xactInfo.executor, xactInfo.gasLimitBN);
            console.log('signatureHandler: got address = ' + address + ' from sig #' + i);
            if (address.toLowerCase() === xaction.selectedWallet.ownerAddrs[i].toLowerCase()) {
                ++sigCount;
		if (address.toLowerCase() == common.web3.eth.accounts[0].toLowerCase())
		    document.getElementById('xactionSignButton').disabled = true;
            } else {
                alert('Signature for owner #' + i.toString(10) + ' (' + xaction.selectedWallet.ownerLabels[i] + ') does not match!\n\n' +
                      'Either the signature is from a different account, or the transaction that was signed is different from ' +
                      'the currently displayed transaction.');
		return;
            }
        }
    }
    xaction.transaction.signatures = signatures;
    document.getElementById('xactionJsonArea').value = JSON.stringify(xaction.transaction);
    console.log('signatureHandler: sigCount = ' + sigCount + ' thresholdHex = ' + xaction.selectedWallet.thresholdHex);
    const threshold = parseInt(xaction.selectedWallet.thresholdHex, 16);
    if (sigCount >= threshold) {
	console.log('signatureHandler: threshold met');
	const executorBN = common.numberToBN(xactInfo.executor);
	console.log('signatureHandler: executorBN = 0x' + executorBN.toString(16));
	if (executorBN.isZero() || xactInfo.executor.toLowerCase() == common.web3.eth.accounts[0].toLowerCase()) {
	    console.log('signatureHandler: execute enabled');
	    xactionExecuteButton.disabled = false;
	}
    }
}


function executeHandler() {
    console.log('executeHandler');
    const xactInfo = collectXactInfo();
    const signatures = [];
    for (let i = 0; i < xaction.signatureInputs.length; ++i) {
	if (!!xaction.signatureInputs[i].value)
            signatures.push(xaction.signatureInputs[i].value);
    }
    common.showWaitingForMetaMask(true, false);
    console.log('executeHandler: calling smsEther.execute');
    smsEther.execute(xactInfo.contractAddr, signatures, xactInfo.toAddr, xactInfo.valueBN,
		     xactInfo.dataHex, xactInfo.executor, xactInfo.gasLimitBN, function(err, txid) {
	common.showWaitingForMetaMask(false, false);
	console.log('executeHandler: txid = ' + txid);
	if (!!err || !txid) {
	    alert('Error in multisig transaction!\n\n' + err);
	} else {
	    const continueFcn = () => {
		alert('Multisig transaction executed!');
		//disableAllButtons(false);
		common.clearStatusDiv();
		xactionWalletView(xaction.selectedWallet.contractAddr);
	    };
	    common.waitForTXID(err, txid, 'Multisig-Transaction', continueFcn, ether.etherscanioTxStatusHost, null);
	}
    });
}




//
// package up all the transaction info into one object
// eg:
//  xactInfo = { contractAddr: "0x...", toAddr: "0x...", valueBN: bn, dataHex: "", nonceBN: bn, executor: "0x...", gasLimitBN: bn }
//
function collectXactInfo() {
    let toAddr = document.getElementById('xactionToInput').value;
    if (toAddr.indexOf('(') >= 0) {
	//for ens names, actual addr is beween parens
	toAddr = toAddr.value.replace(/[^\(]*\(([^]*)\).*/, "$1");
    }
    const value = document.getElementById('xactionValueInput').value;
    const units = document.getElementById('xactionUnitSelector').value;
    const valueBN = common.numberToBN(value);
    valueBN.imul(common.numberToBN(units));
    const nonce = document.getElementById('xactionNonceInput').value;
    const nonceBN = common.numberToBN(nonce);
    const dataHex = document.getElementById('xactionData').value;
    let executorAddr = document.getElementById('xactionExecutor').value;
    if (executorAddr.indexOf('(') >= 0) {
	//for ens names, actual addr is beween parens
	executorAddr = executorAddr.value.replace(/[^\(]*\(([^]*)\).*/, "$1");
    }
    const gas = document.getElementById('xactionGasInput').value;
    const gasLimitBN = common.numberToBN(gas);
    const xactInfo = { contractAddr: xaction.selectedWallet.contractAddr,
		       toAddr: toAddr,
		       valueBN: valueBN,
		       dataHex: dataHex,
		       nonceBN: nonceBN,
		       executor: executorAddr,
		       gasLimitBN: gasLimitBN,
		     };
    return(xactInfo);
}
