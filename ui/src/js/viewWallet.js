const common = require('./common');
const ether = require('./ether');
const smsEther = require('./smsEther');
const smsUtil = require('./smsUtil');
const ethabi = require('ethereumjs-abi');
const Buffer = require('buffer/').Buffer;
const BN = require("bn.js");


const viewWallet = module.exports = {
    doViewWallet: function() {
	common.setMenuButtonState('newButton',  'Enabled');
	common.setMenuButtonState('loadButton', 'Enabled');
	common.setMenuButtonState('viewButton', 'Selected');
	common.setMenuButtonState('xactButton', 'Enabled');
	common.replaceElemClassFromTo('newWalletDiv',     'visibleB', 'hidden', true);
	common.replaceElemClassFromTo('loadWalletDiv',    'visibleB', 'hidden', true);
	common.replaceElemClassFromTo('viewWalletDiv',    'hidden', 'visibleB', true);
	common.replaceElemClassFromTo('xactionDiv',       'visibleB', 'hidden', true);
	makeViewWalletForm();
    },

    setButtonHandlers: function() {
	document.getElementById("viewWalletSelector").addEventListener('change', viewWalletSelectorHandler);
	document.getElementById('viewWalletNameInput').addEventListener('change', savableChangeHandler);
	document.getElementById('viewWalletSaveButton').addEventListener('click', viewWalletSaveHandler);
    },

    ownerLabelInputs: null,
    walletToSave: null,
};


//
// view wallet
//
function makeViewWalletForm() {
    const walletList = smsUtil.getWalletList();
    const viewWalletSelector = document.getElementById("viewWalletSelector");
    common.clearDivChildren(viewWalletSelector);
    for (let i = 0; i < walletList.length; ++i) {
	const option = document.createElement("option");
	const wallet = smsUtil.getWallet(walletList[i]);
	option.text = wallet.name + ': ' + wallet.contractAddr;
	option.value = wallet.contractAddr;
	viewWalletSelector.appendChild(option);
    }
    if (walletList.length > 0) {
	viewWalletView(walletList[0]);
    } else {
	const option = document.createElement("option");
	option.text = 'No wallets in local storage';
	option.value = '';
	viewWalletSelector.appendChild(option);
    }
}


function viewWalletSelectorHandler() {
    console.log('viewWalletSelectorHandler');
    const viewWalletSelector = document.getElementById("viewWalletSelector");
    const contractAddr = viewWalletSelector.value;
    if (!!contractAddr)
	viewWalletView(contractAddr);
}


function viewWalletView(contractAddr) {
    console.log('viewWalletView: contract = ' + contractAddr);
    const wallet = smsUtil.getWallet(contractAddr);
    viewWallet.walletToSave = wallet;
    document.getElementById('viewWalletJson').value = JSON.stringify(wallet);
    //init wallet-bar: name/addr, threshold, balance, nonce
    const viewContractNameAddr = document.getElementById('viewContractNameAddr');
    viewContractNameAddr.value = wallet.name + ': ' + wallet.contractAddr;
    const viewContractThreshold = document.getElementById('viewContractThreshold');
    viewContractThreshold.value = 'Threshold: ' + wallet.thresholdHex.toString(10);
    const viewContractBalance = document.getElementById('viewContractBalance');
    viewContractBalance.value = 'Balance: refreshing...';
    ether.getBalance(wallet.contractAddr, 'ether', function(err, balanceEth) {
        viewContractBalance.value = 'Balance: ' + balanceEth.toString(10);
    });
    const viewContractNonce = document.getElementById('viewContractNonce');
    viewContractNonce.value = 'Nonce: refreshing...';
    smsEther.getNonce(wallet.contractAddr, function(err, nonce) {
        console.log('viewWalletView: err = ' + err + ', nonce = ' + nonce);
        viewContractNonce.value = 'Nonce: ' + common.numberToBN(nonce).toString(10);
    });
    console.log('viewWalletView: name = ' + wallet.name);
    const viewWalletNameInput = document.getElementById('viewWalletNameInput');
    viewWalletNameInput.value = wallet.name;
    const viewWalletAccountsListDiv = document.getElementById('viewWalletAccountsListDiv');
    viewWallet.ownerLabelInputs = smsUtil.listAccounts(viewWalletAccountsListDiv, wallet.ownerAddrs, wallet.ownerLabels, savableChangeHandler);
    viewWalletSaveButton.disabled = true;
}

function savableChangeHandler() {
    console.log('savableChangeHandler');
    viewWallet.walletToSave.name = document.getElementById('viewWalletNameInput').value;
    for (let i = 0; i < viewWallet.walletToSave.ownerAddrs.length; ++i)
	viewWallet.walletToSave.ownerLabels[i] = viewWallet.ownerLabelInputs[i].value;
    document.getElementById('viewWalletJson').value = JSON.stringify(viewWallet.walletToSave);
    document.getElementById('viewWalletSaveButton').disabled = false;
}

function viewWalletSaveHandler() {
    //pick up all fields that might have changed
    console.log('viewWalletSaveHandler');
    smsUtil.saveWallet(viewWallet.walletToSave);
    const viewWalletSaveButton = document.getElementById('viewWalletSaveButton');
    viewWalletSaveButton.disabled = true;
    alert('Modified wallet-name and/or owner-names have been saved');
    //to redisplay with eg. new name
    makeViewWalletForm();
}
