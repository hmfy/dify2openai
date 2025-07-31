import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Smartphone,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { appsAPI, logsAPI } from '../services/api';
import { formatNumber } from '@/lib/utils';

interface Stats {
  totalApps: number;
  activeApps: number;
  totalCalls: number;
  successfulCalls: number;
  errorCalls: number;
  successRate: number;
  avgResponseTime: number;
  recentLogs: Array<{
    id: number;
    method: string;
    endpoint: string;
    statusCode: number;
    responseTime: number;
    createdAt: string;
  }>;
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend: {
    value: number;
    isPositive: boolean;
  } | null;
  color: 'primary' | 'success' | 'warning' | 'info';
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  color 
}) => {
  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    info: 'text-info bg-info/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <Card className={`h-full transition-all duration-200 hover:shadow-lg border-l-4 ${
        color === 'primary' ? 'border-l-primary' :
        color === 'success' ? 'border-l-success' :
        color === 'warning' ? 'border-l-warning' :
        'border-l-info'
      }`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-1">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground mb-2">{description}</p>
          )}
          {trend && (
            <div className="flex items-center text-xs">
              <TrendingUp 
                className={`mr-1 h-3 w-3 ${
                  trend.isPositive ? 'text-success' : 'text-destructive'
                }`} 
              />
              <span className={trend.isPositive ? 'text-success' : 'text-destructive'}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-muted-foreground ml-1">from last week</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function NewDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [appsStatsResponse, logsStatsResponse, recentLogsResponse] = await Promise.all([
        appsAPI.getStats(),
        logsAPI.getStats(),
        logsAPI.getAll({ limit: 5 })
      ]);
      
      // Calculate success rate
      const successRate = logsStatsResponse.data.totalCalls > 0 
        ? Math.round((logsStatsResponse.data.successfulCalls / logsStatsResponse.data.totalCalls) * 100) 
        : 100;
      
      setStats({
        totalApps: appsStatsResponse.data.totalApps,
        activeApps: appsStatsResponse.data.activeApps,
        totalCalls: logsStatsResponse.data.totalCalls,
        successfulCalls: logsStatsResponse.data.successfulCalls,
        errorCalls: logsStatsResponse.data.errorCalls,
        avgResponseTime: logsStatsResponse.data.avgResponseTime,
        successRate: successRate,
        recentLogs: recentLogsResponse.data.data || []
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Applications',
      value: formatNumber(stats?.totalApps || 0),
      description: 'Registered applications',
      icon: <Smartphone className="h-4 w-4" />,
      color: 'primary' as const,
      trend: null, // Removed hardcoded trend
    },
    {
      title: 'Active Applications',
      value: formatNumber(stats?.activeApps || 0),
      description: 'Currently running',
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'success' as const,
      trend: null,
    },
    {
      title: 'API Calls',
      value: formatNumber(stats?.totalCalls || 0),
      description: 'Total requests processed',
      icon: <Activity className="h-4 w-4" />,
      color: 'info' as const,
      trend: null,
    },
    {
      title: 'Success Rate',
      value: `${stats?.successRate || 0}%`,
      description: 'Request success ratio',
      icon: <BarChart3 className="h-4 w-4" />,
      color: stats?.successRate && stats.successRate >= 90 ? 'success' as const : 'warning' as const,
      trend: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your API gateway.
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Clock className="mr-1 h-3 w-3" />
          Live Data
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <StatCard {...card} />
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                System Status
              </CardTitle>
              <CardDescription>
                Real-time monitoring of your API gateway components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <span className="text-sm font-medium">API Gateway</span>
                  </div>
                  <Badge variant="success">Operational</Badge>
                </div>
                <Progress value={stats.successRate || 0} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  Success Rate: {stats.successRate || 0}% ({stats.successfulCalls || 0} successful / {stats.totalCalls || 0} total)
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Applications</span>
                  </div>
                  <Badge variant="success">{stats.activeApps || 0} Active</Badge>
                </div>
                <Progress 
                  value={stats.totalApps ? (stats.activeApps / stats.totalApps) * 100 : 0} 
                  className="h-2" 
                />
                <div className="text-xs text-muted-foreground">
                  {stats.activeApps || 0} active out of {stats.totalApps || 0} total applications
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-info rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Response Time</span>
                  </div>
                  <Badge variant="outline">{stats.avgResponseTime || 0}ms Avg</Badge>
                </div>
                <Progress 
                  value={Math.min(100, stats.avgResponseTime ? (100 - stats.avgResponseTime / 10) : 100)} 
                  className="h-2" 
                />
                <div className="text-xs text-muted-foreground">
                  Average response time: {stats.avgResponseTime || 0}ms
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                onClick={() => navigate('/apps')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Smartphone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Add Application</p>
                    <p className="text-xs text-muted-foreground">Register new app</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                onClick={() => navigate('/logs')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-info/10 rounded-lg">
                    <Activity className="h-4 w-4 text-info" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">View Logs</p>
                    <p className="text-xs text-muted-foreground">Check API calls</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                onClick={() => navigate('/dashboard')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">System Health</p>
                    <p className="text-xs text-muted-foreground">Check status</p>
                  </div>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest API calls and system events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentLogs && stats.recentLogs.length > 0 ? (
                stats.recentLogs.map((log, index) => {
                  const isSuccess = log.statusCode >= 200 && log.statusCode < 300;
                  const timeAgo = new Date(log.createdAt).toLocaleTimeString();
                  
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                      className="flex items-center gap-4 p-3 rounded-lg border"
                    >
                      <div className={`w-2 h-2 rounded-full ${isSuccess ? 'bg-success' : 'bg-destructive'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {isSuccess ? 'API call successful' : `Error ${log.statusCode}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.method} {log.endpoint} - {log.responseTime}ms
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {timeAgo}
                      </Badge>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No recent activity found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}