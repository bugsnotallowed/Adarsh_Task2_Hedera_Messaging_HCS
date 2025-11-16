import React from 'react';

export default function FilterBar({ filter, setFilter }) {
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-2">Filter Messages</h3>

      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by keyword (e.g., Hedera)"
        className="w-full p-2 border rounded focus:ring-2 focus:ring-hederaGreen"
      />
    </div>
  );
}
