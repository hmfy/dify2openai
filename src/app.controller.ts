import { Controller, Get, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  @Get('*')
  serveFrontend(@Req() req: Request, @Res() res: Response) {
    const url = req.url;
    
    // Don't serve frontend for API routes, Swagger, or static assets
    if (url.startsWith('/v1/') || 
        url.startsWith('/api/') || 
        url.startsWith('/dify-apps') ||
        url.startsWith('/logs') ||
        url.startsWith('/auth/') ||
        url.includes('.') ||
        url === '/api') {
      // Let other controllers handle these routes
      return res.status(404).json({ message: 'Not Found' });
    }
    
    // Serve the frontend index.html for all other routes (SPA fallback)
    const frontendPath = join(__dirname, '..', 'frontend', 'dist', 'index.html');
    return res.sendFile(frontendPath);
  }
}
