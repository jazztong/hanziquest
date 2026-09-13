import { register } from '@/lib/auth';
import { BadRequest, body, route } from '@/lib/api';

/**
 * Create a student account, and optionally the parent account that watches it.
 *
 * Open registration: anyone with the address can make an account. That is the
 * point - each student keeps their own characters, their own deck and their own
 * score, and nothing they do is visible to anyone else's account. It also means
 * the address is the only thing limiting who signs up, which is why the app
 * tells robots to stay away and why the login route still wants rate limiting.
 */
export async function POST(req: Request) {
  return route(async () => {
    const input = await body<{
      name?: string;
      password?: string;
      parentName?: string;
      parentPassword?: string;
    }>(req);

    if (!input.name || !input.password) throw new BadRequest('name and password are required');

    const user = await register({
      name: input.name,
      password: input.password,
      parentName: input.parentName,
      parentPassword: input.parentPassword,
    });
    return { user };
  });
}
