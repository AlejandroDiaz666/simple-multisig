const common = require('./common');
const ether = require('./ether');
const smsEther = require('./smsEther');
const smsUtil = require('./smsUtil');
const ethabi = require('ethereumjs-abi');
const Buffer = require('buffer/').Buffer;
const BN = require("bn.js");


const loadWallet = module.exports = {
    doLoadWallet: function() {
	common.setMenuButtonState('newButton',  'Enabled');
	common.setMenuButtonState('loadButton', 'Selected');
	common.setMenuButtonState('viewButton', 'Enabled');
	common.setMenuButtonState('xactButton', 'Enabled');
	common.replaceElemClassFromTo('newWalletDiv',     'visibleB', 'hidden', true);
	common.replaceElemClassFromTo('loadWalletDiv',    'hidden', 'visibleB', true);
	common.replaceElemClassFromTo('viewWalletDiv',    'visibleB', 'hidden', true);
	common.replaceElemClassFromTo('xactionDiv',       'visibleB', 'hidden', true);
	makeLoadWalletForm();
    },

    setButtonHandlers: function() {
	document.getElementById('loadWalletNameInput').addEventListener('change', savableChangeHandler);
	document.getElementById('loadWalletLoadButton').addEventListener('click', loadWalletLoadHandler);
	document.getElementById('loadWalletJsonButton').addEventListener('click', loadWalletJsonHandler);
	document.getElementById('loadWalletSaveButton').addEventListener('click', loadWalletSaveHandler);
    },

    ownerLabelInputs: null,
    walletToSave: null,
};


//
// load wallet
//
function makeLoadWalletForm() {
    common.clearDivChildren(document.getElementById('loadWalletAccountsListDiv'));
    common.replaceElemClassFromTo('loadWalletAccountsListHeaderDiv', 'visibleB', 'hidden', true);
    common.replaceElemClassFromTo('loadWalletAccountsListDiv',       'visibleB', 'hidden', true);
    common.replaceElemClassFromTo('loadWalletThresholdDiv',          'visibleB', 'hidden', true);
    document.getElementById('loadWalletJson').value = '';
    const loadWalletAddrInput = document.getElementById('loadWalletAddrInput');
    loadWalletAddrInput.value = '';
    loadWalletAddrInput.disabled = false;
    document.getElementById('loadWalletNameInput').value = '';
    const loadWalletSaveButton = document.getElementById('loadWalletSaveButton');
    loadWalletSaveButton.disabled = true;
    loadWallet.walletToSave = null;
}


//
//recursively fill the passed owners array
//
function getOwner(contractInstance, idx, owners, cb) {
    contractInstance.ownersArr.call(idx, function(err, ownerX) {
	console.log('loadWalletLoadHandler: err = ' + err + ', ownersArr(' + idx + ') = ' + ownerX);
	if (!!ownerX && common.web3.isAddress(ownerX)) {
	    owners.push(ownerX);
	    if (idx <= 10) {
		getOwner(contractInstance, idx + 1, owners, cb);
		return;
	    }
	}
	cb();
    });
}


//
// handle load from json
//
function loadWalletJsonHandler() {
    console.log('loadWalletJsonHandler');
    const walletJson = document.getElementById('loadWalletJson').value;
    if (!!walletJson) {
	const wallet = JSON.parse(walletJson);
	if (!wallet || !wallet.thresholdHex || !wallet.contractAddr) {
	    alert('Error!\n\nUnable to parse JSON');
	    return;
	}
	loadWallet.walletToSave = wallet;
	showWallet(loadWallet.walletToSave);
	document.getElementById('loadWalletAddrInput').value = '';
	document.getElementById('loadWalletSaveButton').disabled = false;
    } else {
	alert('Error!\n\Nothing to parse');
    }
}


//
// handle load from address
//
function loadWalletLoadHandler() {
    const loadWalletAddrInput = document.getElementById('loadWalletAddrInput');
    const walletAddr = loadWalletAddrInput.value;
    console.log('loadWalletLoadHandler: walletAddr = ' + walletAddr);
    if (!common.web3.isAddress(walletAddr)) {
	alert('Error!\n\n' + walletAddr + ' is not a valid address!');
	return;
    }
    smsEther.getThreshold(walletAddr, function(err, threshold) {
	if (!threshold || threshold.toString(10) == '0') {
	    alert('Error:\n\nUnable to read contract at specified address');
	    return
	}
	smsEther.getOwners(walletAddr, function(err, ownerAddrs) {
	    const ownerLabels = [];
	    console.log('loadWalletLoadHandler: ownerAddrs.length = ' + ownerAddrs.length);
	    for (var i = 0; i < ownerAddrs.length; ++i)
		ownerLabels.push('');
	    loadWallet.walletToSave = new smsUtil.Wallet(null, walletAddr, ownerLabels, ownerAddrs, threshold.toString(16), ether.chainId);
	    showWallet(loadWallet.walletToSave);
	    document.getElementById('loadWalletJson').value = '';
	    document.getElementById('loadWalletSaveButton').disabled = true;
	});
    });
    var loadWalletSaveButton = document.getElementById('loadWalletSaveButton');
    loadWalletSaveButton.disabled = true;
}


function showWallet(wallet) {
    console.log('showWallet: ' + JSON.stringify(wallet));
    common.replaceElemClassFromTo('loadWalletAccountsListHeaderDiv', 'hidden', 'visibleB', true);
    const loadWalletAccountsListDiv =
	  common.replaceElemClassFromTo('loadWalletAccountsListDiv', 'hidden', 'visibleB', true);
    common.replaceElemClassFromTo('loadWalletThresholdDiv',          'hidden', 'visibleB', true);
    document.getElementById('loadWalletNameInput').value = wallet.name;
    document.getElementById('loadWalletThreshold').value = 'Threshold: ' + wallet.thresholdHex.toString(10);
    loadWallet.ownerLabelInputs = smsUtil.listAccounts(loadWalletAccountsListDiv, wallet.ownerAddrs, wallet.ownerLabels, savableChangeHandler);
    //init wallet-bar: name/addr, threshold, balance, nonce
    const loadContractNameAddr = document.getElementById('loadContractNameAddr');
    loadContractNameAddr.value = wallet.name + ': ' + wallet.contractAddr;
    const loadContractThreshold = document.getElementById('loadContractThreshold');
    loadContractThreshold.value = 'Threshold: ' + wallet.thresholdHex.toString(10);
    ether.getBalance(wallet.contractAddr, 'ether', function(err, balanceEth) {
        loadContractBalance.value = 'Balance: ' + balanceEth.toString(10);
    });
    const loadContractNonce = document.getElementById('loadContractNonce');
    loadContractNonce.value = 'Nonce: refreshing...';
    smsEther.getNonce(wallet.contractAddr, function(err, nonce) {
        loadContractNonce.value = 'Nonce: ' + common.numberToBN(nonce).toString(10);
    });
}


function savableChangeHandler() {
    console.log('savableChangeHandler');
    const loadWalletNameInput = document.getElementById('loadWalletNameInput');
    if (!loadWalletNameInput.value)
	return;
    for (var i = 0; i < loadWallet.walletToSave.ownerAddrs.length; ++i)
	if (!loadWallet.ownerLabelInputs[i].value)
	    return;
    const loadWalletSaveButton = document.getElementById('loadWalletSaveButton');
    loadWalletSaveButton.disabled = false;
}


function loadWalletSaveHandler() {
    //pick up all fields that might have changed
    var loadWalletNameInput = document.getElementById('loadWalletNameInput');
    loadWallet.walletToSave.name = loadWalletNameInput.value;
    for (var i = 0; i < loadWallet.walletToSave.ownerAddrs.length; ++i)
	loadWallet.walletToSave.ownerLabels[i] = loadWallet.ownerLabelInputs[i].value;
    smsUtil.saveWallet(loadWallet.walletToSave);
    alert('Imported wallet has been saved');
    makeLoadWalletForm();
}
