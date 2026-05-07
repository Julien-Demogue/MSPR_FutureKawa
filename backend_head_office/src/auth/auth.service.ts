import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { compare } from "bcrypt";
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';
import { SettingsService } from '../settings/settings.service';
import { User } from '../users/user.entity';
import { JwtPayload, JwtTokenDto } from '../utils/dto/jwt.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { isNullOrEmpty, isValidEmail } from '../utils/fields-validation.utils';
import { ApiResponseMessages } from '../utils/api-response-messages.utils';
import { AppRole } from '../utils/constants/roles.constant';

@Injectable()
export class AuthService {
  jwtSecret: string;
  accessTokenExp: string;
  refreshTokenExp: string;
  resetPassTokenExp: string;
  verifyEmailTokenExp: string;


  constructor(
    private readonly settings: SettingsService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {
    this.jwtSecret = this.settings.JWT_SECRET;
    this.accessTokenExp = this.settings.ACCESS_TOKEN_EXPIRY;
    this.refreshTokenExp = this.settings.REFRESH_TOKEN_EXPIRY;
    this.verifyEmailTokenExp = this.settings.VERIFY_EMAIL_TOKEN_EXPIRY;
    this.resetPassTokenExp = this.settings.RESET_PASS_TOKEN_EXPIRY;
  }


  /**
 * Registers a new regular user.
 * Creates the user account with default role and language settings.
 * @param params Data required to register the user
 * @returns void
 */
  async registerRegular(params: RegisterDto): Promise<void> {
    if (isNullOrEmpty(params.email) || isNullOrEmpty(params.password)) {
      throw new BadRequestException('Email and password are required');
    }

    if (!isValidEmail(params.email)) {
      throw new BadRequestException(ApiResponseMessages.invalidField('email'));
    }

    // User email should be unique
    const existingUser = await this.userRepo.findOne({ where: { email: params.email.toLowerCase() }, relations: { role: true } });
    if (existingUser) {
      throw new ConflictException('EmailAlreadyExistsError')
    }

    await this.usersService.create({
      email: params.email.toLowerCase(),
      password: params.password,
      role_label: AppRole.USER,
    });
  }


  /**
   * Authenticates a user with email and password credentials
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<Login>} Login object containing user data and JWT tokens
   */
  async login(email: string, password: string): Promise<{ user: User; tokens: JwtTokenDto }> {
    const user = await this.validateUser(email, password);

    const tokens = await this.performLogin(user);

    return { user, tokens };
  }


  /**
 * Logs out a user by invalidating their refresh token.
 * @param uuid UUID of the user to log out
 * @returns void
 */
  async logout(uuid: string): Promise<void> {
    const user = await this.usersService.findOneByUuid(uuid);

    user.refresh_token = "";

    await user.save();
  }

  /**
   * Generates JWT tokens for an authenticated user and updates their login information
   * @param {User} user - The authenticated user entity
   * @returns {Promise<JwtTokenDto>} Object containing access and refresh tokens
   */
  async performLogin(user: User): Promise<JwtTokenDto> {
    const payload: JwtPayload = {
      sub: user.uuid,
      role_label: user.role.label,
    };

    const tokens = await this.getTokens(payload);

    user.refresh_token = tokens.refresh_token;
    user.last_login = new Date();
    await user.save();

    return tokens;
  }

  /**
   * Validates user credentials and checks if the user is allowed to log in
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<User>} The validated user entity
   */
  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findOneByEmail(email.toLowerCase());

    if (!user) {
      throw new Error('EmailNoUserError');
    }

    if (!(await compare(password, user.password))) {
      throw new Error('InvalidPwError');
    }

    return user;
  }

  async refreshTokens(refreshToken: string): Promise<JwtTokenDto> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.jwtSecret,
        }
      );

      const user = await this.usersService.findOneByUuid(payload.sub)

      if (user.refresh_token !== refreshToken) {
        throw new Error('InvalidRefreshTokenError');
      }

      return this.getTokens({
        sub: user.uuid,
        role_label: user.role.label,
      });
    } catch (error) {
      throw new Error('InvalidRefreshTokenError');
    }
  }

  /**
   * Generates both access and refresh tokens for a user
   * @param {JwtPayload} payload - JWT payload containing user information
   * @returns {Promise<JwtTokenDto>} Object containing both access and refresh tokens
   */
  async getTokens(payload: JwtPayload): Promise<JwtTokenDto> {
    const [access_token, refresh_token] = await Promise.all([
      this.getToken(payload, this.accessTokenExp),
      this.getToken(payload, this.refreshTokenExp),
    ]);

    return { access_token, refresh_token };
  }

  /**
   * Generates a single JWT token with specified expiration time
   * @param {JwtPayload} payload - JWT payload containing user information
   * @param {string} expiresIn - Token expiration time
   * @returns {Promise<string>} The generated JWT token
   * @private
   */
  private async getToken(
    payload: JwtPayload,
    expiresIn: string,
  ): Promise<string> {
    const options = {
      secret: this.jwtSecret,
      expiresIn: expiresIn,
    };

    const token = await this.jwtService.signAsync(payload as any, options);

    return token;
  }
}
