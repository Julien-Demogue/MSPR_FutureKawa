export const Permissions = {
    USERS_CREATE: 'users:create',
    USERS_READ_ALL: 'users:read.all',
    USERS_READ_ME: 'users:read.me',
    USERS_READ_ONE: 'users:read.one',
    USERS_UPDATE: 'users:update',
    USERS_UPDATE_ME: 'users:update.me',
    USERS_DELETE: 'users:delete',
    USERS_RESTORE: 'users:restore',
}

export const RolesPermissions = {
    SUPERADMIN: [
        Permissions.USERS_CREATE,
        Permissions.USERS_READ_ALL,
        Permissions.USERS_READ_ME,
        Permissions.USERS_READ_ONE,
        Permissions.USERS_UPDATE,
        Permissions.USERS_UPDATE_ME,
        Permissions.USERS_DELETE,
        Permissions.USERS_RESTORE,
    ],

    ADMIN: [
        Permissions.USERS_CREATE,
        Permissions.USERS_READ_ALL,
        Permissions.USERS_READ_ME,
        Permissions.USERS_READ_ONE,
        Permissions.USERS_UPDATE,
        Permissions.USERS_UPDATE_ME,
    ],

    REGULAR: [
        Permissions.USERS_READ_ME,
        Permissions.USERS_UPDATE,
        Permissions.USERS_UPDATE_ME,
    ]
}
