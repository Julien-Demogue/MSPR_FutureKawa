import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function CommonApiResponses() {
    return applyDecorators(
        ApiResponse({ status: 400, description: 'Invalid parameters.' }),
        ApiResponse({ status: 401, description: 'Unauthorized.' }),
        ApiResponse({ status: 403, description: 'Forbidden.' }),
        ApiResponse({ status: 404, description: 'Resource not found.' }),
        ApiResponse({ status: 500, description: 'Internal server error.' }),
    );
}
