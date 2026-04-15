import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

// Use for GET endpoints (retrieve)
export function ApiFindAllResponses(entity: Function) {
    return applyDecorators(
        ApiResponse({ status: 200, description: `${entity.name} retrieved successfully.` }),
        ApiResponse({ status: 400, description: 'Invalid parameters.' }),
        ApiResponse({ status: 404, description: `${entity.name} not found.` }),
    );
}
