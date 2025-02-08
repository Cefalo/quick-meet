  <h1 align="center">
    Quick Meet
    <br />
    <br />
      <img src="https://github.com/user-attachments/assets/89da5746-5754-4ee0-b634-8e4691ae337b" alt="QuickMeet" width="30%">
      <img src="https://github.com/user-attachments/assets/1bf0d7f1-a48c-44fe-8ca9-5a73aababf06" alt="QuickMeet" width="30%">
      <img src="https://github.com/user-attachments/assets/879372b5-7d11-4b03-8896-641657b47a24" alt="QuickMeet" width="30%">
    </a>
  </h1>
</div>

<p align="center">
  <a href="https://github.com/Cefalo/quick-meet/actions/workflows/build.yml"><img src="https://github.com/Cefalo/quick-meet/actions/workflows/build.yml/badge.svg" alt="GitHub Actions status"></a>
  <a href="https://github.com/Cefalo/quick-meet/actions/workflows/deploy.yml"><img src="https://github.com/Cefalo/quick-meet/actions/workflows/deploy.yml/badge.svg" alt="GitHub Actions status"></a>
  <a href="README.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"></a>
  <a href= "https://github.com/prettier/prettier"><img alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg"></a>
  <a href="#license"><img src="https://img.shields.io/github/license/sourcerer-io/hall-of-fame.svg?colorB=ff0000"></a>
</p>

Quick Meet enhances productivity by minimizing the time spent finding and securing meeting rooms in Google calendar, ensuring a smooth workflow for teams and managers.

### Key Features:
- **Quick Meeting Setup**: Book a room in seconds by selecting start time, seat requirements, and an optional floor preference.
- **Extend Overrunning Meetings**: Easily extend the current meeting time if no conflicts exist, or quickly book another room with a single click.
- **Floor-Specific Bookings**: For managers or teams that prefer a specific floor, the tool allows you to specify your floor while booking.
- **Efficient High-Demand Booking**: During peak periods, the tool automatically finds and books the best available room, avoiding manual searching.

### Who is this for?

Quick Meet is specifically tailored for organizations that utilize unique meeting rooms within their **Google Workspace/Calendar**. This includes:

- Corporate Offices: Companies with various specialized meeting spaces that need to streamline room bookings for teams and departments.

- Creative Agencies: Organizations that require unique environments for brainstorming sessions, presentations, and client meetings, ensuring that the right atmosphere is matched with the right room.

- Tech Companies: Businesses that rely on collaborative workspaces and need to efficiently manage the booking of meeting rooms equipped with specific tools and resources.


### Quick Meet vs Google Calendar

#### 1. **Clunky Room Booking**:
Google Calendar may offer room bookings, but finding a suitable room in a large office with specific requirements (like seat capacity or floor preference) can be a pain. You end up scrolling through a bunch of rooms after checking through several dropdowns.

**Quick Meet** solves this by instantly booking the best available room based on your needs—no endless scrolling or guesswork!

#### 2. **Overrunning Meetings? Google Calendar Isn't Built for That**:
If your meeting is running late, extending it on Google Calendar isn't exactly smooth. You'll likely have to go through the hassle of updating the event or manually finding another room when time runs out.

**Quick Meet** has got your back—when your meeting is overrunning, you can either extend the current room’s time (if it’s free) or quickly book a new one without breaking a sweat.

#### 3. **Floor-Specific Booking Is a Nightmare**:
Need a room close to your team or on a specific floor? Google Calendar makes you hunt for room locations manually, wasting time in the process.

**Quick Meet** makes floor-specific booking a breeze. Just input the floor you need, and voilà—a room on that floor is booked for you instantly.

#### 4. **High-Demand Periods Lead to Chaos**:
During peak times, manually searching for a free room on Google Calendar is frustrating. Rooms fill up fast, and you're left scrambling to find an available one.

**Quick Meet** shines here by quickly scanning room availability and securing the best available space, so you're never left without a meeting room, even during the busiest hours.

#### TL;DR: Google Calendar may get the job done, but it's clunky, slow, and inefficient when it comes to room bookings. **Quick Meet** offers a faster, smarter solution tailored to modern office needs, making room scheduling hassle-free.


## Use cases

#### CASE I: Quick Client Meeting Scheduling

> **Scenario**: A team member gets a sudden request to set up a meeting in a conference room.
> 
> **Action**: The team member opens the tool, selects the start time and minimum number of seats required, and optionally chooses a specific floor if needed.
> 
> **Outcome**: A suitable meeting room is booked immediately, saving the hassle of running through a bunch of options from the Google Calendar.

#### CASE II: Overrunning Meeting

> **Scenario**: A team/team member is running a meeting in room X that exceeds the scheduled time, and they need to find another room to continue without interruptions.
> 
> **Action**: The team member opens the tool, and has the option to either increase the time of the current room (if no collisions exist) or quickly book another room with just a click.
> 
> **Outcome**: The system quickly books a room, and the team transitions smoothly without the hassle of manually browsing for room availability.

#### CASE III: Floor-Specific Room Requirement

> **Scenario**: A manager prefers to book rooms on a particular floor to maintain proximity to their team.
> 
> **Action**: The manager uses the tool, inputs the necessary seats, and specifies the floor.
> 
> **Outcome**: The tool books a room on the specified floor, optimizing convenience for the manager and their team.

#### CASE IV: Booking During a High-Demand Period

> **Scenario**: During a peak time, meeting rooms are in high demand. Manually searching for a room would take time.
> 
> **Action**: The user enters their seat requirements and the start time. The tool searches and books the best available room.
> 
> **Outcome**: A room is secured swiftly, even in high-demand periods, preventing frustration and delays.

## Hosting yourself

1. [Fork](https://github.com/Cefalo/quick-meet/fork) the repository.
2. Create a branch and integrate your own GitHub actions or webhooks to add a seamless CI/CD pipeline.
3. Set up your environment. [Calender Quickstart](https://developers.google.com/calendar/api/quickstart/js#set_up_your_environment)
4. Add the following scopes to the new credential (OAuth web client id): `./auth/userinfo.profile` and `./auth/calendar`
5. Enable the [Admin SDK API](https://console.cloud.google.com/apis/api/admin.googleapis.com/overview). This is required to read the directory resources; refer to `getCalendarResources()`
6. Enable the [People API](https://console.cloud.google.com/apis/api/people.googleapis.com). This is requred to obtain the emails of the people in your organization, used when searching attendees.
7. Copy the **Client ID**, **Client secret** from the OAuth 2.0 Client ID you created in step 1, and place it in the `.env` file.
8. Add the **Authorized javascript origins** and the **Authorized redirect URIs** in your google cloud project. 
9. Check out the [installation](CONTRIBUTING.md/#installation-with-docker-1) section, to prepare the app for launching.
10. Deploy your branch and your ready to start booking! 🎉
11. Make sure to sync latest changes from the upstream repository.

**Note**: The **Authorized javascript origins** should have: 
```bash
web: https://<domain>
```
The **Authorized redirect URIs** for the web app should have:
```bash
web: https://<domain>/oauthcallback
```


## Taking app to Production
For your app to be made publicly usable, the Google OAuth credentials needs to be deployed to production which requires several steps and requirements.

Verification requirements can be found [here](https://support.google.com/cloud/answer/13464321?sjid=11123215207226220395-AP)

*Note: The [following](https://support.google.com/cloud/answer/13464323/?sjid=11123215207226220395-AP#exemptions) apps do not need to go through the verification process. So, if you are an organization, you can simply create the credentials as Internal, which is highly recommended.*

### Web version: Deplying to vercel

The application can be easily deployed to Vercel with the following steps:

1. Fork the repository
2. Obtain the required env credentials from the above steps
3. Retrieve your [Vercel Access Token](https://vercel.com/guides/how-do-i-use-a-vercel-api-access-token)
4. Install the [Vercel CLI](https://vercel.com/cli) and run `vercel login`
5. Inside your project folder, run `vercel link` to create a new Vercel project
6. Inside the generated .vercel folder, save the `projectId` and `orgId` from the project.json
7. Add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` as secrets in your github repository settings
9. Add all necessary secrets as per the `deploy.yml` file under `.github/workflows` and push the changes


### Chrome extension: Publishing to chrome web store
In order to publish the extension to chrome web store, the following steps should be followed: 

1. Create a chrome web store developer account: [Register your account](https://developer.chrome.com/docs/webstore/register)
2. [Prepare the account](https://developer.chrome.com/docs/webstore/set-up-account)
3. If you are publishing the extension only for your internal organization, follow this [guide](https://developer.chrome.com/docs/webstore/cws-enterprise/#private-cws)
4. Build the extension bundle by running `npm run build:chrome`. Make sure, the `.env` variables are set accordingly. Finally, zip the files and upload it to the chrome developer console.

**References**:
- [Review process](https://developer.chrome.com/docs/webstore/review-process/)

## Contributing

Read our [contributing guide](https://github.com/Cefalo/quick-meet/blob/develop/CONTRIBUTING.md) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to Quick Meet.


## Reference

- [Google Free busy API](https://developers.google.com/calendar/api/v3/reference/freebusy/query?apix_params=%7B%22resource%22%3A%7B%22timeMin%22%3A%222024-08-27T00%3A00%3A00%2B02%3A00%22%2C%22timeMax%22%3A%222024-09-27T23%3A59%3A59%2B02%3A00%22%2C%22items%22%3A%5B%7B%22id%22%3A%22Ada%20Bit%2010%40resource.calendar.google.com%22%7D%2C%7B%22id%22%3A%22c_1888flqi3ecr4gb0k9armpk8k9ics%40resource.calendar.google.com%22%7D%2C%7B%22id%22%3A%22RESOURCE_ID_3%40resource.calendar.google.com%22%7D%5D%7D%7D)

- [Resources API](https://developers.google.com/admin-sdk/directory/reference/rest/v1/resources.calendars/list?apix_params=%7B%22customer%22%3A%22my_customer%22%2C%22maxResults%22%3A20%7D)

- [Hosting on Azure App Service](https://docs.github.com/en/actions/use-cases-and-examples/deploying/deploying-nodejs-to-azure-app-service)

- [Azure file system](https://github.com/projectkudu/kudu/wiki/Understanding-the-Azure-App-Service-file-system)

- [Chrome extension guide](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world)

- [Chrome extension Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage)

- [Deploying to Digital Ocean](https://docs.digitalocean.com/products/app-platform/how-to/create-apps/)

- [Deplying to Digital Ocean using Github actions](https://docs.digitalocean.com/products/app-platform/how-to/deploy-from-github-actions/)

## License

Quick Meet is [MIT licensed](./LICENSE).
