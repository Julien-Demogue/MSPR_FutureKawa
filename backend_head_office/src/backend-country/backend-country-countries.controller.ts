import { Controller, Delete, Get, Param, Patch, Post, Req, Res } from '@nestjs/common';
import axios from 'axios';
import { Guard } from '../utils/decorators/guard.decorator';
import { AppRole } from '../utils/constants/roles.constant';
import { country_url, getDefaultHeaders } from '../utils/constants/backend-country.constants';

@Controller("backend_country/countries")
export class BackendCountryCountriesController {
    @Guard(AppRole.USER, AppRole.ADMIN)
    @Get()
    async getCountries(@Res() res) {
        const url = `${country_url}`;
        const response = await axios.get(url, { headers: getDefaultHeaders() });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.ADMIN)
    @Post()
    async createCountry(@Req() req, @Res() res) {
        const url = `${country_url}`;
        const response = await axios.post(url, req.body, { headers: getDefaultHeaders() });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER, AppRole.ADMIN)
    @Get('uuid')
    async getCountryByUuid(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${country_url}uuid?uuid=${uuid}`;
        const response = await axios.get(url, { headers: getDefaultHeaders() });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.USER, AppRole.ADMIN)
    @Get('id')
    async getCountryById(@Req() req, @Res() res) {
        const id = req.query.id;
        const url = `${country_url}id?id=${id}`;
        const response = await axios.get(url, { headers: getDefaultHeaders() });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.ADMIN)
    @Patch()
    async updateCountry(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${country_url}?uuid=${uuid}`;
        const response = await axios.patch(url, req.body, { headers: getDefaultHeaders() });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.ADMIN)
    @Delete()
    async deleteCountry(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${country_url}?uuid=${uuid}`;
        const response = await axios.delete(url, { headers: getDefaultHeaders() });
        return res.status(response.status).json(response.data);
    }
    @Guard(AppRole.ADMIN)
    @Patch('restore')
    async restoreCountry(@Req() req, @Res() res) {
        const uuid = req.query.uuid;
        const url = `${country_url}restore?uuid=${uuid}`;
        const response = await axios.patch(url, {}, { headers: getDefaultHeaders() });
        return res.status(response.status).json(response.data);
    }
}