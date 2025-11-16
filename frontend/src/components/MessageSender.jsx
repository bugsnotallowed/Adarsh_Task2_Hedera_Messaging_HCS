import React, { useState } from 'react';
import axios from 'axios';

export default function MessageSender({ topicId, onMessageSent }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!topicId) {
      alert('Create a topic first.');
      return;
    }

    if (!message.trim()) {
      alert('Message cannot be empty.');
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post('/api/hedera/message', {
        topicId,
        message
      });

      onMessageSent({
        message,
        timestamp: res.data.timestamp || new Date().toISOString()
      });

      setMessage('');
    } catch (err) {
      alert('Failed to send message: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-2">Send Message</h3>

      <textarea
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full p-2 border rounded mb-2 focus:ring-2 focus:ring-hederaGreen"
        placeholder={topicId ? 'Type your message...' : 'Create a topic first'}
      />

      <button
        onClick={sendMessage}
        disabled={!topicId || loading}
        className="px-4 py-1 rounded bg-blue-600 text-white disabled:opacity-60"
      >
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
}
