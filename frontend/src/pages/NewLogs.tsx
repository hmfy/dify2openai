import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Activity,
  Zap,
  Globe,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { logsAPI } from '../services/api';

interface LogEntry {
  id: number;
  apiKey: string;
  appName: string;
  method: string;
  endpoint: string;
  requestBody: string;
  responseBody: string;
  statusCode: number;
  responseTime: number;
  errorMessage: string | null;
  createdAt: string;
}

interface LogsResponse {
  data: LogEntry[];
  total: number;
}

const ITEMS_PER_PAGE = 6;

export default function NewLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const [visibleBodies, setVisibleBodies] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const totalPages = Math.ceil(totalLogs / ITEMS_PER_PAGE);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(searchTerm && { endpoint: searchTerm }),
        ...(statusFilter !== 'all' && { 
          status: statusFilter === 'success' ? '200' : statusFilter === 'error' ? '400' : undefined 
        }),
      };

      const response = await logsAPI.getAll(params);
      
      if (response && response.data) {
        const newLogs = Array.isArray(response.data) ? response.data : 
                        (response.data.data && Array.isArray(response.data.data)) ? response.data.data : [];
        const total = response.data.total || newLogs.length;
        
        setLogs(newLogs);
        setTotalLogs(total);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch logs.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    fetchLogs();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const toggleLogExpansion = (logId: number) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const toggleBodyVisibility = (bodyId: string) => {
    const newVisible = new Set(visibleBodies);
    if (newVisible.has(bodyId)) {
      newVisible.delete(bodyId);
    } else {
      newVisible.add(bodyId);
    }
    setVisibleBodies(newVisible);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      variant: "success",
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  const formatJson = (jsonString: string) => {
    try {
      return JSON.stringify(JSON.parse(jsonString), null, 2);
    } catch {
      return jsonString;
    }
  };

  const getStatusBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <Badge variant="success">{statusCode}</Badge>;
    } else if (statusCode >= 400 && statusCode < 500) {
      return <Badge variant="warning">{statusCode}</Badge>;
    } else if (statusCode >= 500) {
      return <Badge variant="destructive">{statusCode}</Badge>;
    }
    return <Badge variant="secondary">{statusCode}</Badge>;
  };

  const getResponseTimeBadge = (responseTime: number) => {
    if (responseTime < 1000) {
      return <Badge variant="success">{responseTime}ms</Badge>;
    } else if (responseTime < 3000) {
      return <Badge variant="warning">{responseTime}ms</Badge>;
    }
    return <Badge variant="destructive">{responseTime}ms</Badge>;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Logs</h1>
          <p className="text-muted-foreground">
            Monitor and analyze your API requests and responses
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Success (2xx)</SelectItem>
            <SelectItem value="error">Error (4xx/5xx)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Requests</p>
                <p className="text-2xl font-bold">{totalLogs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <div>
                <p className="text-sm font-medium">Success Rate</p>
                <p className="text-2xl font-bold">
                  {logs.length > 0 ? Math.round((logs.filter(l => l.statusCode >= 200 && l.statusCode < 300).length / logs.length) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-warning" />
              <div>
                <p className="text-sm font-medium">Avg Response Time</p>
                <p className="text-2xl font-bold">
                  {logs.length > 0 ? Math.round(logs.reduce((acc, log) => acc + log.responseTime, 0) / logs.length) : 0}ms
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-sm font-medium">Error Rate</p>
                <p className="text-2xl font-bold">
                  {logs.length > 0 ? Math.round((logs.filter(l => l.statusCode >= 400 || l.errorMessage).length / logs.length) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      <div className="space-y-4">
        <AnimatePresence>
          {logs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card>
                <CardHeader 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => toggleLogExpansion(log.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {expandedLogs.has(log.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{log.method}</Badge>
                        <span className="font-mono text-sm">{log.endpoint}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(log.statusCode)}
                      {getResponseTimeBadge(log.responseTime)}
                      <Badge variant="secondary" className="text-xs">
                        {new Date(log.createdAt).toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                {expandedLogs.has(log.id) && (
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <Separator />
                      
                      {/* Request Body */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium">Request Body</Label>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleBodyVisibility(`req-${log.id}`)}
                            >
                              {visibleBodies.has(`req-${log.id}`) ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(log.requestBody, 'Request body')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="bg-muted rounded-md p-3 font-mono text-xs overflow-auto max-h-40">
                          {visibleBodies.has(`req-${log.id}`) ? (
                            <pre>{formatJson(log.requestBody)}</pre>
                          ) : (
                            <div className="text-muted-foreground">Click eye icon to view request body</div>
                          )}
                        </div>
                      </div>

                      {/* Response Body */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium">Response Body</Label>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleBodyVisibility(`res-${log.id}`)}
                            >
                              {visibleBodies.has(`res-${log.id}`) ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(log.responseBody, 'Response body')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="bg-muted rounded-md p-3 font-mono text-xs overflow-auto max-h-40">
                          {visibleBodies.has(`res-${log.id}`) ? (
                            log.responseBody === "Stream response" ? (
                              <div className="text-muted-foreground italic">Stream response (content not captured)</div>
                            ) : (
                              <pre>{formatJson(log.responseBody)}</pre>
                            )
                          ) : (
                            <div className="text-muted-foreground">Click eye icon to view response body</div>
                          )}
                        </div>
                      </div>

                      {/* Error Message */}
                      {log.errorMessage && (
                        <div>
                          <Label className="text-sm font-medium text-destructive">Error Message</Label>
                          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-sm text-destructive mt-2">
                            {log.errorMessage}
                          </div>
                        </div>
                      )}

                      {/* Additional Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs text-muted-foreground">API Key</Label>
                          <div className="font-mono">{log.apiKey}</div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Response Time</Label>
                          <div>{log.responseTime}ms</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalLogs)} of {totalLogs} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {logs.length === 0 && !loading && (
        <div className="text-center py-12">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No logs found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search terms or filters.' 
              : 'API logs will appear here once you start making requests.'}
          </p>
        </div>
      )}
    </div>
  );
}