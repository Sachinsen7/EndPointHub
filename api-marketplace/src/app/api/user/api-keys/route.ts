import { NextRequest, NextResponse } from 'next/server';
import { validateBody } from '@/libs/middleware/validation';
import { authenticateUser } from '@/libs/middleware/auth';
import { apiKeySchema } from '@/libs/validations/apiKey';
import { APIKeyModel } from '@/libs/db/models';
import { generateApiKey, hasApiKey } from '@/libs/utils/crypto';
import { ApiError } from '@/libs/utils/error';
import { Prisma } from '@/generated/prisma';

export const GET = authenticateUser(
    async (request: NextRequest & { user: { id: string } }) => {
        const keys = await APIKeyModel.findByUserId(request.user.id);
        return NextResponse.json({ apiKeys: keys });
    }
);

export const POST = validateBody(apiKeySchema)(
    authenticateUser(
        async (request: NextRequest & { user: { id: string } }) => {
            const data = (request as any).validatedData as Omit<
                Prisma.ApiKeyCreateInput,
                'user' | 'key' | 'keyHash'
            >;
            const user = request.user;

            const apiKey = await APIKeyModel.create(user.id, data);
            return NextResponse.json(
                { message: 'API key created successfully', apiKey },
                { status: 201 }
            );
        }
    )
);
