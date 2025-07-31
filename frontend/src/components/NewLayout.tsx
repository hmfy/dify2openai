import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Smartphone,
  Code2,
  History,
  LogOut,
  Menu,
  X,
  User,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

const menuItems = [
  { 
    text: 'Dashboard', 
    icon: LayoutDashboard, 
    path: '/dashboard',
    description: 'Overview & Analytics'
  },
  { 
    text: 'Applications', 
    icon: Smartphone, 
    path: '/apps',
    description: 'Manage Apps'
  },
  { 
    text: 'Examples', 
    icon: Code2, 
    path: '/examples',
    description: 'Code Examples'
  },
  { 
    text: 'Call Logs', 
    icon: History, 
    path: '/logs',
    description: 'API Call History'
  },
];

export default function NewLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-50 h-screen w-72 border-r bg-card/50 backdrop-blur-xl lg:relative lg:z-auto lg:block lg:flex-shrink-0">
        <div className="h-full lg:block">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: sidebarOpen ? 0 : "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 40 }}
            className="h-full lg:!transform-none lg:!translate-x-0"
          >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Code2 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Dify Manager</h1>
                  <p className="text-xs text-muted-foreground">API Gateway</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={closeSidebar}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <Separator />

            {/* Navigation */}
            <nav className="flex-1 space-y-2 p-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <motion.div
                    key={item.path}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start h-auto p-4 text-left",
                        isActive && "bg-primary text-primary-foreground shadow-md"
                      )}
                      onClick={() => {
                        navigate(item.path);
                        closeSidebar();
                      }}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      <div className="flex-1">
                        <div className="font-medium">{item.text}</div>
                        <div className="text-xs opacity-70">{item.description}</div>
                      </div>
                    </Button>
                  </motion.div>
                );
              })}
            </nav>

            <Separator />

            {/* User Section */}
            <div className="p-4">
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.username}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="success" className="text-xs">Online</Badge>
                    </div>
                  </div>
                </div>
                <Separator className="my-3" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </Card>
            </div>
          </div>
          </motion.div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex-1 lg:ml-0 ml-4">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold capitalize">
                  {location.pathname.slice(1) || 'dashboard'}
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="hidden sm:flex">
                v1.0.0
              </Badge>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-7xl"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}