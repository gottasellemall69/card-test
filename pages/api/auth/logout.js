import { apiRoute } from '@/lib/server/http';
import { sessionCookies } from '@/lib/server/session';
export default apiRoute({ methods: ['POST'] }, (req, res) => {
  res.setHeader('Set-Cookie', sessionCookies(null));
  return res.status(200).json({ message: 'Logged out' });
});
