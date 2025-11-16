// src/components/TopicLoader.jsx
import React, { useState } from 'react';
import axios from 'axios';

export default function TopicLoader({ onLoaded }) {
  const [topicInput, setTopicInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState([]);

  const fetchTopic = async () => {
    if (!topicInput.trim()) return alert('Enter topicId (e.g. 0.0.7268401)');
    setLoading(true);
    try {
      const res = await axios.get(`/api/hedera/fetch/${encodeURIComponent(topicInput.trim())}`);
      setFetched(res.data || []);
      onLoaded && onLoaded(topicInput.trim()); // optionally set as active topic
    } catch (err) {
      alert('Failed to fetch from mirror: ' + (err?.response?.data?.error || err.message));
      setFetched([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-2">Load messages by TopicId</h3>

      <div className="flex gap-2">
        <input
          type="text"
          value={topicInput}
          onChange={(e) => setTopicInput(e.target.value)}
          placeholder="Enter topicId (e.g. 0.0.7268401)"
          className="flex-1 p-2 border rounded"
        />
        <button onClick={fetchTopic} disabled={loading} className="px-3 py-1 rounded bg-hederaGreen text-white">
          {loading ? 'Loading…' : 'Fetch'}
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {fetched.length === 0 ? (
          <div className="text-sm text-gray-500">No messages fetched</div>
        ) : (
          fetched.map((m, idx) => (
            <div key={idx} className="p-2 rounded border bg-gray-50">
              <div className="font-mono break-all">{m.decrypted || m.encrypted}</div>
              <div className="text-xs text-gray-500 mt-1">
                {m.senderId} • {new Date(m.timestamp).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
