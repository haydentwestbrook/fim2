import { handlers } from '@/lib/auth';

export async function GET(req: Request, ctx: any) {
  return handlers.GET(req, ctx);
}

export async function POST(req: Request, ctx: any) {
  return handlers.POST(req, ctx);
}