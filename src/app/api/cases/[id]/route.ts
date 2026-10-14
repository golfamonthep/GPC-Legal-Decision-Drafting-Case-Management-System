import { handleCaseMutation } from '@/lib/caseMutationRoute';
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleCaseMutation(request, (await params).id);
}
