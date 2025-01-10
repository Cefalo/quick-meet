import { GaxiosError } from 'gaxios';
import {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
  ServiceUnavailableException,
  HttpException,
} from '@nestjs/common';

export class GoogleAPIErrorMapper {
  /**
   *
   * @param err the GaxiosError error instance thrown from the google api requests
   * @param callback an optional callback method to fire for special cases
   */
  static handleError(err: GaxiosError, callback?: (status?: number) => void): void {
    if (err.message === 'No refresh token is set.') {
      throw new UnauthorizedException(`Unauthorized. You might need to refresh your credentials.`);
    }

    if (!err.response) {
      throw new InternalServerErrorException('Network error or no response received');
    }

    const { status, statusText, data } = err.response;

    if (callback) {
      callback(status);
    }

    switch (data?.error) {
      case 'No refresh token is set.':
      case 'invalid_grant':
        throw new UnauthorizedException(`Unauthorized: ${data?.error}. You might need to refresh your credentials.`);
    }

    switch (status) {
      case 400:
        throw new BadRequestException(`Bad Request. Details: ${data?.error || 'Invalid parameters or request body'}`);
      case 401:
        throw new UnauthorizedException(`${statusText}. You might need to refresh your credentials.`);
      case 403:
        throw new ForbiddenException(`${statusText}. Access is denied`);
      case 404:
        throw new NotFoundException(`${statusText}. Resource might not exist.`);
      case 429:
        throw new HttpException(`Oops! You're sending requests a little too quickly. Please wait for a while`, status);
      case 500:
        throw new InternalServerErrorException(`Internal Server Error: ${statusText}. Please try again later.`);
      case 503:
        throw new ServiceUnavailableException(`Service Unavailable: ${statusText}. The server is currently unavailable.`);
      default:
        throw new HttpException(`Error: ${statusText}. Details: ${data?.error || 'An unknown error occurred'}`, status);
    }
  }
}
