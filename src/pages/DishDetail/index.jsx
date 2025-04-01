// src/pages/DishDetail/index.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ThumbsUp, ThumbsDown, Minus, User } from 'lucide-react';
import { useQuickAdd } from '@/context/QuickAddContext';
import { API_BASE_URL } from '@/config';
import Button from '@/components/Button';

const DishDetail = () => {
  const { id } = useParams();
  const { openQuickAdd } = useQuickAdd();
  const [dish, setDish] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [review] = useState({
    text: "This is a mock review placeholder for 'The Take'.",
    author: "Maria Rossi",
    username: "@pastaexpert",
    verified: true,
    date: "March 18, 2025",
    upvotes: 724,
    neutrals: 53,
    downvotes: 12
  });

  const [featuredLists] = useState([
    { id: 1, name: "Best Pasta in NYC", author: "@pastafan", followers: 423 },
    { id: 2, name: "Simple but Perfect Dishes", author: "@minimalchef", followers: 286 },
    { id: 3, name: "Must Try in West Village", author: "@nycfoodie", followers: 568 },
  ]);

  const [similarDishes] = useState([
    { id: 101, name: "Carbonara at Lilia", price: "$22" },
    { id: 102, name: "Tagliatelle al Ragù at L'Artusi", price: "$26" },
    { id: 103, name: "Bucatini all'Amatriciana at I Sodi", price: "$24" },
  ]);

  useEffect(() => {
    const fetchDish = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/dishes/${id}`);
        if (!res.ok) throw new Error('Dish not found');
        const data = await res.json();
        setDish(data);
      } catch (err) {
        console.error(err);
        setError('Could not load dish.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDish();
  }, [id]);

  if (isLoading) return <div className="p-4 text-neutral-500">Loading...</div>;
  if (error || !dish) return <div className="p-4 text-red-500">{error || 'Not found.'}</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto text-neutral-900">
      <Link to="/" className="flex items-center text-sm text-neutral-500 hover:text-neutral-800 mb-4">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to search
      </Link>

      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 leading-tight mb-1">{dish.name}</h1>
          {dish.restaurant_name && (
            <Link
              to={`/restaurant/${dish.restaurant_id}`}
              className="text-sm text-neutral-600 hover:underline"
            >
              at {dish.restaurant_name}
            </Link>
          )}
        </div>
        <Button size="sm" onClick={() => openQuickAdd(dish)}>
          + Add to List
        </Button>
      </div>

      {dish.description && <p className="text-sm text-neutral-600 mb-4 max-w-prose">{dish.description}</p>}

      <div className="flex flex-wrap gap-2 mb-6">
        {dish.tags?.map((tag, i) => (
          <span
            key={i}
            className="text-xs px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full border border-neutral-300"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-800 mb-3">The Take</h2>
        <p className="text-sm text-neutral-700 mb-2">"{review.text}"</p>
        <div className="text-xs text-neutral-600 mb-2">
          <span className="font-semibold text-neutral-800">{review.author}</span>
          {review.verified && <span className="ml-1 text-blue-500">✔</span>} ({review.username}) · {review.date}
        </div>
        <div className="flex gap-4 text-xs text-neutral-500 items-center">
          <div className="flex items-center gap-1"><ThumbsUp className="w-4 h-4" /> {review.upvotes}</div>
          <div className="flex items-center gap-1"><Minus className="w-4 h-4" /> {review.neutrals}</div>
          <div className="flex items-center gap-1"><ThumbsDown className="w-4 h-4" /> {review.downvotes}</div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-neutral-800 mb-2">Featured on Lists</h2>
        <div className="space-y-2">
          {featuredLists.map((list) => (
            <div
              key={list.id}
              className="flex items-center justify-between rounded-lg bg-white border border-neutral-200 px-4 py-2 shadow-sm"
            >
              <div>
                <Link to={`/list/${list.id}`} className="text-neutral-900 font-medium hover:underline">
                  {list.name}
                </Link>
                <div className="text-xs text-neutral-500">by {list.author}</div>
              </div>
              <div className="flex items-center gap-1 text-xs text-neutral-500">
                <User className="w-4 h-4" /> {list.followers} followers
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-neutral-800 mb-2">Similar Dishes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {similarDishes.map((d) => (
            <Link
              to={`/dish/${d.id}`}
              key={d.id}
              className="bg-white border border-neutral-200 rounded-lg px-4 py-3 hover:bg-neutral-50 shadow-sm"
            >
              <div className="text-neutral-900 font-medium mb-1">{d.name}</div>
              <div className="text-xs text-neutral-500">{d.price}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DishDetail;
