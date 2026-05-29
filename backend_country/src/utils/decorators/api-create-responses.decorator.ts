import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function ApiCreateResponses(entity: Function) {
    return applyDecorators(
        ApiResponse({
            status: 201,
            description: `The ${entity.name} has been successfully created.`,
        }),
        ApiResponse({ status: 400, description: 'Invalid parameters.' }),
        ApiResponse({ status: 409, description: `${entity.name} already exists.` }),
    );
}
