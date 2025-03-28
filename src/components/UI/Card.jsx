import React from 'react';
import { Link } from 'react-router-dom';

const Card = ({ item, onQuickAdd }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md relative h-full transition hover:shadow-lg">
      <Link to={item.url} className="block pr-16">
        <h3 className="text-gray-900 font-bold text-lg">{item.name}</h3>
        {item.neighborhood && (
          <p className="text-gray-600 text-sm mt-1">{item.neighborhood}, {item.city}</p>
        )}
        <div className="flex flex-wrap mt-2 gap-2">
          {item.tags.map((tag) => (
            <span key={tag} className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
              #{tag}
            </span>
          ))}
        </div>
      </Link>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onQuickAdd(item);  // Make sure the function is properly called
        }}
        className="absolute top-4 right-4 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white shadow hover:bg-pink-600 transition"
      >
        +
      </button>
    </div>
  );
};

export default Card;
