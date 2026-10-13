import { verifyToken, getAuthToken } from './auth';

export async function getSession(req?: Request) {
  const token = await getAuthToken(req, 'auth_token');

  if (!token) return null;

  const payload = verifyToken(token);
  return payload as { id: string; employeeId: string; name: string; role: string } | null;
}

export async function getStudentSession(req?: Request) {
  const token = await getAuthToken(req, 'student_token');

  if (!token) return null;

  const payload = verifyToken(token);
  return payload as { id: string; phone: string; name: string; role: string } | null;
}

