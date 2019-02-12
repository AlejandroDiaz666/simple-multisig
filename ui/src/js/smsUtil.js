
//
// high level fcns related to interaction w/ simple-multisig contract
//
const common = require('./common');
const ether = require('./ether');
const smsEther = require('./smsEther');
const BN = require("bn.js");

const smsUtil = module.exports = {


    help:
    '<br/>' +
	'<p>' +
	'<u>What is a MultiSig Wallet?</u><br/>' +
	'A &quot;MultiSig Wallet&quot; is a wallet that requires multiple signatures in order to spend or execute transactions. Standard Ethereum transactions can be thought-of as &quot;single-signature transactions,&quot; because transfers require only one signature -- from the owner of the private key associated with the source Ethereum account. A MultiSig Wallet supports much more complicated transactions that require the signatures of multiple people (&quot;owners&quot;) before funds can be transferred out of the wallet (or before the wallet can perform any other sort of transaction). These are often referred to as M-of-N transactions. When you create a MultiSig Wallet you specify which accounts are the &quot;owners;&quot; that is, which accounts have authority to sign transactions (The number of owner accounts is N). You also specify how many signature are needed in order for a transaction to be executed. This is called the &quot;threshold.&quot; (The Threshold is M)</p>' +
	'<p>Note that anyone can send ETH to a MultiSig Wallet. The wallet can also own ERC20 tokens. However in order to spend the ETH that is within the MultiSig Wallet a special transaction needs to be constructed. That is because the source address is the MultiSig Wallet contract. This front-end can help you construct a transaction to spend the ETH that is within a MultiSig Wallet. The constructed transaction needs to specify a &quot;Nonce,&quot; which is a counter that is maintained within the contract to ensure that transactions cannot be replayed. Also the transaction needs to be signed by at least the number of owners specified by the Threshold. When you create a MultiSig transaction you can also specify an &quot;executor.&quot; The executor address is the only one who can actually execute the transaction. If you specify an executor address of zero, then anyone can execute the transaction. At any rate, whoever executes the MultiSig transaction must supply the number of owner signatures specified by the MultiSig Wallet threshold.</p>' +
	'<p>' +
	'<u>Creating a New MultiSig Wallet</u><br/>' +
	'To create a new MMultiSig Wallet click on the &quot;New Wallet&quot button.<img src="images/new-wallet.png" height="480" width="960"><br/>' +
	'Enter a name for the wallet, and begin adding the Ethereum accounts of the owners. By default the first account is the current MetaMask account, but you can change this. It is recommended that you specify a label for each owner that you add. After you have added all the owners select the Threshold from the dropdown. When you click &quot;Deploy This Wallet,&quot; the contract will be published on the blockchain. After the contract is deployed you can select the wallet to view or to edit by clicking on &quot;View Wallet,&quot; or you can generate a transaction by clicking on the &quot;Transaction&quot; button. Note, once a wallet is published on the blockchain, the only things that you can <i>edit</i> are the name of the wallet and <i>labels</i> assigned to the owners -- you can&apos;t change the actual owner accounts or the threshold.</p>' +
	'<p>' +
	'<u>View/Edit or Share a Wallet</u><br/>' +
	'When you click the &quot;View Wallet&quot; button you can select a saved MultiSig Wallet from the drop-down selector. ' +
	'<img src="images/view-wallet.png" height="480" width="960"><br/>' +
	'When you select a wallet the information bar immediately below the drop-down selector shows the wallet contract&apos;s address on the blockchain, the threshold, the Eth balance in the wallet, and the current nonce (number of completed transactions <i>from</i> the wallet). In the box below the information bar you will see the name of the wallet, and a list of all the owner owner with and the label for each owner account. If you like, you can edit the wallet name and the labels of the owner accounts, and then re-save the wallet. You cannot edit the account addresses or the threshold, since that information in un-changable in the wallet contract. In the image above I&apos;ve changed the <i>label</i> on my account from &quot;My Account&quot; to &quot;Alejandro.&quot</p>' +
	'<p>Tip: To share the wallet information with other owners, copy the text that appears in the JSON box below the owner list, and email that to the other owners.</p>' +
	'<p>' +
	'<u>Importing an Already-Deployed MultiSig Wallet</u><br/>' +
	'In most use-cases for MultiSig Wallets the owner accounts belong to different people. Typically in such a case one person will collect the personal account addresses from all the other owners (for example via email exchanges), and will create and deploy the wallet. Once the wallet has been deployed the person that created the wallet can send the address of the wallet to all the other owners (again, using email, for example). Alternately, and more conveniently, the person that created the wallet can copy the JSON that represents the wallet from the view screen, and send that the the other owners. In order to use the wallet each owner unlocks their Ethereum account in MetaMask and then clicks the &quot;Import Wallet&quot; button. If the other owners load the wallet information from the JSON string, then they will get all the wallet information, including the name of the wallet and the labels assigned to the owner accounts. If the other owners load the wallet from the blockchain (just using the address of the wallet), then they will need to re-enter the wallet name and the labels for the owner accounts, since that information is not saved on the blockchain.<br/>' +
	'After importing a wallet, you can optionally modify the wallet name and the labels for the owner accounts, then you should click the button that says &quot;Save this wallet locally&quot<br/>' +
	'<img src="images/import-wallet.png" height="480" width="960"></p>' +
	'<p>' +
	'<u>Creating a Transaction</u><br/>' +
	'Anyone can send ETH to a MultiSig Wallet by using the wallet&apos; contract address as the destination address. However sending ETH <i>out</i> of a multisig wallet requires that you first construct the transaction; then get the requisite number of owners to &quot;sign&quot; the transaction (the number of required owner signatures is specified by the Threshold); and finally the &quot;executor&quot; submits the tranaction, together with the collected signatures. Don&apos;t forget to fund the wallet by sending it whatever Ether you plan to spend, then to start creating the MultiSIg transaction click on the &quot;Transaction&quot; button and select the wallet from which you want to send a transaction. In the image below notice that wallet has already been funded with 2 Finneys.</p>' +
	'<img src="images/transaction.png" height="480" width="960"><br/>' +
	'<p>' +
	'The screenshot above shows a transaction which will send 1 Finney (0.001 Eth) to the Ethereum address 0x3e6cd76CeA9c322Efb93735B858Ce4d335B91e1D, which is in this case the address of one of the owners, &quot;Rasputen.&quot; By default the nonce is set to the current nonce in the wallet. While it is possible to set the nonce to some other value, such a transaction could not be executed until after all previous transactions; that is, transactions will only be processed in order, without any skips. The image also shows that teh executor is set to 0x0, meaning that anyone can execute the transaction (after all the owner signatures have been collected). It&apos; also possible to set the executor to an address that is not an owner.<br/>' +
	'By default the transaction gas is set to 21,000. Note that this is the gas limit for the transaction that will be executed by the contract, and the default amount is sufficient for a simple transfer of Eth. Additional gas will be expended by the contract verifying signatures etc. So when you (or the executor) confirm this transaction, you&apos;ll see may expend more than this amount of gas.</p>' +
	'<p>' +
	'In the image below, after filling in all the transaction parameters I signed the transaction by clicking on the &quot;Sign this transaction&quot; button. Notice that the MetaMask dialog for signing the transaction provides some information about what is being signed. This is because the MutiSIg contract conforms to EIP-712 (Thank you Christian Lundkvist!).' +
	'<img src="images/sign.png" height="480" width="960"></p>' +
	'<p>' +
	'Since the threshold for this wallet is set to one, I have the ability to execute the transaction immediately after signing it. If I had needed to collect more signatures I would have copied the JSON text, which includes my signature and I sent it to Rasputen; Rasputen would have loaded the transaction from the JSON text, signed it, and he would have sent the new JSON text back to me. Click the button that say &quot;Execute this transaction&quot; to send the transaction to the contract for execution.<br/>' +
	'<img src="images/execute.png" height="480" width="960"></p>' +
    '<br/>',


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
