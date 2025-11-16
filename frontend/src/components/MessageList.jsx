import React from 'react';

export default function MessageList({ title, messages }) {
  return (
    <div className="p-4 border rounded-lg h-72 overflow-auto">
      <h3 className="font-semibold mb-2">{title}</h3>

      {messages.length === 0 ? (
        <div className="text-sm text-gray-500">No messages</div>
      ) : (
        <ul className="space-y-2">
          {messages.map((m, index) => (
            <li key={index} className="p-2 rounded border bg-gray-50">
              <div className="text-sm font-mono break-all">&quot;{m.message}&quot;</div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(m.timestamp).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
