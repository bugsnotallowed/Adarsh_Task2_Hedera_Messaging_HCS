import React, { useState, useEffect } from 'react';
import TopicForm from './components/TopicForm';
import MessageSender from './components/MessageSender';
import MessageList from './components/MessageList';
import FilterBar from './components/FilterBar';
import axios from 'axios';

export default function App() {
  const [topicId, setTopicId] = useState('');
  const [messagesReceived, setMessagesReceived] = useState([]);
  const [messagesSent, setMessagesSent] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    let interval;

    if (topicId) {
      const fetchMessages = async () => {
        try {
          const res = await axios.get(`/api/hedera/messages/${topicId}`);

          if (res.data && Array.isArray(res.data)) {
            const sorted = res.data
              .slice()
              .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            setMessagesReceived(sorted);
          }
        } catch (err) {
          console.warn('Message fetch error:', err.message);
        }
      };

      fetchMessages();
      interval = setInterval(fetchMessages, 3000);
    }

    return () => clearInterval(interval);
  }, [topicId]);

  const handleTopicCreated = (id) => {
    setTopicId(id);
    setMessagesReceived([]);
    setMessagesSent([]);
  };

  const handleMessageSent = (msgObj) => {
    setMessagesSent((prev) => [...prev, msgObj]);
  };

  const filteredReceived = messagesReceived.filter((m) =>
    m.message.toLowerCase().includes(filter.toLowerCase())
  );

  const filteredSent = messagesSent.filter((m) =>
    m.message.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="min-h-screen flex items-start justify-center p-6">
      <div className="container bg-white rounded-2xl shadow-md p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-hederaGreen mb-1">
            Hedera Messaging Service(HCS)
          </h1>
          <p className="text-sm text-gray-600">
            Create a topic, send encrypted messages, and view them in real time.
          </p>
        </header>

        <section className="mb-4">
          <TopicForm
            onTopicCreated={handleTopicCreated}
            currentTopic={topicId}
          />
        </section>

        <section className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <MessageSender topicId={topicId} onMessageSent={handleMessageSent} />
          <FilterBar filter={filter} setFilter={setFilter} />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MessageList
            title={`Messages Sent${topicId ? '' : ' (create topic first)'}`}
            messages={filteredSent}
          />
          <MessageList
            title={`Messages Received${topicId ? '' : ' (create topic first)'}`}
            messages={filteredReceived}
          />
        </section>

        <footer className="mt-6 text-xs text-gray-500">
          Backend at <strong>http://localhost:5000</strong>, proxied via
          <code> /api/hedera</code>.
        </footer>
      </div>
    </div>
  );
}
