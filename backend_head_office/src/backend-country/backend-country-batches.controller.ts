import { Controller, Delete, Get, Param, Patch, Post, Req, Res } from '@nestjs/common';
import axios from 'axios';
import { Guard } from '../utils/decorators/guard.decorator';
import { AppRole } from '../utils/constants/roles.constant';
import { batch_url, default_headers } from '../utils/constants/backend-country.constants';

// BATCHES
@Controller("backend_country/batches")
export class BackendCountryBatchesController {
    @Guard(AppRole.USER, AppRole.ADMIN, AppRole.SUPERADMIN)
    @Get()
    async getBatches(@Res() res) {
        const url = `${batch_url}`;
        const response = await axios.get(url, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER, AppRole.ADMIN, AppRole.SUPERADMIN)
    @Post()
    async createBatch(@Req() req, @Res() res) {
        const url = `${batch_url}`;
        const response = await axios.post(url, req.body, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER, AppRole.ADMIN, AppRole.SUPERADMIN)
    @Get('uuid')
    async getBatchByUuid(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${batch_url}uuid?uuid=${uuid}`;
        const response = await axios.get(url, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER, AppRole.ADMIN, AppRole.SUPERADMIN)
    @Get('id')
    async getBatchById(@Req() req, @Res() res) {
        const id = req.query.id;
        const url = `${batch_url}id?id=${id}`;
        const response = await axios.get(url, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER, AppRole.ADMIN, AppRole.SUPERADMIN)
    @Patch()
    async updateBatch(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${batch_url}?uuid=${uuid}`;
        const response = await axios.patch(url, req.body, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER, AppRole.ADMIN, AppRole.SUPERADMIN)
    @Delete()
    async deleteBatch(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${batch_url}?uuid=${uuid}`;
        const response = await axios.delete(url, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER, AppRole.ADMIN, AppRole.SUPERADMIN)
    @Patch('restore')
    async restoreBatch(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${batch_url}restore?uuid=${uuid}`;
        const response = await axios.patch(url, {}, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
}