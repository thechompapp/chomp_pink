-- Notification System Database Schema
-- Creates tables for comprehensive Instagram-style notifications

-- 1. Main notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Notification type and content
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'like_list', 'like_dish', 'like_restaurant',
        'comment_list', 'comment_dish', 'comment_restaurant', 
        'follow_user', 'unfollow_user',
        'list_item_added', 'list_shared',
        'restaurant_recommendation', 'dish_recommendation',
        'new_dish_at_favorite_restaurant',
        'submission_approved', 'submission_rejected',
        'system_announcement', 'promotional'
    )),
    
    -- Related entity information
    related_entity_type VARCHAR(50) CHECK (related_entity_type IN (
        'user', 'list', 'dish', 'restaurant', 'submission', 'system'
    )),
    related_entity_id INTEGER,
    
    -- Notification content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500), -- Deep link URL for the notification
    
    -- Metadata
    metadata JSONB DEFAULT '{}', -- Additional context data
    image_url VARCHAR(500), -- Optional image for rich notifications
    
    -- Status tracking
    is_read BOOLEAN DEFAULT FALSE,
    is_seen BOOLEAN DEFAULT FALSE, -- Seen in notification feed vs actually read
    read_at TIMESTAMP WITH TIME ZONE,
    seen_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery tracking
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN (
        'pending', 'delivered', 'failed', 'expired'
    )),
    delivery_attempts INTEGER DEFAULT 0,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Grouping support (for Instagram-style grouped notifications)
    group_key VARCHAR(100), -- e.g., "likes_list_123" to group multiple likes on same list
    group_count INTEGER DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE -- Optional expiration for promotional notifications
);

-- 2. Notification preferences table
CREATE TABLE notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Preference categories
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    in_app_notifications BOOLEAN DEFAULT TRUE,
    
    -- Specific notification type preferences
    likes_enabled BOOLEAN DEFAULT TRUE,
    comments_enabled BOOLEAN DEFAULT TRUE,
    follows_enabled BOOLEAN DEFAULT TRUE,
    recommendations_enabled BOOLEAN DEFAULT TRUE,
    list_activity_enabled BOOLEAN DEFAULT TRUE,
    submissions_enabled BOOLEAN DEFAULT TRUE,
    system_announcements_enabled BOOLEAN DEFAULT TRUE,
    promotional_enabled BOOLEAN DEFAULT FALSE,
    
    -- Frequency controls
    digest_frequency VARCHAR(20) DEFAULT 'daily' CHECK (digest_frequency IN (
        'immediate', 'hourly', 'daily', 'weekly', 'disabled'
    )),
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- 3. Push notification subscriptions (for PWA support)
CREATE TABLE push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Push subscription data
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    
    -- Device/browser info
    user_agent TEXT,
    device_type VARCHAR(50), -- 'mobile', 'desktop', 'tablet'
    browser VARCHAR(50),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, endpoint)
);

-- 4. Notification digest tracking
CREATE TABLE notification_digests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Digest details
    digest_type VARCHAR(20) NOT NULL CHECK (digest_type IN ('daily', 'weekly')),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Content
    notifications_count INTEGER DEFAULT 0,
    content JSONB DEFAULT '{}', -- Summarized notification content
    
    -- Delivery
    sent_at TIMESTAMP WITH TIME ZONE,
    delivery_status VARCHAR(20) DEFAULT 'pending',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, digest_type, period_start)
);

-- 5. Real-time notification channels (for WebSocket management)
CREATE TABLE notification_channels (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Channel details
    channel_id VARCHAR(100) NOT NULL, -- WebSocket channel identifier
    socket_id VARCHAR(100), -- Specific socket connection ID
    
    -- Connection info
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Device info
    device_info JSONB DEFAULT '{}',
    
    UNIQUE(user_id, channel_id)
);

-- Indexes for performance
CREATE INDEX idx_notifications_recipient_created ON notifications(recipient_id, created_at DESC);
CREATE INDEX idx_notifications_recipient_unread ON notifications(recipient_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_type_created ON notifications(notification_type, created_at DESC);
CREATE INDEX idx_notifications_entity ON notifications(related_entity_type, related_entity_id);
CREATE INDEX idx_notifications_group_key ON notifications(group_key) WHERE group_key IS NOT NULL;
CREATE INDEX idx_notifications_delivery_status ON notifications(delivery_status, created_at);
CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX idx_push_subscriptions_user_active ON push_subscriptions(user_id, is_active);
CREATE INDEX idx_notification_channels_user_active ON notification_channels(user_id, is_active);

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_subscriptions_updated_at
    BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_notification_preferences_for_new_user
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();

-- Function to clean up old notifications (run via cron job)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete read notifications older than 30 days
    DELETE FROM notifications 
    WHERE is_read = TRUE 
    AND created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete expired notifications
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE notifications IS 'Main notifications table storing all user notifications';
COMMENT ON TABLE notification_preferences IS 'User preferences for notification delivery and types';
COMMENT ON TABLE push_subscriptions IS 'Web push notification subscriptions for PWA support';
COMMENT ON TABLE notification_digests IS 'Tracks notification digest emails sent to users';
COMMENT ON TABLE notification_channels IS 'Manages real-time WebSocket channels for live notifications';

COMMENT ON COLUMN notifications.group_key IS 'Used to group similar notifications (e.g., multiple likes on same post)';
COMMENT ON COLUMN notifications.metadata IS 'Additional context data stored as JSON';
COMMENT ON COLUMN notification_preferences.quiet_hours_start IS 'Start time for quiet hours (no notifications)';
COMMENT ON COLUMN notification_preferences.digest_frequency IS 'How often to send notification digest emails'; 