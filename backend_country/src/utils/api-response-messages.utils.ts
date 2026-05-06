// Here we define methods to get common api response messages including context that can be applied in severals services.
export class ApiResponseMessages {
    static notFound(entity: Function) {
        return `${entity.name} not found`;
    }

    static alreadyExists(entity: Function, field: string, value: string) {
        return `${entity.name} with ${field} '${value}' already exists`;
    }

    static invalidField(field: string) {
        return `Invalid value for field '${field}'`;
    }

    static internalServerError(entity: Function, error: any) {
        console.error(error);
        return `Internal server error while processing ${entity.name}. 'Error details: ' ${error.message}`;
    }

    static cantRestoreExisting(entity: Function) {
        return `Cannot restore ${entity.name} because it already exists`;
    }
}