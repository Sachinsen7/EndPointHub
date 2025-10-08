import { NextRequest, NextResponse } from 'next/server';
import { validateBody } from '@/libs/middleware/validation';
import { authenticateUser } from '@/libs/middleware/auth';
import { apiKeySchema } from '@/libs/validations/apiKey';
import { APIKeyModel } from '@/libs/db/models';
import { generateApiKey, hasApiKey } from '@/libs/utils/crypto';
import { ApiError } from '@/libs/utils/error';

export const GET = authenticateUser(
    async (request: NextRequest & { user: { id: string } }) => {
        const keys = await APIKeyModel.findByUserId(request.user.id);
        return NextResponse.json({ apiKeys: keys });
    }
);

export const POST = validateBody(apiKeySchema)(
    authenticateUser(
        async (request: NextRequest & { user: { id: string } }) => {
            const data = (request as any).validatedData;
            const user = request.user;

            const key = generateApiKey();
            const keyHash = await hasApiKey(key);

            const apiKey = await APIKeyModel.create({
                ...data,
                key,
                keyHash,
                userId: user.id,
            });

            return NextResponse.json(
                { message: 'API key created successfully', apiKey },
                { status: 201 }
            );
        }
    )
);
