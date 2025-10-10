import { NextRequest, NextResponse } from 'next/server';
import { APIModel } from '@/libs/db/models';
import { ApiError } from '@/libs/utils/error';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    const api = await APIModel.findById(id);
    if (!api) throw new ApiError('API not found', 404);

    return NextResponse.json({ docs: api.documentation || {} });
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const body = await request.json();

    const api = await APIModel.findById(id);
    if (!api) throw new ApiError('API not found', 404);

    const updatedApi = await APIModel.update(id, body);
    return NextResponse.json({ message: 'Updated', api: updatedApi });
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    const api = await APIModel.findById(id);
    if (!api) throw new ApiError('API not found', 404);

    await APIModel.delete(id);
    return NextResponse.json({ message: 'Deleted' });
}
