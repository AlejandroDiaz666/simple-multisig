
const common = require('./common');
const ether = require('./ether');
const newWallet = require('./newWallet');
const viewWallet = require('./viewWallet');
const loadWallet = require('./loadWallet');
const xaction = require('./xaction');
const autoVersion = require('./autoVersion');
const Buffer = require('buffer/').Buffer;
const BN = require("bn.js");

document.addEventListener('DOMContentLoaded', function() {
    index.main();
});


const index = module.exports = {
    openDurationTimers: [],
    closedDurationTimers: [],
    waitingForTxid: false,
    main: function() {
	console.log('index.main');
	setCommonButtonHandlers();
	newWallet.setButtonHandlers();
	loadWallet.setButtonHandlers();
	viewWallet.setButtonHandlers();
	xaction.setButtonHandlers();
	beginTheBeguine();
    },

};


function setCommonButtonHandlers() {
    const newButton = document.getElementById('newButton');
    newButton.addEventListener('click', newWallet.doNewWallet);
    const loadButton = document.getElementById('loadButton');
    loadButton.addEventListener('click', loadWallet.doLoadWallet);
    const viewButton = document.getElementById('viewButton');
    viewButton.addEventListener('click', viewWallet.doViewWallet);
    const xactButton = document.getElementById('xactButton');
    xactButton.addEventListener('click', xaction.doXaction);
}


//
//
async function beginTheBeguine() {
    console.log('beginTheBeguine');
    //await doFirstIntro(false);
    common.checkForMetaMask(true, function(err, w3) {
	const acct = (!err && !!w3) ? w3.eth.accounts[0] : null;
	console.log('beginTheBeguine: checkForMetaMask acct = ' + acct);
	if (!!err) {
	    console.log('beginTheBeguine: checkForMetaMask err = ' + err);
	    handleLockedMetaMask(err);
	} else {
	    handleUnlockedMetaMask();
	}
    });
}


//
// handle locked metamask
//
function handleLockedMetaMask(err) {
    console.log('handleLockedMetaMask');
    const networkArea = document.getElementById('networkArea');
    networkArea.value = '';
    const accountArea = document.getElementById('accountArea');
    accountArea.value = '';
    const balanceArea = document.getElementById('balanceArea');
    balanceArea.value = '';
    common.setMenuButtonState('newButton',  'Disabled');
    common.setMenuButtonState('loadButton', 'Disabled');
    common.setMenuButtonState('viewButton', 'Disabled');
    common.setMenuButtonState('xactButton', 'Disabled');
    common.replaceElemClassFromTo('newWalletDiv',     'visibleB', 'hidden', true);
    common.replaceElemClassFromTo('loadWalletDiv',    'visibleB', 'hidden', true);
    common.replaceElemClassFromTo('viewWalletDiv',    'visibleB', 'hidden', true);
    common.replaceElemClassFromTo('xactionDiv',       'visibleB', 'hidden', true);
    common.clearStatusDiv();
    alert(err);
}


//
// handle unlocked metamask
// displays the users's eth account info; then continues on according to the passed mode
// note: after a transaction is completed we come back to this fcn
//
function handleUnlockedMetaMask(mode) {
    console.log('handleUnlockedMetaMask: mode = ' + mode);
    const accountArea = document.getElementById('accountArea');
    accountArea.value = 'Your account: ' + common.web3.eth.accounts[0];
    ether.getBalance(common.web3.eth.accounts[0], 'ether', function(err, balance) {
	const balanceArea = document.getElementById('balanceArea');
	console.log('balance (eth) = ' + balance);
	const balanceETH = parseFloat(balance).toFixed(6);
	balanceArea.value = 'Balance: ' + balanceETH.toString(10) + ' Eth';
    });
    ether.getNetwork(function(err, network) {
	const networkArea = document.getElementById('networkArea');
	if (!!err) {
	    networkArea.value = 'Error: ' + err;
	} else {
	    common.localStoragePrefix = ether.chainId + '-' + (common.web3.eth.accounts[0]).substring(2, 10) + '-';
	    networkArea.value = 'Network: ' + network;
	    smsEther.setNetwork(network);
	    if (network.startsWith('Mainnet'))
		networkArea.className = (networkArea.className).replace('attention', '');
	    else if (networkArea.className.indexOf(' attention' < 0))
		networkArea.className += ' attention';
	}
    });
    common.setMenuButtonState('newButton',  'Enabled');
    common.setMenuButtonState('loadButton', 'Enabled');
    common.setMenuButtonState('viewButton', 'Enabled');
    common.setMenuButtonState('xactButton', 'Enabled');
    common.replaceElemClassFromTo('newWalletDiv',     'visibleB', 'hidden', true);
    common.replaceElemClassFromTo('loadWalletDiv',    'visibleB', 'hidden', true);
    common.replaceElemClassFromTo('viewWalletDiv',    'visibleB', 'hidden', true);
    common.replaceElemClassFromTo('xactionDiv',       'visibleB', 'hidden', true);
    common.clearStatusDiv();
}


function disableAllButtons() {
    common.setMenuButtonState('newButton',  'Disabled');
    common.setMenuButtonState('loadButton', 'Disabled');
    common.setMenuButtonState('viewButton', 'Disabled');
    common.setMenuButtonState('xactButton', 'Disabled');

    document.getElementById('AopnCurPurchaseButton').disabled = true;
    document.getElementById('BopnCurPurchaseButton').disabled = true;
    document.getElementById('withdrawAButton').disabled = true;
    document.getElementById('withdrawBButton').disabled = true;
    document.getElementById('AclsPrvClaimWinButton').disabled = true;
    document.getElementById('BclsPrvClaimWinButton').disabled = true;
    document.getElementById('AplpRedeemButton').disabled = true;
    document.getElementById('BplpRedeemButton').disabled = true;
    document.getElementById('withdrawDividendsButton').disabled = true;
}
