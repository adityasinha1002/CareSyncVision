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
          className="flex-1 px-4 py-2 rounded-lg border border-primary focus:outline-none focus:ring-2 focus:ring-primary bg-white text-primary placeholder:text-gray-400"
          placeholder="Type a command..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition"
        >
          Send
        </button>
      </form>
  );
}
