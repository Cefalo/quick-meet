# Contributing to QuickMeet

The [Open Source Guides](https://opensource.guide/) website has a collection of resources for individuals, communities, and companies who want to learn how to run and contribute to an open source project. Contributors and people new to open source alike will find the following guides especially useful:

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Building Welcoming Communities](https://opensource.guide/building-community/)

### Triaging Issues and Pull Requests

One great way you can contribute to the project without writing any code is to help triage issues and pull requests as they come in.

- Ask for more information if you believe the issue does not provide all the details required to solve it.
- Suggest [labels](https://github.com/Propo41/bookify/labels) that can help categorize issues.
- Flag issues that are stale or that should be closed.
- Ask for test plans and review code.

## Issues

When [opening a new issue](https://github.com/Propo41/bookify/issues/new/choose), always make sure to fill out the issue template. **This step is very important!** Not doing so may result in your issue not being managed in a timely fashion. Don't take this personally if this happens, and feel free to open a new issue once you've gathered all the information required by the template.

### Bugs

We use [GitHub Issues](https://github.com/Propo41/bookify/issues) for our public bugs. If you would like to report a problem, take a look around and see if someone already opened an issue about it. If you are certain this is a new, unreported bug, you can submit a [bug report](https://github.com/Propo41/bookify/issues/new?assignees=&labels=bug&projects=&template=bug_report.md&title=%5BBUG%5D).

- **One issue, one bug:** Please report a single bug per issue.
- **Provide reproduction steps:** List all the steps necessary to reproduce the issue. The person reading your bug report should be able to follow these steps to reproduce your issue with minimal effort.

## Development

### Installation [web]

1. Copy the `.env.example` file as `.env` file in the `/server/` dir and fill the required keys. _OPTIONAL: Obtain the required OAuth credentials by following this [guide](./README.md#hosting-yourself)_
2. Copy the `.env.example` file as `.env` file in the `/client/` dir. _OPTIONAL: Obtain the REACT_APP_CLIENT_ID ID by following step 1_
3. Run `npm install`
4. Run `npm run build`
5. Run `npm run migration:run` to create the migrations
6. Run the server app in development mode using: `npm run start:server`
7. Run the client app in development mode using: `npm run start:client`

**Note**: In _development_ mode, the calender is mocked, ie, the developer does not need to have access to the OAuth credentials. Every interaction should work as if interacting with a real calender. Check `server/src/google-api/google-api-mock.service.ts` and `server/src/google-api/google-api.module.ts` to learn more on how it works.

### Installation [chrome-extension]

To test the chrome view without bundling the extension files, is by simply using the query param `chrome=true` in the url, ie - `localhost:3000?chrome=true`

1. Copy the `.env.example` file as `.env.chrome` file in the `/client` dir and fill the required keys as mentioned earlier.
2. Run `npm run build:chrome`
3. Go to Chrome extensions and load the `client/build_chrome` folder. Note the extension id.
4. Edit the `REACT_APP_REDIRECT_URI` in the `.env.chrome` file to `https://<extension-id>.chromiumapp.org/index.html/oauthcallback
5. Go to you Google cloud project and add/update the Redirect URI to `https://<extension-id>.chromiumapp.org/index.html/oauthcallback`
6. Run `npm run start:server` to start the server.
7. Reload the extension

## Production [without docker]

You must require the OAuth credentials and an organization account that utilizes google calender resources in order to test it on a real calender.

1. Copy the `.env.example` file as `.env` file in the `/server/` dir and fill the required keys. _REQUIRED: Obtain the required OAuth credentials by following this [guide](./README.md#hosting-yourself)_
2. Copy the `.env.example` file as `.env` file in the `/client/` dir. _REQUIRED: Obtain the REACT_APP_CLIENT_ID ID by following step 1_
3. Run `npm install`
4. Run `npm run build`
5. Run `npm run migration:run` to create the migrations
6. Run the server in production mode using: `npm run start`.

**Note**: The server serves the static files, so a dedicated server for the client is not required.

## Production [with docker]

You must require the OAuth credentials and an organization account that utilizes google calender resources in order to test it on a real calender.

1. Copy the `.env.example` file as `.env` file in the root dir and fill the required keys. _REQUIRED: Obtain the required OAuth credentials by following this [guide](./README.md#hosting-yourself)_
2. Run `docker-compose up --build`

**Note**: The server serves the static files, so a dedicated server for the client is not required.

### Project structure

```
├── shared/
│   ├── dist
│   ├── dto
│   ├── interfaces
│   ├── index.ts
│   └── package.json
├── client/
│   ├── build_web
│   ├── public
│   ├── src/
│   │   ├── api
│   │   ├── components
│   │   ├── helpers
│   │   ├── config
│   │   ├── pages
│   │   ├── theme
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── .env
│   ├── .env.chrome
│   └── package.json
└── server/
    ├── dist
    ├── src/
    │   ├── auth
    │   ├── calender
    │   ├── google-api
    │   ├── config
    │   ├── helpers
    │   ├── migrations
    │   ├── app.controller.ts
    │   ├── app.module.ts
    │   ├── app.service.ts
    │   └── main.ts
    ├── .env
    └── package.json
```

The app uses [npm workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces) with 3 packages: `client`, `server` and `shared`. The `client` is built using **ReactJs** and the `server` is built using **NestJs**. The `shared` dir contains common packages used by both `client` and `server`.

An in-memory database (sqlite) has been used as persisting the users data is not really mandatory. Even if the users data is lost, they can continue normally after logging in again. However, previously stored tokens would have to be revoked in that case.

### Commands

```bash
npm run build:chrome # chrome production build
npm run build  # web production build

npm run start:client # start react in dev mode

npm run migration:generate # generates migration files with the code-first-approach based on code changes and current db tables
npm run migration:run # runs all migration scripts in the migrations folder
```

### Notes

<b>React-router URLs don't work when refreshing or writing manually</b>: This issue with React Router occurs because when using a client-side routing library like React Router, the server isn't aware of the routes you've defined in your React app. When you refresh or manually type a URL, the server tries to find a matching file, but it doesn't exist, since all routing is handled by React.

Possible solutions:

1. Use .htaccess (If Using Apache)
2. Static File Hosting Solutions (like Netlify): add a `_redirects` file in your `public/` or `build/` folder:

```
/*    /index.html   200
```

3. Adding a wildcard route when serving the build files

```js
  ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'client', 'build_web'),
      renderPath: '*', //  ensures all routes are redirected to index.html
    }),
```

## Pull Requests

So you have decided to contribute code back to upstream by opening a pull request. You've invested a good chunk of time, and we appreciate it. We will do our best to work with you and get the PR looked at.

Working on your first Pull Request? You can learn how from this free video series:

[**How to Contribute to an Open Source Project on GitHub**](https://egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github)

Please make sure the following is done when submitting a pull request:

1. **Keep your PR small.** Small pull requests (~300 lines of diff) are much easier to review and more likely to get merged. Make sure the PR does only one thing, otherwise please split it.
2. **Use descriptive titles.** It is recommended to follow this [commit message style](#semantic-commit-messages).
3. **Test your changes.** Describe your [**test plan**](#test-plan) in your pull request description.

All pull requests should be opened against the `main` branch.

### Semantic Commit Messages

See how a minor change to your commit message style can make you a better programmer.

Format: `<type>/<subject>`

The various *types* of commits:

- `feat`: a new API or behavior **for the end user**.
- `fix`: a bug fix **for the end user**.
- `docs`: a change to the website or other Markdown documents in our repo.
- `refactor`: a change to production code that leads to no behavior difference, e.g. splitting files, renaming internal variables, improving code style...
- `test`: adding missing tests, refactoring tests; no production code change.
- `chore`: upgrading dependencies, releasing new versions... Chores that are **regularly done** for maintenance purposes.
- `misc`: anything else that doesn't change production code, yet is not `test` or `chore`. e.g. updating GitHub actions workflow.

The *subject* name should be written as "issue-" followed by the issue number, for example: `feat/issue-71: added new button`

### Breaking Changes

When adding a new breaking change, follow this template in your pull request:

```md
### New breaking change here

- **Who does this affect**:
- **How to migrate**:
- **Why make this breaking change**:
- **Severity (number of people affected x effort)**:
```
