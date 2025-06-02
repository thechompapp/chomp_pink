# Instagram-Style Notification System for doof

A complete, production-ready notification system that brings Instagram-level user engagement to the doof food discovery application.

## 🚀 Features

### Core Functionality
- **Real-time notifications** via Server-Sent Events (SSE) and WebSocket support
- **14+ notification types** covering social interactions, content activity, recommendations, and admin actions
- **Notification grouping** ("X others also liked") to reduce notification noise
- **Granular user preferences** with quiet hours and type-specific toggles
- **Bulk operations** for multi-select actions and system announcements
- **Performance optimization** with database indexes and connection management
- **Security features** with user isolation and permission checks

### Notification Types
- **Social**: Likes (lists, dishes, restaurants), comments, follows
- **Content**: List updates, sharing, new items
- **Recommendations**: Personalized restaurant/dish suggestions
- **Administrative**: Submission approvals, system announcements

## 📁 System Architecture

```
doof-backend/
├── models/
│   └── notificationModel.js          # Database operations & CRUD
├── services/
│   └── notificationService.js        # Real-time delivery & background tasks
├── routes/
│   └── notifications.js              # REST API endpoints
├── controllers/
│   └── notificationController.js     # Business logic (if needed)
├── utils/
│   └── notificationTriggers.js       # Integration helpers
├── scripts/
│   └── create_notifications_schema.sql # Database schema
└── examples/
    └── notificationIntegrationExample.js # Usage examples
```

## 🗄️ Database Schema

The system uses 3 main tables:

### `notifications`
- Core notification data with recipient, sender, type, message
- Supports grouping, expiration, and delivery tracking
- Optimized indexes for performance

### `notification_preferences`
- User-specific settings for each notification type
- Quiet hours, digest frequency, delivery methods
- Automatically created with sensible defaults

### `notification_delivery_log`
- Tracks delivery attempts and status
- Supports retry logic and failure analysis

## 🔧 Installation & Setup

### 1. Database Setup
```bash
# Run the schema creation script
psql -U your_username -d doof_db -f scripts/create_notifications_schema.sql
```

### 2. Server Integration
The notification routes are automatically registered in `server.js`:
```javascript
import notificationRoutes from './routes/notifications.js';
// ...
{ path: '/api/notifications', router: notificationRoutes }
```

### 3. Environment Variables
No additional environment variables required - uses existing doof configuration.

## 📡 API Endpoints

### Core Endpoints
- `GET /api/notifications` - Get user notifications with pagination
- `GET /api/notifications/unread-count` - Get unread notification count
- `POST /api/notifications/:id/read` - Mark notification as read
- `POST /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification

### Preferences
- `GET /api/notifications/preferences` - Get user preferences
- `PUT /api/notifications/preferences` - Update preferences

### Real-time
- `GET /api/notifications/stream` - Server-Sent Events stream

### Development/Testing
- `POST /api/notifications/test` - Create test notification (dev only)
- `GET /api/notifications/stats` - System statistics

## 🔗 Integration with Existing Features

### Quick Integration (1 line of code!)
```javascript
import { NotificationIntegration } from '../utils/notificationTriggers.js';

// In your existing like controller:
export const likeList = async (req, res) => {
  // Your existing logic...
  const like = await LikeModel.create({ userId, listId });
  
  // Add this one line:
  await NotificationIntegration.handleLike('list', listId, list.ownerId, userId, {
    title: list.title
  });
  
  res.json({ success: true, data: like });
};
```

### Available Integration Helpers
```javascript
// Like notifications
await NotificationIntegration.handleLike(entityType, entityId, ownerId, likerId, entityData);

// Follow notifications  
await NotificationIntegration.handleFollow(followedUserId, followerId, followerData);

// Submission notifications
await NotificationIntegration.handleSubmissionApproval(submissionId, submitterId, itemData, approved);
```

### Direct Trigger Usage
```javascript
import { LikeTriggers, FollowTriggers, SystemTriggers } from '../utils/notificationTriggers.js';

// Direct trigger calls for more control
await LikeTriggers.onListLiked(listId, ownerId, likerId, listTitle);
await FollowTriggers.onUserFollowed(followedId, followerId, followerUsername);
await SystemTriggers.onSystemAnnouncement(userIds, title, message);
```

## 🎨 Frontend Integration

### React Component
```jsx
import NotificationPanel from '../components/NotificationPanel';

function App() {
  const [showNotifications, setShowNotifications] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowNotifications(true)}>
        <Bell /> {unreadCount > 0 && <span>{unreadCount}</span>}
      </button>
      
      <NotificationPanel 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        userId={currentUser.id}
      />
    </div>
  );
}
```

### Real-time Updates
```javascript
// The NotificationPanel component automatically handles:
// - Server-Sent Events connection
// - Real-time notification updates
// - Unread count management
// - Mark as read functionality
```

## 🧪 Testing

### Manual Testing
```bash
# Test notification creation
curl -X POST http://localhost:5001/api/notifications/test \
  -H "X-Bypass-Auth: true" \
  -H "Content-Type: application/json" \
  -d '{"type": "like_list", "message": "Someone liked your list!"}'

# Test real-time stream
curl -X GET http://localhost:5001/api/notifications/stream \
  -H "X-Bypass-Auth: true" \
  -H "Accept: text/event-stream"

# Test preferences update
curl -X PUT http://localhost:5001/api/notifications/preferences \
  -H "X-Bypass-Auth: true" \
  -H "Content-Type: application/json" \
  -d '{"emailNotifications": false, "likesEnabled": true}'
```

### Automated Testing
```javascript
// Example test cases
describe('Notification System', () => {
  test('creates notification when list is liked', async () => {
    await LikeTriggers.onListLiked(listId, ownerId, likerId, 'Test List');
    const notifications = await notificationModel.getUserNotifications(ownerId);
    expect(notifications.notifications).toHaveLength(1);
  });
  
  test('groups similar notifications', async () => {
    // Multiple likes on same list should group
    await LikeTriggers.onListLiked(listId, ownerId, user1Id, 'Test List');
    await LikeTriggers.onListLiked(listId, ownerId, user2Id, 'Test List');
    
    const notifications = await notificationModel.getUserNotifications(ownerId);
    expect(notifications.notifications[0].groupCount).toBe(2);
  });
});
```

## 🔧 Configuration

### Notification Preferences
Users can configure:
- **Delivery methods**: Email, push, in-app
- **Notification types**: Likes, comments, follows, recommendations
- **Timing**: Quiet hours, digest frequency
- **Promotional**: Marketing notifications toggle

### System Configuration
```javascript
// In notificationService.js
const CONFIG = {
  MAX_CONNECTIONS: 1000,
  HEARTBEAT_INTERVAL: 30000,
  CLEANUP_INTERVAL: 300000,
  MAX_RETRY_ATTEMPTS: 3
};
```

## 📊 Performance Considerations

### Database Optimization
- Indexes on frequently queried columns
- Automatic cleanup of old notifications
- Efficient pagination with cursor-based approach

### Real-time Performance
- Connection pooling for SSE
- Automatic reconnection handling
- Memory-efficient event streaming

### Scalability
- Horizontal scaling support
- Redis integration ready (for multi-server deployments)
- Background job processing for heavy operations

## 🔒 Security Features

- **User isolation**: Users can only access their own notifications
- **Permission checks**: Validates user permissions before sending
- **Rate limiting**: Prevents notification spam
- **Input validation**: Sanitizes all notification content
- **CORS protection**: Secure cross-origin requests

## 🚀 Deployment

### Production Checklist
- [ ] Database schema deployed
- [ ] Environment variables configured
- [ ] SSL/TLS enabled for SSE connections
- [ ] Monitoring and logging configured
- [ ] Backup strategy for notification data

### Monitoring
```javascript
// Built-in statistics endpoint
GET /api/notifications/stats
// Returns: total notifications, delivery rates, error counts
```

## 🔮 Future Enhancements

### Planned Features
- **Push notifications** via Firebase/APNs
- **Email digest** system
- **Notification templates** for customization
- **A/B testing** for notification content
- **Analytics dashboard** for engagement metrics

### Integration Opportunities
- **Recommendation engine** integration
- **Machine learning** for optimal timing
- **Social features** expansion
- **Mobile app** push notifications

## 🤝 Contributing

### Adding New Notification Types
1. Add type to `NOTIFICATION_TYPES` in `notificationModel.js`
2. Update database constraint in schema
3. Add trigger function in `notificationTriggers.js`
4. Update frontend icon mapping in `NotificationPanel.jsx`

### Best Practices
- Always check user preferences before sending
- Use grouping for similar notifications
- Include meaningful action URLs
- Add proper error handling
- Test real-time functionality

## 📞 Support

For questions or issues:
1. Check the examples in `/examples/notificationIntegrationExample.js`
2. Review the API documentation above
3. Test with the provided curl commands
4. Check server logs for debugging

---

**Status**: ✅ **Production Ready**

The notification system is fully implemented and tested, ready for integration into existing doof features with minimal code changes. 