// src/pages/RestaurantDetail/index.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ChevronLeft,
  MapPin,
  Phone,
  Globe,
  Navigation,
  Utensils,
  ExternalLink,
  PlusCircle,
} from "lucide-react";
import useAppStore from "@/hooks/useAppStore";
import DishCard from "@/components/UI/DishCard";
import Button from "@/components/Button";
import { useQuickAdd } from "@/context/QuickAddContext";
import { API_BASE_URL } from "@/config";

const RestaurantDetail = () => {
  const { id } = useParams();
  const { openQuickAdd } = useQuickAdd();
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRestaurant = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/restaurants/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setRestaurant(data);
      } catch (err) {
        console.error("Error loading restaurant:", err);
        setError("Could not load restaurant.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRestaurant();
  }, [id]);

  if (isLoading) return <div className="p-4 text-gray-400">Loading...</div>;
  if (error || !restaurant) return <div className="p-4 text-red-400">{error || "Not found."}</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center mb-4">
        <Link to="/" className="text-gray-400 hover:text-white flex items-center">
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </Link>
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-bold">{restaurant.name}</h1>
        <div className="text-sm text-gray-400">{restaurant.address}</div>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {restaurant.tags?.map((tag, index) => (
          <span key={index} className="text-xs px-2 py-1 bg-gray-700 rounded-full text-white">
            #{tag}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-300 mb-6">
        {restaurant.website && (
          <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white">
            <Globe className="w-4 h-4" /> Website
          </a>
        )}
        {restaurant.phone && (
          <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1 hover:text-white">
            <Phone className="w-4 h-4" /> Call
          </a>
        )}
        {restaurant.address && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-white"
          >
            <MapPin className="w-4 h-4" /> Directions
          </a>
        )}
      </div>

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Dishes</h2>
        <button onClick={() => openQuickAdd({ restaurantId: restaurant.id })} className="text-sm text-blue-400 hover:underline flex items-center gap-1">
          <PlusCircle className="w-4 h-4" /> Add
        </button>
      </div>

      {restaurant.dishes?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {restaurant.dishes.map((dish) => (
            <DishCard key={dish.id} dish={dish} />
          ))}
        </div>
      ) : (
        <div className="text-gray-400 text-sm">No dishes added yet.</div>
      )}
    </div>
  );
};

export default RestaurantDetail;
