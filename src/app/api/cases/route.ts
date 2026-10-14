import { handleCaseMutation } from '@/lib/caseMutationRoute';
export async function POST(request: Request) { return handleCaseMutation(request); }
