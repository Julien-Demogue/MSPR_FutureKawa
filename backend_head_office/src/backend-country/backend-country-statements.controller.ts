import { Controller, Delete, Get, Param, Patch, Post, Req, Res } from '@nestjs/common';
import axios from 'axios';
import { Guard } from '../utils/decorators/guard.decorator';
import { AppRole } from '../utils/constants/roles.constant';
import { statement_url, default_headers } from '../utils/constants/backend-country.constants';

@Controller("backend_country/statements")
export class BackendCountryStatementsController {
    @Guard(AppRole.USER, AppRole.ADMIN, AppRole.SUPERADMIN)
    @Get()
    async getStatements(@Res() res) {
        const url = `${statement_url}`;
        const response = await axios.get(url, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER, AppRole.ADMIN, AppRole.SUPERADMIN)
    @Post()
    async createStatement(@Req() req, @Res() res) {
        const url = `${statement_url}`;
        const response = await axios.post(url, req.body, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER, AppRole.ADMIN, AppRole.SUPERADMIN)
    @Get('uuid')
    async getStatementByUuid(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${statement_url}uuid?uuid=${uuid}`;
        const response = await axios.get(url, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER, AppRole.ADMIN, AppRole.SUPERADMIN)
    @Get('id')
    async getStatementById(@Req() req, @Res() res) {
        const id = req.query.id;
        const url = `${statement_url}id?id=${id}`;
        const response = await axios.get(url, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.ADMIN, AppRole.SUPERADMIN)
    @Patch()
    async updateStatement(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${statement_url}?uuid=${uuid}`;
        const response = await axios.patch(url, req.body, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.ADMIN, AppRole.SUPERADMIN)
    @Delete()
    async deleteStatement(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${statement_url}?uuid=${uuid}`;
        const response = await axios.delete(url, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.ADMIN, AppRole.SUPERADMIN)
    @Patch('restore')
    async restoreStatement(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${statement_url}restore?uuid=${uuid}`;
        const response = await axios.patch(url, {}, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
}