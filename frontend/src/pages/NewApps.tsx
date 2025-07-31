import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
  Smartphone,
  Key,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { appsAPI } from '../services/api';

interface DifyApp {
  id: string;
  name: string;
  description: string;
  difyApiUrl: string;
  difyApiKey: string;
  generatedApiKey: string;
  botType: string;
  inputVariable: string;
  outputVariable: string;
  modelName: string;
  isEnabled: boolean;
  openaiApiKey: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  callCount: number;
}

interface AppFormData {
  name: string;
  description: string;
  difyApiUrl: string;
  difyApiKey: string;
  botType: string;
  inputVariable: string;
  outputVariable: string;
  modelName: string;
  isEnabled: boolean;
}

export default function NewApps() {
  const [apps, setApps] = useState<DifyApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingApp, setEditingApp] = useState<DifyApp | null>(null);
  const [deleteApp, setDeleteApp] = useState<DifyApp | null>(null);
  const [formData, setFormData] = useState<AppFormData>({
    name: '',
    description: '',
    difyApiUrl: '',
    difyApiKey: '',
    botType: 'Chat',
    inputVariable: '',
    outputVariable: '',
    modelName: '',
    isEnabled: true,
  });
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const response = await appsAPI.getAll();
      setApps(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch applications.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.difyApiUrl || !formData.difyApiKey || !formData.modelName) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields.",
      });
      return;
    }

    try {
      if (editingApp) {
        await appsAPI.update(editingApp.id, formData);
        toast({
          variant: "success",
          title: "Success",
          description: "Application updated successfully.",
        });
      } else {
        await appsAPI.create(formData);
        toast({
          variant: "success",
          title: "Success",
          description: "Application created successfully.",
        });
      }
      
      resetForm();
      fetchApps();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save application.",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteApp) return;

    try {
      await appsAPI.delete(deleteApp.id);
      toast({
        variant: "success",
        title: "Success",
        description: "Application deleted successfully.",
      });
      setDeleteApp(null);
      fetchApps();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete application.",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      difyApiUrl: '',
      difyApiKey: '',
      botType: 'Chat',
      inputVariable: '',
      outputVariable: '',
      modelName: '',
      isEnabled: true,
    });
    setEditingApp(null);
    setShowForm(false);
  };

  const startEdit = (app: DifyApp) => {
    setFormData({
      name: app.name,
      description: app.description,
      difyApiUrl: app.difyApiUrl || '',
      difyApiKey: app.difyApiKey,
      botType: app.botType || 'Chat',
      inputVariable: app.inputVariable || '',
      outputVariable: app.outputVariable || '',
      modelName: app.modelName || '',
      isEnabled: app.isEnabled !== undefined ? app.isEnabled : true,
    });
    setEditingApp(app);
    setShowForm(true);
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      // Try modern clipboard API first (HTTPS/localhost)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for HTTP environments
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      toast({
        variant: "success",
        title: "Copied!",
        description: `${label} copied to clipboard.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Unable to copy to clipboard. Please copy manually.",
      });
    }
  };

  const toggleAppEnabled = async (app: DifyApp) => {
    try {
      await appsAPI.update(app.id, { ...app, isEnabled: !app.isEnabled });
      toast({
        variant: "success",
        title: "Success",
        description: `Application ${!app.isEnabled ? 'enabled' : 'disabled'} successfully.`,
      });
      fetchApps();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update application status.",
      });
    }
  };

  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (app: DifyApp) => {
    if (app.isEnabled) {
      return <Badge variant="success">Enabled</Badge>;
    }
    return <Badge variant="secondary">Disabled</Badge>;
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
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground">
            Manage your Dify applications and API keys
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Application
        </Button>
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="relative max-w-md"
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search applications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </motion.div>

      {/* Apps Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence>
          {filteredApps.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="h-full"
            >
              <Card className="h-full transition-all duration-200 hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Smartphone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{app.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {app.description || 'No description'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`enabled-${app.id}`} className="text-xs text-muted-foreground">
                          {app.isEnabled ? 'Enabled' : 'Disabled'}
                        </Label>
                        <Switch
                          id={`enabled-${app.id}`}
                          checked={app.isEnabled}
                          onCheckedChange={() => toggleAppEnabled(app)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => startEdit(app)}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Model Name */}
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Model Name
                    </Label>
                    <div className="mt-1 p-2 bg-muted rounded-md text-sm">
                      {app.modelName || 'Not set'}
                    </div>
                  </div>

                  {/* API Keys */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        OPEN API Key
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 p-2 bg-muted rounded-md font-mono text-xs overflow-hidden" style={{ minWidth: '200px' }}>
                          <div className="truncate">
                            {visibleKeys.has(app.id) 
                              ? app.generatedApiKey 
                              : '••••••••••••••••••••••••••••••••'
                            }
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleKeyVisibility(app.id)}
                        >
                          {visibleKeys.has(app.id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => copyToClipboard(app.generatedApiKey, 'Dify API Key')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        API URL
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 p-2 bg-muted rounded-md font-mono text-sm">
                          {`${window.location.protocol}//${window.location.host}/v1/chat/completions`}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => copyToClipboard(`${window.location.protocol}//${window.location.host}/v1/chat/completions`, 'API URL')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <span>{app.callCount || 0} calls</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => startEdit(app)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => setDeleteApp(app)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredApps.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No applications found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first application.'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Application
            </Button>
          )}
        </motion.div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && resetForm()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingApp ? 'Edit Application' : 'Add Application'}
                  </CardTitle>
                  <CardDescription>
                    {editingApp ? 'Update application details' : 'Create a new Dify application'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter application name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Enter description (optional)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="difyApiUrl">Dify API URL *</Label>
                      <Input
                        id="difyApiUrl"
                        value={formData.difyApiUrl}
                        onChange={(e) => setFormData({ ...formData, difyApiUrl: e.target.value })}
                        placeholder="https://api.dify.ai/v1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="difyApiKey">Dify API Key *</Label>
                      <Input
                        id="difyApiKey"
                        value={formData.difyApiKey}
                        onChange={(e) => setFormData({ ...formData, difyApiKey: e.target.value })}
                        placeholder="Enter Dify API key"
                        autoComplete="off"
                        type="password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="modelName">Model Name *</Label>
                      <Input
                        id="modelName"
                        value={formData.modelName}
                        onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                        placeholder="gpt-3.5-turbo, gpt-4, etc."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="botType">Bot Type</Label>
                      <Select
                        value={formData.botType}
                        onValueChange={(value) => setFormData({ ...formData, botType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select bot type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Chat">Chat</SelectItem>
                          <SelectItem value="Completion">Completion</SelectItem>
                          <SelectItem value="Workflow">Workflow</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="inputVariable">Input Variable</Label>
                      <Input
                        id="inputVariable"
                        value={formData.inputVariable}
                        onChange={(e) => setFormData({ ...formData, inputVariable: e.target.value })}
                        placeholder="query, message, etc. (optional)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="outputVariable">Output Variable</Label>
                      <Input
                        id="outputVariable"
                        value={formData.outputVariable}
                        onChange={(e) => setFormData({ ...formData, outputVariable: e.target.value })}
                        placeholder="answer, result, etc. (optional)"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isEnabled"
                        checked={formData.isEnabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
                      />
                      <Label htmlFor="isEnabled">Enable Application</Label>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                        Cancel
                      </Button>
                      <Button type="submit" className="flex-1">
                        {editingApp ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteApp} onOpenChange={() => setDeleteApp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteApp?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}