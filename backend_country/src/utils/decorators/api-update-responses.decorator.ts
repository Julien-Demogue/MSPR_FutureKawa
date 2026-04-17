import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

// Use for PATCH/PUT endpoints (update)
export function ApiUpdateResponses(entity: Function) {
    return applyDecorators(
        ApiResponse({ status: 200, description: `${entity.name} updated successfully.` }),
        ApiResponse({ status: 400, description: 'Invalid parameters.' }),
        ApiResponse({ status: 404, description: `${entity.name} not found.` }),
    );
}
