import React, { useState } from 'react';
import axios from 'axios';

export default function TopicForm({ onTopicCreated, currentTopic }) {
  const [loading, setLoading] = useState(false);

  const createTopic = async () => {
    try {
      setLoading(true);
      const res = await axios.post('/api/hedera/topic');

      if (res.data && res.data.topicId) {
        onTopicCreated(res.data.topicId);
      }
    } catch (err) {
      alert('Failed to create topic: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="font-semibold">Topic</h2>
      <p className="text-sm text-gray-500 mb-2">
        Create a Hedera topic to begin sending messages.
      </p>

      <button
        onClick={createTopic}
        disabled={loading}
        className="px-3 py-1 rounded bg-hederaGreen text-white hover:opacity-90 disabled:opacity-60"
      >
        {loading ? 'Creating...' : 'Create Topic'}
      </button>

      <div className="mt-3 text-sm">
        <span className="text-gray-500 text-xs">Current Topic:</span>
        <div className="mt-1 font-mono break-all">
          {currentTopic || '—'}
        </div>
      </div>
    </div>
  );
}
