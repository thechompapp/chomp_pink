// Filename: /src/pages/Lists/ListCard.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import BaseCard from '@/components/UI/BaseCard';
import { engagementService } from '@/services/engagementService';

const ListCard = ({ list }) => {
    if (!list || !list.id || !list.name) {
        console.warn('[ListCard] Invalid list prop:', list);
        return null;
    }

    const handleCardClick = () => {
        engagementService.logEngagement({
            item_id: parseInt(list.id, 10),
            item_type: 'list',
            engagement_type: 'click',
        });
    };

    const tags = Array.isArray(list.tags) ? list.tags : [];
    const updatedAt = list.updated_at ? new Date(list.updated_at) : new Date();
    const timeDiff = Date.now() - updatedAt.getTime();
    const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const updatedText = daysAgo > 0 ? `Updated ${daysAgo} days ago` : 'Updated recently';

    return (
        <BaseCard
            linkTo={`/lists/${list.id}`}
            onClick={handleCardClick}
            quickAddLabel={`Add list ${list.name} to favorites`}
            className="w-full"
        >
            <div className="flex-grow min-h-0 overflow-hidden">
                <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-[#A78B71] transition-colors">
                    {list.name}
                </h3>
                <p className="text-xs text-gray-500 mb-1">{list.item_count || 0} items</p>
                <p className="text-xs text-gray-500">{updatedText}</p>
            </div>
            {tags.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-1 flex-shrink-0">
                    {tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600 whitespace-nowrap">
                            #{tag}
                        </span>
                    ))}
                    {tags.length > 3 && (
                        <span className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600">
                            +{tags.length - 3}
                        </span>
                    )}
                </div>
            )}
        </BaseCard>
    );
};

ListCard.propTypes = {
    list: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        item_count: PropTypes.number,
        tags: PropTypes.arrayOf(PropTypes.string),
        updated_at: PropTypes.string,
    }).isRequired,
};

export default ListCard;