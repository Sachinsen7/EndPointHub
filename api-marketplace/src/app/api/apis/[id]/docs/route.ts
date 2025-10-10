import { NextRequest, NextResponse } from 'next/server';
import { APIModel } from '@/libs/db/models';
import { ApiError } from '@/libs/utils/error';
import { validateBody } from '@/libs/middleware/validation';
import { authenticateUser, AuthenticatedRequest } from '@/libs/middleware/auth';
import { updateApiSchema } from '@/libs/validations/api';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    const api = await APIModel.findById(id);
    if (!api) throw new ApiError('API not found', 404);

    return NextResponse.json({ docs: api.documentation || {} });
}

async function handlePUT(
    request: AuthenticatedRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const data = (request as any).validatedData;
    const user = request.user;

    const api = await APIModel.findById(id);
    if (!api || api.ownerId !== user.id) {
        throw new ApiError('API not found or unauthorized', 403);
    }

    const updatedApi = await APIModel.update(id, data);

    return NextResponse.json({
        message: 'API updated successfully',
        api: updatedApi,
    });
}

export const PUT = validateBody(updateApiSchema)(authenticateUser(handlePUT));

async function handleDELETE(
    request: AuthenticatedRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const user = request.user;

    const api = await APIModel.findById(id);
    if (!api || api.ownerId !== user.id) {
        throw new ApiError('API not found or unauthorized', 403);
    }

    await APIModel.delete(id);

    return NextResponse.json({ message: 'API deleted successfully' });
}

export const DELETE = authenticateUser(handleDELETE);
