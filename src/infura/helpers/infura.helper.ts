import Web3 from 'web3';
import Decimal from 'decimal.js';

function watchEtherTransfers() {
  // Instantiate web3 with WebSocket provider
  const web3 = new Web3(
    new Web3.providers.WebsocketProvider(process.env.INFURA_WS_URL),
  );

  // Instantiate subscription object
  const subscription = web3.eth.subscribe('pendingTransactions');

  // Subscribe to pending transactions
  subscription
    .subscribe((error, result) => {
      if (error) console.log(error);
    })
    .on('data', async (txHash) => {
      try {
        // Instantiate web3 with HttpProvider
        const web3Http = new Web3(process.env.INFURA_URL);

        // Get transaction details
        const trx = await web3Http.eth.getTransaction(txHash);

        const valid = validateTransaction(trx);
        // If transaction is not valid, simply return
        if (!valid) return;

        console.log(
          'Found incoming Ether transaction from ' +
            process.env.WALLET_FROM +
            ' to ' +
            process.env.WALLET_TO,
        );
        console.log('Transaction value is: ' + process.env.AMOUNT);
        console.log('Transaction hash is: ' + txHash + '\n');

        // Initiate transaction confirmation
        confirmEtherTransaction(txHash);

        // Unsubscribe from pending transactions.
        subscription.unsubscribe();
      } catch (error) {
        console.log(error);
      }
    });
}

function watchTokenTransfers(contractAbi, contractAddress, from, to) {
  // Instantiate web3 with WebSocketProvider
  const web3 = new Web3(
    new Web3.providers.WebsocketProvider(process.env.INFURA_WS_URL),
  );

  // Instantiate token contract object with JSON ABI and address
  const tokenContract = new web3.eth.Contract(contractAbi, contractAddress);

  // Generate filter options
  const options = {
    filter: {
      _from: from,
      _to: to,
    },
    fromBlock: 'latest',
  };

  // Subscribe to Transfer events matching filter criteria
  tokenContract.events.Transfer(options, async (error, event) => {
    if (error) {
      console.log(error);
      return;
    }

    console.log('Found incoming transaction from ' + from + ' to ' + to + '\n');

    // Initiate transaction confirmation
    confirmEtherTransaction(event.transactionHash);

    return;
  });
}
const WEI = 1000000000000000000;

const ethToWei = (amount) => new Decimal(amount).times(WEI);

function validateTransaction(trx) {
  const toValid = trx.to !== null;
  if (!toValid) return false;

  const walletToValid =
    trx.to.toLowerCase() === process.env.WALLET_TO.toLowerCase();
  const walletFromValid =
    trx.from.toLowerCase() === process.env.WALLET_FROM.toLowerCase();
  const amountValid = ethToWei(process.env.AMOUNT).equals(trx.value);

  return toValid && walletToValid && walletFromValid && amountValid;
}

async function getConfirmations(txHash) {
  try {
    // Instantiate web3 with HttpProvider
    const web3 = new Web3(process.env.INFURA_URL);

    // Get transaction details
    const trx = await web3.eth.getTransaction(txHash);

    // Get current block number
    const currentBlock = await web3.eth.getBlockNumber();

    // When transaction is unconfirmed, its block number is null.
    // In this case we return 0 as number of confirmations
    return trx.blockNumber === null ? 0 : currentBlock - trx.blockNumber;
  } catch (error) {
    console.log(error);
  }
}

function confirmEtherTransaction(txHash, confirmations = 10) {
  setTimeout(async () => {
    // Get current number of confirmations and compare it with sought-for value
    const trxConfirmations = await getConfirmations(txHash);
    console.log(
      'Transaction with hash ' +
        txHash +
        ' has ' +
        trxConfirmations +
        ' confirmation(s)',
    );

    if (trxConfirmations >= confirmations) {
      // Handle confirmation event according to your business logic

      console.log(
        'Transaction with hash ' + txHash + ' has been successfully confirmed',
      );

      return;
    }
    // Recursive call
    return confirmEtherTransaction(txHash, confirmations);
  }, 30 * 1000);
}

module.exports = {
  watchEtherTransfers,
  watchTokenTransfers,
};
