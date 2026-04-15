import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

// Use for DELETE endpoints
export function ApiDeleteResponses(entity: Function) {
    return applyDecorators(
        ApiResponse({ status: 204, description: `${entity.name} deleted successfully.` }),
    );
}