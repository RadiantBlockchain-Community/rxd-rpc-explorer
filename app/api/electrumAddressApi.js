var debug = require("debug");
var debugLog = debug("bchexp:electrumx");

var config = require("./../config.js");
var coins = require("../coins.js");
var utils = require("../utils.js");
var sha256 = require("crypto-js/sha256");
var hexEnc = require("crypto-js/enc-hex");

var coinConfig = coins[config.coin];

global.net = require('net');
global.tls = require('tls');

const ElectrumClient = require('electrum-client');

var electrumClients = [];

var noConnectionsErrorText = "No ElectrumX connection available. This could mean that the connection was lost or that ElectrumX is processing transactions and therefore not accepting requests. This tool will try to reconnect. If you manage your own ElectrumX server you may want to check your ElectrumX logs.";


function connectToServers() {
	return new Promise(function(resolve, reject) {
		var promises = [];

		for (var i = 0; i < config.electrumXServers.length; i++) {
			var { host, port, protocol } = config.electrumXServers[i];
			promises.push(connectToServer(host, port, protocol));
		}

		Promise.all(promises).then(function() {
			resolve();

		}).catch(function(err) {
			utils.logError("120387rygxx231gwe40", err);

			reject(err);
		});
	});
}

function connectToServer(host, port, protocol) {
	return new Promise(function(resolve, reject) {
		debugLog("Connecting to ElectrumX Server: " + host + ":" + port);

		// default protocol is 'tcp' if port is 50001, which is the default unencrypted port for electrumx
		var defaultProtocol = port === 50001 ? 'tcp' : 'tls';

		var electrumConfig = { client:"bch-rpc-explorer", version:["1.4", "1.5"] };
		var electrumPersistencePolicy = { retryPeriod: 10000, maxRetry: 1000, callback: null };

		var onConnect = function(client, versionInfo) {
			debugLog(`Connected to ElectrumX @ ${host}:${port} (${JSON.stringify(versionInfo)})`);

			electrumClients.push(client);

			resolve();
		};

		var onClose = function(client) {
			debugLog(`Disconnected from ElectrumX @ ${host}:${port}`);

			var index = electrumClients.indexOf(client);

			if (index > -1) {
				electrumClients.splice(index, 1);
			}
		};

		var onError = function(err) {
			debugLog(`Electrum error: ${JSON.stringify(err)}`);

			utils.logError("937gf47dsyde", err, {host:host, port:port, protocol:protocol});
		};

		var onLog = function(str) {
			debugLog(str);
		};

		var electrumCallbacks = {
			onConnect: onConnect,
			onClose: onClose,
			onError: onError,
			onLog: onLog
		};

		var electrumClient = new ElectrumClient(port, host, protocol || defaultProtocol, null, electrumCallbacks);
		electrumClient.initElectrum(electrumConfig, electrumPersistencePolicy).then(function() {
			// success
		}).catch(function(err) {
			debugLog(`Error connecting to ElectrumX @ ${host}:${port}`);

			utils.logError("137rg023xx7gerfwdd", err, {host:host, port:port, protocol:protocol});

			reject(err);
		});
	});

}

function runOnServer(electrumClient, f) {
	return new Promise(function(resolve, reject) {
		f(electrumClient).then(function(result) {
			resolve({result:result, server:electrumClient.host});

		}).catch(function(err) {
			utils.logError("dif0e21qdh", err, {host:electrumClient.host, port:electrumClient.port});

			reject(err);
		});
	});
}

function runOnAllServers(f) {
	return new Promise(function(resolve, reject) {
		var promises = [];

		for (var i = 0; i < electrumClients.length; i++) {
			promises.push(runOnServer(electrumClients[i], f));
		}

		Promise.all(promises).then(function(results) {
			resolve(results);

		}).catch(function(err) {
			reject(err);
		});
	});
}

function getAddressDetails(address, scriptPubkey, sort, limit, offset) {
	return new Promise(function(resolve, reject) {
		if (electrumClients.length == 0) {
			reject({error: "No ElectrumX Connection", userText: noConnectionsErrorText});

			return;
		}

		var addrScripthash = hexEnc.stringify(sha256(hexEnc.parse(scriptPubkey)));
		addrScripthash = addrScripthash.match(/.{2}/g).reverse().join("");

		var promises = [];

		var txidData = null;
		var balanceData = null;
		// TODO exit early in case getAddressTxids or getAddressBalance fails
		promises.push(new Promise(function(resolve2, reject2) {
			getAddressTxids(addrScripthash).then(function(result) {
				txidData = result.result;

				resolve2();

			}).catch(function(err) {
				err.userData = {address:address, sort:sort, limit:limit, offset:offset};

				utils.logError("2397wgs0sgse", err);

				reject2(err);
			});
		}));

		promises.push(new Promise(function(resolve2, reject2) {
			getAddressBalance(addrScripthash).then(function(result) {
				balanceData = result.result;

				resolve2();
				
			}).catch(function(err) {
				err.userData = {address:address, sort:sort, limit:limit, offset:offset};

				utils.logError("21307ws70sg", err);

				reject2(err);
			});
		}));

		Promise.all(promises.map(utils.reflectPromise)).then(function(results) {
			var addressDetails = {};

			if (txidData) {
				addressDetails.txCount = txidData.length;

				addressDetails.txids = [];
				addressDetails.blockHeightsByTxid = {};

				if (sort == "desc") {
					txidData.reverse();
				}

				for (var i = offset; i < Math.min(txidData.length, limit + offset); i++) {
					addressDetails.txids.push(txidData[i].tx_hash);
					addressDetails.blockHeightsByTxid[txidData[i].tx_hash] = txidData[i].height;
				}
			}

			if (balanceData) {
				addressDetails.balanceSat = balanceData.confirmed;
			}

			var errors = [];
			results.forEach(function(x) {
				if (x.status == "rejected") {
					errors.push(x);
				}
			});

			resolve({addressDetails:addressDetails, errors:errors});
		});
	});
}

function getAddressTxids(addrScripthash) {
	return new Promise(function(resolve, reject) {
		runOnAllServers(function(electrumClient) {
			return electrumClient.blockchainScripthash_getHistory(addrScripthash);

		}).then(function(results) {
			debugLog(`getAddressTxids=${utils.ellipsize(JSON.stringify(results), 200)}`);

			if (addrScripthash == coinConfig.genesisCoinbaseOutputAddressScripthash) {
				for (var i = 0; i < results.length; i++) {
					results[i].result.unshift({tx_hash:coinConfig.genesisCoinbaseTransactionIdsByNetwork[global.activeBlockchain], height:0});
				}
			}

			var first = results[0];
			var done = false;

			for (var i = 1; i < results.length; i++) {
				if (results[i].length != first.length) {
					resolve({conflictedResults:results});

					done = true;
				}
			}

			if (!done) {
				resolve(results[0]);
			}
		}).catch(function(err) {
			reject(err);
		});
	});
}

function getAddressBalance(addrScripthash) {
	return new Promise(function(resolve, reject) {
		runOnAllServers(function(electrumClient) {
			return electrumClient.blockchainScripthash_getBalance(addrScripthash);

		}).then(function(results) {
			debugLog(`getAddressBalance=${JSON.stringify(results)}`);

			if (addrScripthash == coinConfig.genesisCoinbaseOutputAddressScripthash) {
				for (var i = 0; i < results.length; i++) {
					var coinbaseBlockReward = coinConfig.blockRewardFunction(0, global.activeBlockchain);

					results[i].result.confirmed += (coinbaseBlockReward * coinConfig.baseCurrencyUnit.multiplier);
				}
			}

			var first = results[0];
			var done = false;

			for (var i = 1; i < results.length; i++) {
				if (results[i].confirmed != first.confirmed) {
					resolve({conflictedResults:results});

					done = true;
				}
			}

			if (!done) {
				resolve(results[0]);
			}
		}).catch(function(err) {
			reject(err);
		});
	});
}

module.exports = {
	connectToServers: connectToServers,
	getAddressDetails: getAddressDetails
};
