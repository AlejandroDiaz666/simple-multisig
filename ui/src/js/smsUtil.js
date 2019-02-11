
//
// high level fcns related to interaction w/ simple-multisig contract
//
const common = require('./common');
const ether = require('./ether');
const smsEther = require('./smsEther');
const BN = require("bn.js");

const smsUtil = module.exports = {


    Wallet: function(name, contractAddr, ownerLabels, ownerAddrs, thresholdHex, chainId) {
	console.log('Wallet');
	this.contractAddr = contractAddr;
	this.thresholdHex = thresholdHex;
	this.ownerAddrs = (!!ownerAddrs) ? ownerAddrs : [];
	this.chainId = chainId;
	this.name = (!!name) ? name : 'unnamed';
	if (!!ownerLabels) {
	    this.ownerLabels = ownerLabels;
	} else {
	    this.ownerLabels = [];
	    for (var i = 0; i < ownerAddrs.length; ++i)
		this.ownerLabels.push('no label');
	}
    },

    getWalletList: function() {
	var savedWallets = {};
	var savedWalletsJSON = localStorage[common.localStoragePrefix + '-SavedWallets'];
	console.log('getWalletList: savedWalletsJSON = ' + savedWalletsJSON);
	if (!!savedWalletsJSON)
	    savedWallets = JSON.parse(savedWalletsJSON);
	return(Object.keys(savedWallets));
    },

    getWallet: function(contractAddr) {
	var wallet = null;
	var walletJSON = localStorage[common.localStoragePrefix + '-' + contractAddr];
	if (!!walletJSON)
	    wallet = JSON.parse(walletJSON);
	return(wallet);
    },

    saveWallet: function(wallet) {
	console.log('saveWallet');
	var walletJSON = JSON.stringify(wallet);
	localStorage[common.localStoragePrefix + '-' + wallet.contractAddr] = walletJSON;
	var savedWallets = {};
	var savedWalletsJSON = localStorage[common.localStoragePrefix + '-SavedWallets'];
	if (!!savedWalletsJSON)
	    savedWallets = JSON.parse(savedWalletsJSON);
	savedWallets[wallet.contractAddr] = wallet.name;
	savedWalletsJSON = JSON.stringify(savedWallets);
	console.log('saveWallet: savedWalletsJSON = ' + savedWalletsJSON);
	localStorage[common.localStoragePrefix + '-SavedWallets'] = savedWalletsJSON;
    },


    //
    // display owner accounts in passed div
    // class "accountListFormTable" must exist
    // optional: onLabelChange, ownerSigs, onSigChange
    //
    listAccounts: function(div, ownerAddrs, ownerLabels, onLabelChange, ownerSigs, onSigChange) {
	console.log('listAccounts');
	//console.log(' onLabelChange = ' + onLabelChange);
	common.clearDivChildren(div);
	if (div.className.indexOf('accountListFormTable') < 0)
	    div.className += ' accountListFormTable';
	const changableInputs = [];
	const form = document.createElement('form');
	form.action = 'javascript:;';
	for (let i = 0; i < ownerAddrs.length; ++i) {
	    const inputs = [];
	    const classes = [];
	    const label = document.createElement('input');
	    label.placeholder = 'Owner label';
	    label.value = ownerLabels[i];
	    label.disabled = (!!onLabelChange) ? false : true;
	    label.size = 20;
	    if (!!onLabelChange) {
		label.addEventListener('change', onLabelChange);
		changableInputs.push(label);
	    }
	    inputs.push(label);
	    classes.push('accountListTD');
	    const acct = document.createElement('input');
	    acct.value = ownerAddrs[i];
	    acct.disabled = true;
	    acct.size = 60;
	    inputs.push(acct);
	    classes.push('accountListTD');
	    if (!!ownerSigs) {
		const sig = document.createElement('textarea');
		sig.placeholder = 'Owner signature';
		sig.value = (ownerSigs.length > i) ? ownerSigs[i] : '';
		sig.disabled = (!!onSigChange) ? false : true;
		sig.rows = 2;
		sig.cols = 65;
		sig.style['resize'] = 'none';
		sig.style['text-overflow'] = 'ellipsis';
		if (!!onSigChange) {
		    sig.addEventListener('change', onSigChange);
		    changableInputs.push(sig);
		}
		inputs.push(sig);
		classes.push('accountListTD');
	    }
	    console.log('XXX');
	    addInputToFormTable(inputs, classes, form);
	}
	    console.log('listAccounts: 9');
	if (ownerAddrs.length == 0) {
	    const msg = document.createElement('input');
	    msg.value = 'no owners defined';
	    msg.disabled = true;
	    msg.size = 60;
	    addInputToFormTable([ msg ], [ 'accountListTD' ], form);
	}
	div.appendChild(form);
	return(changableInputs);
    },

}


function addInputToFormTable(inputs, classes, f) {
    console.log('addInputToFormTable: inputs.length = ' + inputs.length);
    console.log('addInputToFormTable: inputs = ' + inputs.toString() + ', classes = ' + classes.toString());
    let s;
    const d = document.createElement("div");
    d.className = 'tr';
    for (let i = 0; i < inputs.length; ++i) {
        if (!!inputs[i]) {
            (s = document.createElement("span")).className = classes[i];
            s.appendChild(inputs[i]);
            d.appendChild(s);
        }
    }
    f.appendChild(d);
}


/*
function addInputToFormTable(label, labelClass, address, addressClass, sig, sigClass, f) {
    console.log('addInputToFormTable');
    let d, s;
    (d = document.createElement("div")).className = 'tr';
    if (!!label) {
	(s = document.createElement("span")).className = labelClass;
	s.appendChild(label);
	d.appendChild(s);
    }
    if (!!address) {
	(s = document.createElement("span")).className = addressClass;
	s.appendChild(address);
	d.appendChild(s);
    }
    if (!!sig) {
	(s = document.createElement("span")).className = sigClass;
	s.appendChild(sig);
	d.appendChild(s);
    }
    f.appendChild(d);
}
*/
