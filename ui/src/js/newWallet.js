const common = require('./common');
const ether = require('./ether');
const smsEther = require('./smsEther');
const smsUtil = require('./smsUtil');
const ethabi = require('ethereumjs-abi');
const Buffer = require('buffer/').Buffer;
const BN = require("bn.js");


const newWallet = module.exports = {
    doNewWallet: function() {
	common.setMenuButtonState('newButton',  'Selected');
	common.setMenuButtonState('loadButton', 'Enabled');
	common.setMenuButtonState('viewButton', 'Enabled');
	common.setMenuButtonState('xactButton', 'Enabled');
	common.replaceElemClassFromTo('newWalletDiv',     'hidden', 'visibleB', true);
	common.replaceElemClassFromTo('loadWalletDiv',    'visibleB', 'hidden', true);
	common.replaceElemClassFromTo('viewWalletDiv',    'visibleB', 'hidden', true);
	common.replaceElemClassFromTo('xactionDiv',       'visibleB', 'hidden', true);
	newWallet.acctList = [];
	newWallet.labelList = [];
	updateNewWalletForm();
    },

    setButtonHandlers: function() {
	document.getElementById('addAccountButton').addEventListener('click', addAccountHandler);
	document.getElementById('deployNewWalletButton').addEventListener('click', deployHandler);
    },

    acctList: [],
    labelList: [],
};





//
// new wallet
// called multiple times
//
function updateNewWalletForm() {
    console.log('updateNewWalletForm');
    const newWalletAccountsListDiv = document.getElementById('newWalletAccountsListDiv');
    smsUtil.listAccounts(newWalletAccountsListDiv, newWallet.acctList, newWallet.labelList);
    // set up threshold selector and init new account addr
    const thresholdSelector = document.getElementById("thresholdSelector");
    const addAccountAddrInput = document.getElementById('addAccountAddrInput');
    const addAccountLabelInput = document.getElementById('addAccountLabelInput');
    common.clearDivChildren(thresholdSelector);
    if (newWallet.acctList.length == 0) {
	const option = document.createElement("option");
	option.text = 'Select Threshold';
	option.value = '0';
	thresholdSelector.appendChild(option);
	//no accounts defined, so set default acct to currently active metamask acct
	addAccountAddrInput.value = common.web3.eth.accounts[0];
	addAccountLabelInput.value = 'My Account';
    } else {
	for (var i = 1; i <= newWallet.acctList.length; ++i) {
	    const option = document.createElement("option");
	    option.text = 'Threshold ' + i.toString(10);
	    option.value = i.toString(10);
	    thresholdSelector.appendChild(option);
	}
	//after first account, ensure no artifacts of default acct in input field
	addAccountAddrInput.value = '';
	addAccountLabelInput.value = '';
    }
    const deployNewWalletButton = document.getElementById('deployNewWalletButton');
    deployNewWalletButton.disabled = (newWallet.acctList.length > 0) ? false : true;
}


function addAccountHandler() {
    console.log('addAccountHandler');
    const addAccountAddrInput = document.getElementById('addAccountAddrInput');
    const newAccountAddr = addAccountAddrInput.value;
    if (!common.web3.isAddress(newAccountAddr)) {
	alert('Error!\n\n' + newAccountAddr + ' is not a valid address!');
	return;
    }
    console.log('addAccountHandler: 1');
    for (let i = 0; i < newWallet.acctList.length; ++i) {
	if (newAccountAddr == newWallet.acctList[i]) {
	    alert('Error!\n\n' + newAccountAddr + ' is already an owner!');
	    return;
	}
    }
    const addAccountLabelInput = document.getElementById('addAccountLabelInput');
    let newAccountLabel = addAccountLabelInput.value;
    if (!newAccountLabel)
	newAccountLabel = 'no label';
    newWallet.acctList.push(newAccountAddr);
    newWallet.labelList.push(newAccountLabel);
    console.log('addAccountHandler: newWallet.acctList.length = ' + newWallet.acctList.length);
    updateNewWalletForm();
}


function deployHandler() {
    console.log('deployHandler');
    const thresholdSelector = document.getElementById("thresholdSelector");
    const thresholdHex = thresholdSelector.value.toString(16);
    const sortedAcctList = [];
    for (var i = 0; i < newWallet.acctList.length; ++i)
	sortedAcctList.push(newWallet.acctList[i]);
    if (sortedAcctList.length > 1)
	sortedAcctList.sort(ether.addressCompare);
    const sortedLabelList = [];
    for (var i = 0; i < sortedAcctList.length; ++i) {
	for (var j = 0; j < newWallet.labelList.length; ++j) {
	    if (newWallet.acctList[j] == sortedAcctList[i]) {
		sortedLabelList.push(newWallet.labelList[j]);
		break;
	    }
	}
    }
    disableAllButtons(true);
    common.showWaitingForMetaMask(true, false);
    const parmsHex = smsEther.abiEncodeConstructorParms(thresholdHex, sortedAcctList, ether.chainId);
    console.log('deployHandler: parmsHex = ' + parmsHex);
    //gas estimates only work on mainnet
    const gasLimit = (ether.chainId == 1) ? 0 : 1000000;
    ether.deployContract(smsEther.abi, smsEther.bin, parmsHex, gasLimit, function(err, txid, contractInstance) {
	common.showWaitingForMetaMask(false, false);
	console.log('deployHandler: txid = ' + txid);
	if (!!err || !txid) {
	    alert('Error in contract deployment transaction!\n\n' + err);
	} else {
	    common.waitForTXID(err, txid, 'Wallet-Deployment', function() {
		alert('Wallet is deployed!');
		disableAllButtons(false);
		common.clearStatusDiv();
		common.replaceElemClassFromTo('newWalletDiv', 'visibleB', 'hidden', true);
	    }, ether.etherscanioTxStatusHost, function(err, receipt) {
		console.log('deployHandler: contract address = ' + receipt.contractAddress);
		//save this wallet
		const addWalletNameInput = document.getElementById('addWalletNameInput');
		const name = addWalletNameInput.value;
		const walletToSave = new smsUtil.Wallet(name, receipt.contractAddress, sortedLabelList, sortedAcctList, thresholdHex, ether.chainId);
		smsUtil.saveWallet(walletToSave);
		console.log('deployHandler: wallet ' + name + ' saved');
	    });
	}
    });
}


function disableAllButtons(disable) {
    document.getElementById('newWalletDiv').disabled = disable;
    document.getElementById('loadWalletDiv').disabled = disable;
    document.getElementById('viewWalletDiv').disabled = disable;
    document.getElementById('xactionDiv').disabled = disable;
    document.getElementById('addAccountButton').disabled = disable;
    document.getElementById('deployNewWalletButton').disabled = disable;
}
