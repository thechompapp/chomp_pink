import React, { useState } from 'react';
import useUIStateStore from '@/stores/useUIStateStore';
import { Search } from 'lucide-react';

const SearchBar = ({ onSearch }) => {
    const [input, setInput] = useState('');
    const setSearchQuery = useUIStateStore(state => state.setSearchQuery);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSearchQuery(input);
        if (onSearch) onSearch(input);
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto mb-6">
            <div className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Search for restaurants, dishes, or lists..."
                    className="w-full p-3 pr-10 border border-gray-300 rounded-md focus:ring-[#A78B71] focus:border-[#A78B71]"
                />
                <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#A78B71]"
                >
                    <Search size={20} />
                </button>
            </div>
        </form>
    );
};

export default SearchBar;