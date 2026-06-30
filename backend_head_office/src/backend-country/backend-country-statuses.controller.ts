import { Controller, Delete, Get, Param, Patch, Post, Req, Res } from '@nestjs/common';
import axios from 'axios';
import { Guard } from '../utils/decorators/guard.decorator';
import { AppRole } from '../utils/constants/roles.constant';
import { status_url, getDefaultHeaders } from '../utils/constants/backend-country.constants';

@Controller("backend_country/statuses")
export class BackendCountryStatusesController {
    @Guard(AppRole.USER, AppRole.ADMIN)
    @Get()
    async getStatuses(@Res() res) {
        const url = `${status_url}`;
        const response = await axios.get(url, { headers: getDefaultHeaders() });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.ADMIN)
    @Post()
    async createStatus(@Req() req, @Res() res) {
        const url = `${status_url}`;
        const response = await axios.post(url, req.body, { headers: getDefaultHeaders() });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER, AppRole.ADMIN)
    @Get('uuid')
    async getStatusByUuid(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${status_url}uuid?uuid=${uuid}`;
        const response = await axios.get(url, { headers: getDefaultHeaders() });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER, AppRole.ADMIN)
    @Get('id')
    async getStatusById(@Req() req, @Res() res) {
        const id = req.query.id;
        const url = `${status_url}id?id=${id}`;
        const response = await axios.get(url, { headers: getDefaultHeaders() });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER, AppRole.ADMIN)
    @Get('value')
    async getStatusesByValue(@Req() req, @Res() res) {
        const value = req.query.value;
        const url = `${status_url}value?value=${value}`;
        const response = await axios.get(url, { headers: getDefaultHeaders() });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.ADMIN)
    @Patch()
    async updateStatus(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${status_url}?uuid=${uuid}`;
        const response = await axios.patch(url, req.body, { headers: getDefaultHeaders() });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.ADMIN)
    @Delete()
    async deleteStatus(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${status_url}?uuid=${uuid}`;
        const response = await axios.delete(url, { headers: getDefaultHeaders() });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.ADMIN)
    @Patch('restore')
    async restoreStatus(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${status_url}restore?uuid=${uuid}`;
        const response = await axios.patch(url, {}, { headers: getDefaultHeaders() });
        return res.status(response.status).json(response.data);
    }
}