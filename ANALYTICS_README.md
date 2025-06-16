# Simple Visit Tracking System

A lightweight, privacy-friendly visit tracking solution for your Vercel-hosted website with both client-side and server-side analytics.

## 🚀 Features

- **Dual Tracking**: Client-side (localStorage) + Server-side (Upstash Redis)
- **Privacy-First**: No cookies, no personal data collection
- **Zero External Dependencies**: No Google Analytics, no third-party services
- **Lightweight**: Minimal performance impact
- **Real-time**: Instant tracking and reporting
- **Mobile-Friendly**: Responsive analytics dashboard
- **Aggregated Analytics**: View stats from ALL visitors, not just your browser

## 📊 What It Tracks

- **Page Views**: Total number of page loads
- **Sessions**: Unique browsing sessions (30-minute timeout)
- **Unique Visitors**: Estimated using browser fingerprinting
- **Daily Visits**: Visit counts by day (30-day retention)
- **Visit Timestamps**: First and last visit times

## 🔧 How It Works

### Dual Tracking System

#### Client-Side Tracking (localStorage)
The system uses a `VisitTracker` class that automatically:
1. Generates a browser fingerprint (screen size, timezone, user agent, canvas)
2. Stores visit data in localStorage
3. Tracks sessions using sessionStorage
4. Maintains daily visit counts for 30 days

#### Server-Side Tracking (Upstash Redis)
Simultaneously sends anonymized data to `/api/analytics` which:
1. Stores aggregated visit data in Upstash Redis database
2. Tracks unique visitors across ALL browsers
3. Maintains daily/hourly statistics
4. Provides centralized analytics accessible from any device

### Browser Fingerprinting
Creates a unique identifier using:
- User agent string
- Screen resolution
- Timezone offset
- Canvas rendering signature
- Browser language

**Note**: Fingerprints are hashed and anonymized - no personal data is stored.

## 📱 Usage

### Viewing Analytics
1. Visit `admin.html` in your browser
2. View real-time statistics and charts
3. Export data as JSON for further analysis

### Console Access
You can also access tracking data via browser console:

```javascript
// Get current statistics
visitTracker.getStats()

// Export all data
visitTracker.exportData()

// Clear all data
visitTracker.clearData()
```

## 🎯 Accessing Your Analytics

### Method 1: Server-Side Dashboard (Recommended)
- Upload `admin.html` to your Vercel deployment
- Visit `https://yourdomain.com/admin.html`
- **Shows aggregated data from ALL visitors**
- Works from any device/browser

### Method 2: Local Development
- Open `admin.html` directly in your browser
- Falls back to local data if server unavailable
- Shows "(Local)" labels when using localStorage data

### Method 3: Console Commands
Open browser developer tools on your main site and run:
```javascript
// Local stats (current browser only)
console.table(visitTracker.getStats())

// Server stats (all visitors)
visitTracker.fetchServerStats().then(console.log)
```

### Method 4: API Access
Direct API access for custom integrations:
```bash
# Get analytics data
curl https://yourdomain.com/api/analytics?range=30

# Send custom tracking data
curl -X POST https://yourdomain.com/api/analytics \
  -H "Content-Type: application/json" \
  -d '{"fingerprint":"abc123","timestamp":"2025-01-01T00:00:00Z"}'
```

## 📈 Understanding the Data

### Metrics Explained
- **Total Page Views**: Every page load (including refreshes)
- **Total Sessions**: Unique browsing sessions (resets after 30min inactivity)
- **Unique Visitors**: Estimated unique browsers (fingerprint-based)
- **Today's/Yesterday's Visits**: Page views for specific days

### Chart
- Shows daily visit counts for the last 30 days
- Hover over bars to see exact numbers
- Automatically scales to fit data range

## ⚙️ Configuration

### Customizing Session Timeout
Edit the session timeout in `script.js`:
```javascript
// Change 30 minutes to desired timeout
const isNewSession = !sessionStorage.getItem(this.sessionKey) || 
    (Date.now() - parseInt(sessionStorage.getItem(this.sessionKey)) > 30 * 60 * 1000);
```

### Customizing Data Retention
Edit the data retention period:
```javascript
// Change 30 days to desired retention
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
```

## 🔒 Privacy & Limitations

### Privacy Benefits
- ✅ No cookies used
- ✅ No personal information collected
- ✅ GDPR/CCPA friendly
- ✅ No tracking across sites
- ✅ Anonymized browser fingerprints only
- ✅ Data automatically expires (30 days)

### Server-Side Benefits
- ✅ Persistent data storage (survives browser clearing)
- ✅ Aggregated analytics across all visitors
- ✅ Access from any device/browser
- ✅ Automatic data cleanup and retention

### Limitations
- ❌ Only tracks JavaScript-enabled visitors
- ❌ Fingerprinting can be blocked by privacy tools
- ❌ Limited cross-device tracking (by design)
- ❌ Requires Upstash Redis database for server features

## 🚀 Deployment

### Vercel Deployment
1. **Create Upstash Redis**: Go to your Vercel dashboard → Storage → Create Upstash Redis Database
2. The tracking is already integrated into your `script.js`
3. Upload `admin.html` and `api/analytics.js` to your project
4. Deploy normally - Vercel will automatically provide the Upstash environment variables

### Required Files
```
├── index.html          # Your main site (tracking auto-enabled)
├── script.js           # Contains VisitTracker class
├── admin.html          # Analytics dashboard
├── api/
│   └── analytics.js    # Vercel serverless function
└── package.json        # Contains @upstash/redis dependency
```

### Environment Setup
No manual environment variables needed! Vercel automatically provides the Upstash Redis environment variables (`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`) when you create an Upstash Redis database in your project.

### Security Considerations
- Consider password-protecting `admin.html` for production
- The admin page shows aggregated data from all visitors
- No personal or sensitive data is stored
- All data is anonymized using browser fingerprints

## 🔧 Advanced Usage

### Custom Events
You can track custom events by extending the VisitTracker class:

```javascript
// Track button clicks
document.querySelector('#cta-button').addEventListener('click', () => {
    // Custom tracking logic here
});
```

### Data Export
Export data programmatically:
```javascript
// Export local data
const localData = visitTracker.exportData();

// Export server data
const serverData = await visitTracker.fetchServerStats(30);

// Send to your own analytics endpoint
fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        fingerprint: 'unique-id',
        timestamp: new Date().toISOString(),
        page: window.location.pathname
    })
});
```

## 🆘 Troubleshooting

### No Data Showing
1. Ensure JavaScript is enabled
2. Check browser console for errors
3. Verify localStorage is not disabled
4. Try refreshing the page

### Inaccurate Visitor Counts
- Fingerprinting can be inconsistent across browser updates
- Privacy tools may interfere with fingerprinting
- Incognito/private browsing creates new fingerprints

### Performance Issues
- The system is designed to be lightweight
- Data cleanup happens automatically (30-day retention)
- Consider reducing retention period if needed

## 📞 Support

This is a simple, self-contained system. For issues:
1. Check browser console for JavaScript errors
2. Verify localStorage permissions
3. Test in different browsers
4. Review the code in `script.js` for customization

---

**Note**: This system prioritizes simplicity and privacy over comprehensive analytics. For advanced features, consider upgrading to a dedicated analytics platform.
