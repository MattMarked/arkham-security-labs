// Vercel serverless function to collect and store analytics data
import { Redis } from '@upstash/redis';

// Initialize Redis
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      // Receive analytics data from client
      const { 
        fingerprint, 
        timestamp, 
        userAgent, 
        referrer, 
        page = '/',
        sessionId 
      } = req.body;

      if (!fingerprint || !timestamp) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const hour = new Date().getHours();

      // Store individual visit
      const visitKey = `visit:${fingerprint}:${timestamp}`;
      await redis.setex(visitKey, 60 * 60 * 24 * 30, JSON.stringify({
        fingerprint,
        timestamp,
        userAgent,
        referrer,
        page,
        sessionId,
        date: today,
        hour
      })); // Expire after 30 days

      // Update daily stats
      const dailyKey = `daily:${today}`;
      const dailyStatsRaw = await redis.get(dailyKey);
      const dailyStats = dailyStatsRaw ? JSON.parse(dailyStatsRaw) : {
        date: today,
        pageViews: 0,
        uniqueVisitors: [],
        sessions: [],
        hourlyViews: Array(24).fill(0)
      };

      dailyStats.pageViews += 1;
      if (!dailyStats.uniqueVisitors.includes(fingerprint)) {
        dailyStats.uniqueVisitors.push(fingerprint);
      }
      if (!dailyStats.sessions.includes(sessionId)) {
        dailyStats.sessions.push(sessionId);
      }
      dailyStats.hourlyViews[hour] += 1;

      await redis.setex(dailyKey, 60 * 60 * 24 * 30, JSON.stringify(dailyStats));

      // Update overall stats
      const overallKey = 'overall';
      const overallStatsRaw = await redis.get(overallKey);
      const overallStats = overallStatsRaw ? JSON.parse(overallStatsRaw) : {
        totalPageViews: 0,
        totalUniqueVisitors: [],
        totalSessions: [],
        firstVisit: timestamp,
        lastVisit: timestamp
      };

      overallStats.totalPageViews += 1;
      if (!overallStats.totalUniqueVisitors.includes(fingerprint)) {
        overallStats.totalUniqueVisitors.push(fingerprint);
      }
      if (!overallStats.totalSessions.includes(sessionId)) {
        overallStats.totalSessions.push(sessionId);
      }
      overallStats.lastVisit = timestamp;

      await redis.set(overallKey, JSON.stringify(overallStats));

      return res.status(200).json({ success: true });

    } else if (req.method === 'GET') {
      // Return analytics data
      const { range = '30' } = req.query;
      const days = parseInt(range);

      // Get overall stats
      const overallStatsRaw = await redis.get('overall');
      const overallStats = overallStatsRaw ? JSON.parse(overallStatsRaw) : {
        totalPageViews: 0,
        totalUniqueVisitors: [],
        totalSessions: [],
        firstVisit: new Date().toISOString(),
        lastVisit: new Date().toISOString()
      };

      // Get daily stats for the requested range
      const dailyStats = {};
      const today = new Date();
      
      for (let i = 0; i < days; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const dayStatsRaw = await redis.get(`daily:${dateStr}`);
        const dayStats = dayStatsRaw ? JSON.parse(dayStatsRaw) : null;
        
        if (dayStats) {
          dailyStats[dateStr] = {
            date: dateStr,
            pageViews: dayStats.pageViews || 0,
            uniqueVisitors: Array.isArray(dayStats.uniqueVisitors) 
              ? dayStats.uniqueVisitors.length 
              : 0,
            sessions: Array.isArray(dayStats.sessions) 
              ? dayStats.sessions.length 
              : 0,
            hourlyViews: dayStats.hourlyViews || Array(24).fill(0)
          };
        } else {
          dailyStats[dateStr] = {
            date: dateStr,
            pageViews: 0,
            uniqueVisitors: 0,
            sessions: 0,
            hourlyViews: Array(24).fill(0)
          };
        }
      }

      const response = {
        overall: {
          totalPageViews: overallStats.totalPageViews,
          totalUniqueVisitors: Array.isArray(overallStats.totalUniqueVisitors) 
            ? overallStats.totalUniqueVisitors.length 
            : 0,
          totalSessions: Array.isArray(overallStats.totalSessions) 
            ? overallStats.totalSessions.length 
            : 0,
          firstVisit: overallStats.firstVisit,
          lastVisit: overallStats.lastVisit
        },
        daily: dailyStats,
        summary: {
          last7Days: Object.values(dailyStats)
            .slice(-7)
            .reduce((sum, day) => sum + day.pageViews, 0),
          last30Days: Object.values(dailyStats)
            .reduce((sum, day) => sum + day.pageViews, 0)
        }
      };

      return res.status(200).json(response);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Analytics API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
