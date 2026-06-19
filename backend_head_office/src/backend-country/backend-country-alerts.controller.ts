import { Controller, Delete, Get, Param, Patch, Post, Req, Res } from '@nestjs/common';
import axios from 'axios';
import { Guard } from '../utils/decorators/guard.decorator';
import { AppRole } from '../utils/constants/roles.constant';
import { alert_url, getDefaultHeaders } from '../utils/constants/backend-country.constants';

@Controller("backend_country/alerts")
export class BackendCountryAlertsController {
    @Guard(AppRole.USER, AppRole.ADMIN, AppRole.SUPERADMIN)
    @Get()
    async getAlerts(@Res() res) {
        const url = `${alert_url}`;
        const response = await axios.get(url, { headers: getDefaultHeaders() });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.ADMIN, AppRole.SUPERADMIN)
    @Post()
    async createAlert(@Req() req, @Res() res) {
        const url = `${alert_url}`;
        const response = await axios.post(url, req.body, { headers: getDefaultHeaders() });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER, AppRole.ADMIN, AppRole.SUPERADMIN)
    @Get('uuid')
    async getAlertByUuid(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${alert_url}uuid?uuid=${uuid}`;
        const response = await axios.get(url, { headers: getDefaultHeaders() });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER, AppRole.ADMIN, AppRole.SUPERADMIN)
    @Get('id')
    async getAlertById(@Req() req, @Res() res) {
        const id = req.query.id;
        const url = `${alert_url}id?id=${id}`;
        const response = await axios.get(url, { headers: getDefaultHeaders() });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.ADMIN, AppRole.SUPERADMIN)
    @Patch()
    async updateAlert(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${alert_url}?uuid=${uuid}`;
        const response = await axios.patch(url, req.body, { headers: getDefaultHeaders() });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.ADMIN, AppRole.SUPERADMIN)
    @Delete()
    async deleteAlert(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${alert_url}?uuid=${uuid}`;
        const response = await axios.delete(url, { headers: getDefaultHeaders() });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.ADMIN, AppRole.SUPERADMIN)
    @Patch('restore')
    async restoreAlert(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${alert_url}restore?uuid=${uuid}`;
        const response = await axios.patch(url, {}, { headers: getDefaultHeaders() });
        return res.status(response.status).json(response.data);
    }
}