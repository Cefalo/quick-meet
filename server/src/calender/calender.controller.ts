import { OAuth2Client } from 'google-auth-library';
import { BadRequestException, Body, Controller, Delete, Get, Post, Put, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { CalenderService } from './calender.service';
import { AuthGuard } from '../auth/auth.guard';
import { _OAuth2Client } from '../auth/decorators';
import { OauthInterceptor } from '../auth/oauth.interceptor';
import {
  ApiResponse,
  BookRoomDto,
  ListRoomsQueryDto,
  GetAvailableRoomsQueryDto,
  DeleteResponse,
  EventResponse,
  EventUpdateResponse,
  IPeopleInformation,
  IAvailableRooms,
} from '@quickmeet/shared';
import { createResponse } from 'src/helpers/payload.util';
import { _Request } from 'src/auth/interfaces';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@Controller('api')
export class CalenderController {
  constructor(private readonly calenderService: CalenderService) {}

  @UseGuards(AuthGuard)
  @UseInterceptors(OauthInterceptor)
  @Get('/events')
  async getEvents(
    @_OAuth2Client() client: OAuth2Client,
    @Req() req: _Request,
    @Query() listRoomsQueryDto: ListRoomsQueryDto,
  ): Promise<ApiResponse<EventResponse[]>> {
    const { startTime, endTime, timeZone } = listRoomsQueryDto;
    const userEmail = req.email;

    const events = await this.calenderService.getEvents(client, startTime, endTime, timeZone, userEmail);
    return createResponse(events);
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(OauthInterceptor)
  @Get('/rooms/available')
  async getAvailableRooms(
    @_OAuth2Client() client: OAuth2Client,
    @Query() getAvailableRoomsQueryDto: GetAvailableRoomsQueryDto,
  ): Promise<ApiResponse<IAvailableRooms>> {
    const { startTime, duration, timeZone, seats, floor, eventId } = getAvailableRoomsQueryDto;

    if (!seats && eventId) {
      return createResponse({ others: [], preferred: [] });
    }

    const startDate = new Date(startTime);
    startDate.setMinutes(startDate.getMinutes() + duration);

    const endTime = startDate.toISOString();
    const rooms = await this.calenderService.getAvailableRooms(client, startTime, endTime, timeZone, seats, floor, eventId);
    return createResponse(rooms);
  }

  @SkipThrottle()
  @UseGuards(AuthGuard)
  @Get('/rooms/highest-seat-count')
  async getMaxSeatCapacity(@_OAuth2Client() client: OAuth2Client): Promise<ApiResponse<number>> {
    const count = await this.calenderService.getHighestSeatCapacity(client);
    return createResponse(count);
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(OauthInterceptor)
  @Post('/event')
  async createEvent(@_OAuth2Client() client: OAuth2Client, @Req() req: _Request, @Body() bookRoomDto: BookRoomDto): Promise<ApiResponse<EventResponse>> {
    const { startTime, duration, createConference, title, attendees, room } = bookRoomDto;
    const userEmail = req.email;

    // end time
    const startDate = new Date(startTime);
    startDate.setMinutes(startDate.getMinutes() + duration);
    const endTime = startDate.toISOString();

    const event = await this.calenderService.createEvent(client, startTime, endTime, room, userEmail, createConference, title, attendees);
    return createResponse(event, 'Room has been booked');
  }

  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @UseGuards(AuthGuard)
  @UseInterceptors(OauthInterceptor)
  @Get('/directory/people')
  async searchPeople(@_OAuth2Client() client: OAuth2Client, @Query('email') email: string): Promise<ApiResponse<IPeopleInformation[]>> {
    const peoples = await this.calenderService.searchPeople(client, email);

    return createResponse(peoples);
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(OauthInterceptor)
  @Put('/event')
  async updateEvent(
    @_OAuth2Client() client: OAuth2Client,
    @Req() req: _Request,
    @Body('eventId') eventId: string,
    @Body() bookRoomDto: BookRoomDto,
  ): Promise<ApiResponse<EventUpdateResponse>> {
    const { startTime, duration, createConference, title, attendees, room } = bookRoomDto;
    const userEmail = req.email;

    // end time
    const startDate = new Date(startTime);
    startDate.setMinutes(startDate.getMinutes() + duration);
    const endTime = startDate.toISOString();

    const updatedEvent = await this.calenderService.updateEvent(client, eventId, startTime, endTime, userEmail, room, createConference, title, attendees);
    return createResponse(updatedEvent, 'Event has been updated!');
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(OauthInterceptor)
  @Put('/event/response')
  async updateEventResponse(
    @_OAuth2Client() client: OAuth2Client,
    @Req() req: _Request,
    @Body('eventId') eventId: string,
    @Body('response') response: string,
  ): Promise<ApiResponse<EventUpdateResponse>> {
    const userEmail = req.email;

    if (!response) {
      throw new BadRequestException('No response provided');
    }

    if (!eventId) {
      throw new BadRequestException('No event id provided');
    }

    const updatedEvent = await this.calenderService.updateEventResponse(client, userEmail, eventId, response);
    return createResponse(updatedEvent, 'Event has been updated!');
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(OauthInterceptor)
  @Delete('/event')
  async deleteEvent(@_OAuth2Client() client: OAuth2Client, @Query('id') eventId: string): Promise<ApiResponse<DeleteResponse>> {
    const deleted = await this.calenderService.deleteEvent(client, eventId);

    return createResponse(deleted, 'Event has been deleted');
  }

  @SkipThrottle()
  @UseGuards(AuthGuard)
  @Get('/floors')
  async listFloors(@_OAuth2Client() client: OAuth2Client): Promise<ApiResponse<string[]>> {
    const floors = await this.calenderService.listFloors(client);
    return createResponse(floors);
  }
}
