import { OAuth2Client } from 'google-auth-library';
import { Body, Controller, Delete, Get, Post, Put, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { CalenderService } from './calender.service';
import { AuthGuard } from '../auth/auth.guard';
import { _OAuth2Client } from '../auth/decorators';
import { OAuthInterceptor } from '../auth/oauth.interceptor';
import {
  ApiResponse,
  BookRoomDto,
  ListRoomsQueryDto,
  GetAvailableRoomsQueryDto,
  DeleteResponse,
  EventResponse,
  EventUpdateResponse,
  IConferenceRoom,
} from '@quickmeet/shared';
import { createResponse } from 'src/helpers/payload.util';
import { Request } from 'express';

@Controller()
export class CalenderController {
  constructor(private readonly calenderService: CalenderService) {}

  @UseGuards(AuthGuard)
  @UseInterceptors(OAuthInterceptor)
  @Get('/rooms')
  async getEvents(
    @_OAuth2Client() client: OAuth2Client,
    @Req() req: Request,
    @Query() listRoomsQueryDto: ListRoomsQueryDto,
  ): Promise<ApiResponse<EventResponse[]>> {
    const { startTime, endTime, timeZone } = listRoomsQueryDto;
    const domain = (req as Request & { hd?: string }).hd;

    return await this.calenderService.getEvents(client, domain, startTime, endTime, timeZone);
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(OAuthInterceptor)
  @Get('/available-rooms')
  async getAvailableRooms(
    @_OAuth2Client() client: OAuth2Client,
    @Req() req: Request,
    @Query() getAvailableRoomsQueryDto: GetAvailableRoomsQueryDto,
  ): Promise<ApiResponse<IConferenceRoom[]>> {
    const domain = (req as Request & { hd?: string }).hd;
    let { startTime, duration, timeZone, seats, floor, eventId } = getAvailableRoomsQueryDto;

    const startDate = new Date(startTime);
    startDate.setMinutes(startDate.getMinutes() + duration);

    const endTime = startDate.toISOString();
    const rooms = await this.calenderService.getAvailableRooms(client, domain, startTime, endTime, timeZone, seats, floor, eventId);
    return createResponse(rooms);
  }

  @UseGuards(AuthGuard)
  @Get('/highest-seat-count')
  async getMaxSeatCapacity(@_OAuth2Client() client: OAuth2Client, @Req() req: Request): Promise<ApiResponse<number>> {
    const domain = (req as Request & { hd?: string }).hd;

    return await this.calenderService.getHighestSeatCapacity(client, domain);
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(OAuthInterceptor)
  @Post('/room')
  async bookRoom(@_OAuth2Client() client: OAuth2Client, @Req() req: Request, @Body() bookRoomDto: BookRoomDto): Promise<ApiResponse<EventResponse>> {
    const { startTime, duration, createConference, title, attendees, room } = bookRoomDto;
    const domain = (req as Request & { hd?: string }).hd;

    // end time
    const startDate = new Date(startTime);
    startDate.setMinutes(startDate.getMinutes() + duration);
    const endTime = startDate.toISOString();

    const event = await this.calenderService.createEvent(client, domain, startTime, endTime, room, createConference, title, attendees);
    return event;
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(OAuthInterceptor)
  @Put('/room')
  async updateEvent(
    @_OAuth2Client() client: OAuth2Client,
    @Req() req: Request,
    @Body('eventId') eventId: string,
    @Body() bookRoomDto: BookRoomDto,
  ): Promise<ApiResponse<EventUpdateResponse>> {
    const { startTime, duration, createConference, title, attendees, room } = bookRoomDto;
    const domain = (req as Request & { hd?: string }).hd;

    // end time
    const startDate = new Date(startTime);
    startDate.setMinutes(startDate.getMinutes() + duration);
    const endTime = startDate.toISOString();

    return await this.calenderService.updateEvent(client, domain, eventId, startTime, endTime, createConference, title, attendees, room);
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(OAuthInterceptor)
  @Delete('/room')
  async deleteRoom(@_OAuth2Client() client: OAuth2Client, @Query('id') eventId: string): Promise<ApiResponse<DeleteResponse>> {
    return await this.calenderService.deleteEvent(client, eventId);
  }

  @UseGuards(AuthGuard)
  @Get('/floors')
  async listFloors(@_OAuth2Client() client: OAuth2Client, @Req() req: Request): Promise<ApiResponse<string[]>> {
    const domain = (req as Request & { hd?: string }).hd;

    return await this.calenderService.listFloors(client, domain);
  }
}
