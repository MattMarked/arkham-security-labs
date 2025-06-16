# Simple Visit Tracking System

A lightweight, privacy-friendly visit tracking solution for your Vercel-hosted website that requires no external services or databases.

## 🚀 Features

- **Zero External Dependencies**: No Google Analytics, no third-party services
- **Privacy-First**: All data stored locally in visitors' browsers
- **Lightweight**: Minimal performance impact
- **Real-time**: Instant tracking and reporting
- **Mobile-Friendly**: Responsive analytics dashboard

## 📊 What It Tracks

- **Page Views**: Total number of page loads
- **Sessions**: Unique browsing sessions (30-minute timeout)
- **Unique Visitors**: Estimated using browser fingerprinting
- **Daily Visits**: Visit counts by day (30-day retention)
- **Visit Timestamps**: First and last visit times

## 🔧 How It Works

### Client-Side Tracking
The system uses a `VisitTracker` class that automatically:
1. Generates a browser fingerprint (screen size, timezone, user agent, canvas)
2. Stores visit data in localStorage
3. Tracks sessions using sessionStorage
4. Maintains daily visit counts for 30 days

### Browser Fingerprinting
Creates a unique identifier using:
- User agent string
- Screen resolution
- Timezone offset
- Canvas rendering signature
- Browser language

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

### Method 1: Direct File Access
- Upload `admin.html` to your Vercel deployment
- Visit `https://yourdomain.com/admin.html`

### Method 2: Local Development
- Open `admin.html` directly in your browser
- Data will be shared if you've visited the main site

### Method 3: Console Commands
Open browser developer tools on your main site and run:
```javascript
console.table(visitTracker.getStats())
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
- ✅ No external data transmission
- ✅ No personal information collected
- ✅ GDPR/CCPA friendly
- ✅ No tracking across sites

### Limitations
- ❌ Data resets if visitors clear browser storage
- ❌ Only tracks JavaScript-enabled visitors
- ❌ Fingerprinting can be blocked by privacy tools
- ❌ No server-side backup of data
- ❌ Limited cross-device tracking

## 🚀 Deployment

### Vercel Deployment
1. The tracking is already integrated into your `script.js`
2. Upload `admin.html` to your project root
3. Deploy normally - no additional configuration needed

### Security Considerations
- Consider password-protecting `admin.html` for production
- The admin page only shows data from the current browser
- No sensitive data is exposed

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
const data = visitTracker.exportData();
// Send to your own analytics endpoint
fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify(data)
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
