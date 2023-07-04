const express = require('express');
const bodyParser = require('body-parser');
const expressip = require('express-ip');
const mongoose = require('./services/mongoose');
const Web3 = require('web3');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressip().getIpInfoMiddleware);
app.use(require('./utils/error'));

app.use((req, res, next) => {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  );

  // Request headers you wish to allow
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With,content-type'
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});


// require('./routes')(app);

// New part start
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define a schema for the request object
const requestSchema = new mongoose.Schema({
  transaction: String,
  walletAddress: String,
  text: String,
});
const Request = mongoose.model('Request', requestSchema);

// Connect to the Ethereum network using a local provider (assumes Metamask is running)
// const HttpProvider = "https://eth-mainnet.g.alchemy.com/v2/YOUR_API";
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

// Create a POST endpoint for the signing process
app.post('/sign', async (req, res) => {
  const { transaction, walletAddress, text } = req.body;

  try {
    // Verify the transaction and wallet address using web3.js
    const receipt = await web3.eth.getTransactionReceipt(transaction);
    if (!receipt || receipt.from.toLowerCase() !== walletAddress.toLowerCase()) {
      res.status(400).send('Invalid transaction or wallet address');
      return;
    }

    // Save the request to the database
    const newRequest = new Request({
      transaction,
      walletAddress,
      text,
    });
    newRequest.save((err) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error saving request');
      } else {
        res.status(200).send('Request saved successfully');
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error verifying transaction');
  }
});
// New part end


module.exports = app;
