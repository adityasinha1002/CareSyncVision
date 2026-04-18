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
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask me about health metrics, medications, or analysis..."
        className="input-field flex-1"
      />
      <button
        type="submit"
        className="btn-primary px-6 flex items-center gap-2"
      >
        <Send className="w-5 h-5" />
        <span className="hidden sm:inline">Submit</span>
      </button>
    </form>
  );
}
