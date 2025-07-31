import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Code2,
  Copy,
  CheckCircle,
  Terminal,
  Globe,
  Smartphone,
  Zap,
  Book,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface CodeExample {
  id: string;
  title: string;
  description: string;
  language: string;
  category: 'curl' | 'javascript' | 'python' | 'node';
  code: string;
  icon: React.ReactNode;
}

const examples: CodeExample[] = [
  {
    id: '1',
    title: 'cURL Request',
    description: 'Basic API call using cURL command line tool',
    language: 'bash',
    category: 'curl',
    icon: <Terminal className="h-5 w-5" />,
    code: `curl -X POST "${window.location.protocol}//${window.location.host}/v1/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_OPENAI_API_KEY" \\
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {
        "role": "user",
        "content": "Hello, how are you?"
      }
    ],
    "max_tokens": 100,
    "temperature": 0.7
  }'`
  },
  {
    id: '2',
    title: 'JavaScript Fetch',
    description: 'Making API calls from web applications',
    language: 'javascript',
    category: 'javascript',
    icon: <Globe className="h-5 w-5" />,
    code: `const response = await fetch('${window.location.protocol}//${window.location.host}/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_OPENAI_API_KEY'
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'user',
        content: 'Hello, how are you?'
      }
    ],
    max_tokens: 100,
    temperature: 0.7
  })
});

const data = await response.json();
console.log(data);`
  },
  {
    id: '3',
    title: 'Python Requests',
    description: 'Python implementation using requests library',
    language: 'python',
    category: 'python',
    icon: <Code2 className="h-5 w-5" />,
    code: `import requests
import json

url = "${window.location.protocol}//${window.location.host}/v1/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_OPENAI_API_KEY"
}

data = {
    "model": "gpt-3.5-turbo",
    "messages": [
        {
            "role": "user",
            "content": "Hello, how are you?"
        }
    ],
    "max_tokens": 100,
    "temperature": 0.7
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(result)`
  },
  {
    id: '4',
    title: 'Node.js Axios',
    description: 'Server-side implementation using Axios',
    language: 'javascript',
    category: 'node',
    icon: <Smartphone className="h-5 w-5" />,
    code: `const axios = require('axios');

const makeRequest = async () => {
  try {
    const response = await axios.post('${window.location.protocol}//${window.location.host}/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Hello, how are you?'
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_OPENAI_API_KEY'
      }
    });
    
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

makeRequest();`
  }
];

const categoryColors = {
  curl: 'bg-blue-500/10 text-blue-600 border-blue-200',
  javascript: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
  python: 'bg-green-500/10 text-green-600 border-green-200',
  node: 'bg-purple-500/10 text-purple-600 border-purple-200',
};

const categoryLabels = {
  curl: 'cURL',
  javascript: 'JavaScript',
  python: 'Python',
  node: 'Node.js',
};

export default function NewExamples() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      toast({
        variant: "success",
        title: "Copied!",
        description: "Code example copied to clipboard.",
      });
      
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy code to clipboard.",
      });
    }
  };

  const filteredExamples = selectedCategory === 'all' 
    ? examples 
    : examples.filter(example => example.category === selectedCategory);

  const categories = ['all', ...Array.from(new Set(examples.map(e => e.category)))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Code Examples</h1>
            <p className="text-muted-foreground">
              Ready-to-use code snippets for integrating with the Dify Manager API
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-2">
              <Book className="h-3 w-3" />
              API Documentation
            </Badge>
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              View Docs
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-wrap gap-2"
      >
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="capitalize"
          >
            {category === 'all' ? 'All Examples' : categoryLabels[category as keyof typeof categoryLabels]}
          </Button>
        ))}
      </motion.div>

      {/* Quick Start Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Zap className="h-5 w-5" />
              Quick Start Guide
            </CardTitle>
            <CardDescription>
              Follow these steps to get started with the Dify Manager API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Create Application</h4>
                  <p className="text-sm text-muted-foreground">
                    Register your Dify app to get API keys
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Get API Key</h4>
                  <p className="text-sm text-muted-foreground">
                    Copy your OpenAI-compatible API key
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Make Requests</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the examples below to integrate
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Examples Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="grid gap-6 lg:grid-cols-2"
      >
        {filteredExamples.map((example, index) => (
          <motion.div
            key={example.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
            whileHover={{ scale: 1.01 }}
            className="h-full"
          >
            <Card className="h-full transition-all duration-200 hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {example.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{example.title}</CardTitle>
                      <CardDescription>{example.description}</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={categoryColors[example.category]}
                  >
                    {categoryLabels[example.category]}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <Separator />
                
                {/* Code Block */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {example.language}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-2"
                      onClick={() => copyToClipboard(example.code, example.id)}
                    >
                      {copiedId === example.id ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-success" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="relative rounded-lg bg-muted p-4 overflow-x-auto">
                    <pre className="text-sm">
                      <code className="language-javascript">{example.code}</code>
                    </pre>
                  </div>
                </div>

                {/* Usage Notes */}
                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <strong>Note:</strong> Replace <code className="bg-background px-1 rounded">YOUR_OPENAI_API_KEY</code> with your actual API key from the Applications page.
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {filteredExamples.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Code2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No examples found</h3>
          <p className="text-muted-foreground mb-4">
            Try selecting a different category to see more examples.
          </p>
          <Button onClick={() => setSelectedCategory('all')} variant="outline">
            Show All Examples
          </Button>
        </motion.div>
      )}

      {/* Additional Resources */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5 text-primary" />
              Additional Resources
            </CardTitle>
            <CardDescription>
              Helpful links and documentation for developers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-medium">Documentation</h4>
                <div className="space-y-2 text-sm">
                  <a href="#" className="flex items-center gap-2 text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" />
                    API Reference
                  </a>
                  <a href="#" className="flex items-center gap-2 text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" />
                    Authentication Guide
                  </a>
                  <a href="#" className="flex items-center gap-2 text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" />
                    Rate Limiting
                  </a>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Support</h4>
                <div className="space-y-2 text-sm">
                  <a href="#" className="flex items-center gap-2 text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" />
                    GitHub Repository
                  </a>
                  <a href="#" className="flex items-center gap-2 text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" />
                    Issue Tracker
                  </a>
                  <a href="#" className="flex items-center gap-2 text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" />
                    Community Forum
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}