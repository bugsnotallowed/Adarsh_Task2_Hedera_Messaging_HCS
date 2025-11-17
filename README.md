📡 Hedera Hashgraph Messaging Service (HCS)
Real-Time Encrypted Messaging using Hedera Consensus Service + MERN Stack

A full-stack decentralized messaging application built using:

Hedera Consensus Service (HCS)

Node.js + Express

React + Vite + Tailwind

MongoDB (persistent storage)

AES-256 Encryption

Mirror Node message retrieval

Topic subscription + background message streaming

This project demonstrates how to build a real, production-grade decentralized messaging system using Hedera's public consensus layer (HCS) with a modern MERN architecture.

🚀 Features
✅ Create a Hedera Topic

Backend signs a TopicCreateTransaction → Mirror Node indexes it → subscriber auto-starts.

✅ Send Encrypted Messages

Messages are encrypted using AES-256 before submission to HCS.

✅ Real-Time Message Receipt (Background Subscriber)

A running server process subscribes to the topic and stores all messages in MongoDB.

✅ Multi-User / Multi-Account Support

Any Hedera account can publish to the same topic.
Subscriber receives all messages immutably.

✅ Persistent History (MongoDB)

Mongo stores:

topic metadata

all messages (encrypted + decrypted)

sender account ID

sequence number

HCS consensus timestamp

subscribers list

✅ Fetch Topic Messages from Mirror Node

Frontend can fetch any topicId’s messages directly using /fetch/:topicId.

✅ Decrypt Mirror Node Messages

Base64 HCS messages → decoded → decrypted if AES key matches.

✅ Frontend to Input TopicId

User can load messages of ANY existing topic on Testnet.

🧠 System Architecture
                ┌────────────────────────────┐
                │        React Frontend       │
                │  - Create Topic             │
                │  - Send Message             │
                │  - Load Topic from Mirror   │
                │  - Filter / Search          │
                └──────────────┬─────────────┘
                               │ REST API
                               ▼
                ┌────────────────────────────┐
                │       Node.js Backend       │
                │  /topic → create Hedera topic
                │  /message → submit encrypted msg
                │  /messages/:id → Mongo history
                │  /fetch/:id → Mirror fetch API
                │  /subscribe → register + stream
                └──────────────┬─────────────┘
                               │
                               ▼
                ┌────────────────────────────┐
                │ Hedera Consensus Service   │
                │  - immutable ordering      │
                │  - consensus timestamps    │
                └──────────────┬─────────────┘
                               │
                               ▼
                ┌────────────────────────────┐
                │    Hedera Mirror Node      │
                │  topic messages in base64  │
                └──────────────┬─────────────┘
                               │
                               ▼
                ┌────────────────────────────┐
                │  MongoDB Persistent Store  │
                │  - topics                  │
                │  - messages                │
                │  - subscribers             │
                └────────────────────────────┘

🧩 Project Flow
1. Create Topic

User clicks “Create Topic”, backend runs:

TopicCreateTransaction().execute()

Retrieves new topicId

Saves topic in MongoDB

Starts a background subscriber for the topic

Subscriber waits for mirror node indexing (polls /topics/:id)

Once ready → connects to HCS and streams messages

2. Send Message

User types a message

Message encrypted with AES-256

Backend submits encrypted payload using TopicMessageSubmitTransaction

Mirror node publishes it

Backend subscriber receives it

Subscriber:

decodes base64

decrypts

stores raw/encrypted/decrypted message in DB

updates subscribers list

3. Retrieve Messages

Users can retrieve:

Local persisted history (MongoDB) → /messages/:topicId

Mirror node public history → /fetch/:topicId

decodes base64

attempts decryption

4. Real-Time Behavior

The subscriber runs even when no user is connected.

When frontend connects later → all history is available.

⚠️ Key Challenges & How We Solved Them
🔥 1. Mirror Node Delay: Topic not Indexed Error

When a topic is created, mirror node needs 300ms–6s to index it.

Issue

Subscriber started too early →

NOT_FOUND: topic does not exist

Solution

We built waitForTopicInMirror() that:

polls mirror node /topics/:id

only subscribes after mirror node confirms existence

This eliminated subscription failures entirely.

🔥 2. HCS Message Base64 Decoding

Mirror node returns messages like:

message: "NDg2NGQ3OWE3OTFjYjEwZDU3... (base64)"


We originally decrypted wrong, because we treated SDK bytes as utf8 incorrectly.

Solution

Correct 3-stage decode:

const encryptedBase64 = Buffer.from(msg.contents).toString('base64');
const encryptedOriginal = Buffer.from(encryptedBase64, 'base64').toString('utf8');
const decrypted = encryptService.decrypt(encryptedOriginal);


Exactly matches what mirror node stores.

🔥 3. Hedera SDK Bug — TopicMessage in Error Callback

Some HCS messages appear in onError() instead of onMessage().

Solution

We detect and ignore:

if (err.consensusTimestamp) {
   console.log("SDK quirk: TopicMessage in error callback, ignoring.");
   return;
}

🔥 4. Ensuring Multi-User Support

Messages from any Hedera account needed to show sender identity.

Solution

Extract sender:

const senderAccount = msg.initialTransactionId.accountId.toString();


Stored in MongoDB under:

senderId

🔥 5. Persistent Storage

Needed reliable history and subscriber tracking.

Solution

MongoDB models:

Topic – owner, subscribers

Message – encrypted, decrypted, senderId, timestamp, sequenceNumber

📦 Folder Structure
backend/
 ├── controllers/
 ├── models/
 ├── routes/
 ├── services/
 ├── server.js

frontend/
 ├── src/
 │   ├── components/
 │   ├── App.jsx
 │   ├── main.jsx
 ├── vite.config.mjs
 ├── index.html

🛠️ Installation & Setup
1. Clone Repo
git clone https://github.com/<your-username>/hedera-hcs-messaging.git
cd hedera-hcs-messaging

2. Backend Setup
cd backend
npm install


Create .env:

OPERATOR_ID=0.0.xxxxx
OPERATOR_KEY=302e...
AES_SECRET_KEY=32_char_secret_key
MONGODB_URI=mongodb://localhost:27017/hedera_hcs


Start server:

npm run dev

3. Frontend Setup
cd frontend
npm install
npm run dev


Runs on:

http://localhost:5173

🧪 API Endpoints
POST /api/hedera/topic

Create a new topic

POST /api/hedera/message

Send encrypted message

GET /api/hedera/messages/:topicId

Get messages from MongoDB

GET /api/hedera/fetch/:topicId

Fetch & decode messages from mirror node

POST /api/hedera/subscribe

Register subscriber to topic

🎨 Frontend Capabilities

✔ Create topic
✔ Enter any topicId manually
✔ Fetch from Mirror Node
✔ Send encrypted messages
✔ Filter messages
✔ Display sent + received
✔ Decrypt if possible

🔮 Future Enhancements (if you want next)

🔐 Client-side end-to-end encryption

⚡ WebSocket live streaming (no polling)

🕵️ Topic permissions & private channels

🔥 Multi-room chat (each topic = chat room)

📱 React Native mobile app

🧩 Combine HCS with Smart Contracts

🏆 Conclusion

This project demonstrates a real, production-ready Hedera HCS messaging pipeline:

decentralized ordering

immutable audit logs

encryption

multi-user real-time updates

mirror-node sync

persistent database

You now have a full-stack Hedera-based messaging framework that can be extended into
chat apps, audit trails, supply chain logs, DAO voting, timestamping services, and much more.
