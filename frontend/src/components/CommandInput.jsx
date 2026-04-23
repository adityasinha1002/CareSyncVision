import React, { useState } from 'react';
import { Send } from 'lucide-react';

export default function CommandInput({ onSubmit }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input);
      setInput('');
    }
  };

    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-4">
        <input
          type="text"
          className="flex-1 px-4 py-2 rounded-lg border border-[#333] bg-[#1a1a1a] text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
          placeholder="Type a command..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="btn-primary px-4 py-2 text-sm font-bold"
        >
          Send
        </button>
      </form>
  );
}
