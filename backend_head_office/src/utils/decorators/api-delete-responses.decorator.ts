import { applyDecorators, HttpCode } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function ApiDeleteResponses(entity: Function) {
    return applyDecorators(
        ApiResponse({
            status: 204,
            description: `${entity.name} deleted successfully.`,
        }),
        HttpCode(204),
    );
}
