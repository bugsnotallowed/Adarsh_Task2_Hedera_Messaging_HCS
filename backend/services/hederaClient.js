require("dotenv").config();
const {
  AccountId,
  PrivateKey,
  Client,
} = require("@hashgraph/sdk"); // v2.64.5


module.exports = function hederaClient() {
  const client = Client.forTestnet();
  client.setOperator(AccountId.fromString(process.env.OPERATOR_ID), PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY));
  return client;
};
