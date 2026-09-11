import { login, AuthError } from '@/lib/auth';
import { BadRequest, body, route } from '@/lib/api';

export async function POST(req: Request) {
  return route(async () => {
    const { name, password } = await body<{ name?: string; password?: string }>(req);
    if (!name || !password) throw new BadRequest('name and password are required');
    const user = await login(name.trim().toLowerCase(), password);
    // Deliberately one message for both "no such user" and "wrong password".
    if (!user) throw new AuthError('That name and password do not match.');
    return { user };
  });
}
