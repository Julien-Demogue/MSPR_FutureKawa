import { Controller, Delete, Get, Param, Patch, Post, Req, Res } from '@nestjs/common';
import axios from 'axios';
import { Guard } from '../utils/decorators/guard.decorator';
import { AppRole } from '../utils/constants/roles.constant';
import { farm_url, default_headers } from '../utils/constants/backend-country.constants';

// FARMS
@Controller("backend_country/farms")
export class BackendCountryFarmsController {
    @Guard(AppRole.USER, AppRole.ADMIN, AppRole.SUPERADMIN)
    @Get()
    async getFarms(@Res() res) {
        const url = `${farm_url}`;
        const response = await axios.get(url, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.ADMIN, AppRole.SUPERADMIN)
    @Post()
    async createFarm(@Req() req, @Res() res) {
        const url = `${farm_url}`;
        const response = await axios.post(url, req.body, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER, AppRole.ADMIN, AppRole.SUPERADMIN)
    @Get('uuid')
    async getFarmByUuid(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${farm_url}uuid?uuid=${uuid}`;
        const response = await axios.get(url, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER, AppRole.ADMIN, AppRole.SUPERADMIN)
    @Get('id')
    async getFarmById(@Req() req, @Res() res) {
        const id = req.query.id;
        const url = `${farm_url}id?id=${id}`;
        const response = await axios.get(url, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.ADMIN, AppRole.SUPERADMIN)
    @Patch()
    async updateFarm(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${farm_url}?uuid=${uuid}`;
        const response = await axios.patch(url, req.body, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.ADMIN, AppRole.SUPERADMIN)
    @Delete()
    async deleteFarm(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${farm_url}?uuid=${uuid}`;
        const response = await axios.delete(url, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.ADMIN, AppRole.SUPERADMIN)
    @Patch('restore')
    async restoreFarm(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${farm_url}restore?uuid=${uuid}`;
        const response = await axios.patch(url, {}, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
}