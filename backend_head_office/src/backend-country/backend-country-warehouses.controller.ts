import { Controller, Delete, Get, Param, Patch, Post, Req, Res } from '@nestjs/common';
import axios from 'axios';
import { Guard } from '../utils/decorators/guard.decorator';
import { AppRole } from '../utils/constants/roles.constant';
import { warehouse_url, default_headers } from '../utils/constants/backend-country.constants';

@Controller("backend_country/warehouses")
export class BackendCountryWarehousesController {
    @Guard(AppRole.USER)
    @Get()
    async getWarehouses(@Res() res) {
        const url = `${warehouse_url}`;
        const response = await axios.get(url, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER)
    @Post()
    async createWarehouse(@Req() req, @Res() res) {
        const url = `${warehouse_url}`;
        const response = await axios.post(url, req.body, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER)
    @Get('uuid')
    async getWarehouseByUuid(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${warehouse_url}uuid?uuid=${uuid}`;
        const response = await axios.get(url, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER)
    @Get('id')
    async getWarehouseById(@Req() req, @Res() res) {
        const id = req.query.id;
        const url = `${warehouse_url}id?id=${id}`;
        const response = await axios.get(url, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER)
    @Patch()
    async updateWarehouse(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${warehouse_url}?uuid=${uuid}`;
        const response = await axios.patch(url, req.body, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER)
    @Delete()
    async deleteWarehouse(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${warehouse_url}?uuid=${uuid}`;
        const response = await axios.delete(url, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER)
    @Patch('restore')
    async restoreWarehouse(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${warehouse_url}restore?uuid=${uuid}`;
        const response = await axios.patch(url, {}, { headers: default_headers });
        return res.status(response.status).json(response.data);
    }
}