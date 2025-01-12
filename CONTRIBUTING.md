# Contributing to Quick Meet

The [Open Source Guides](https://opensource.guide/) website has a collection of resources for individuals, communities, and companies who want to learn how to run and contribute to an open source project. Contributors and people new to open source alike will find the following guides especially useful:

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Building Welcoming Communities](https://opensource.guide/building-community/)

### Triaging Issues and Pull Requests

One great way you can contribute to the project without writing any code is to help triage issues and pull requests as they come in.

- Ask for more information if you believe the issue does not provide all the details required to solve it.
- Suggest [labels](https://github.com/Cefalo/quick-meet/labels) that can help categorize issues.
- Flag issues that are stale or that should be closed.
- Ask for test plans and review code.

## Issues

When [opening a new issue](https://github.com/Cefalo/quick-meet/issues/new/choose), always make sure to fill out the issue template. **This step is very important!** Not doing so may result in your issue not being managed in a timely fashion. Don't take this personally if this happens, and feel free to open a new issue once you've gathered all the information required by the template.

### Bugs

We use [GitHub Issues](https://github.com/Cefalo/quick-meet/issues) for our public bugs. If you would like to report a problem, take a look around and see if someone already opened an issue about it. If you are certain this is a new, unreported bug, you can submit a [bug report](https://github.com/Cefalo/quick-meet/issues/new?assignees=&labels=bug&projects=&template=bug_report.md&title=%5BBUG%5D).

- **One issue, one bug:** Please report a single bug per issue.
- **Provide reproduction steps:** List all the steps necessary to reproduce the issue. The person reading your bug report should be able to follow these steps to reproduce your issue with minimal effort.

## Development

### Installation

1. Copy the `.env.example` file as `.env` file in the `/server/` dir and fill the required keys. _OPTIONAL: Obtain the required OAuth credentials by following this [guide](./README.md#hosting-yourself)_
2. Copy the `.env.example` file as `.env` file in the `/client/` dir. _OPTIONAL: Obtain the REACT_APP_CLIENT_ID ID by following step 1_
3. Run `npm install` from the root dir
4. Run `npm run build`
5. Run both the server and client in-parallel, use: `npm run start:all`

**Note**: If the `VITE_MOCK_CALENDER` is set to `true`, the calender will be mocked, ie, the developer does not need to have access to the OAuth credentials. Every interaction should work as if interacting with a real calender. Check `server/src/google-api/google-api-mock.service.ts` and `server/src/google-api/google-api.module.ts` to learn more on how it works.

#### Installation with Docker

1. Copy the `.env.example` file as `.env` file in the `/server/` dir and fill the required keys. _OPTIONAL: Obtain the required OAuth credentials by following this [guide](./README.md#hosting-yourself)_
2. Copy the `.env.example` file as `.env` file in the `/client/` dir. _OPTIONAL: Obtain the REACT_APP_CLIENT_ID ID by following step 1.
3. Run `npm run start:docker` to start the server and client in-parallel


### Chrome extension

**NOTE:** To test the chrome view without bundling the extension files, is by simply using the query param `chrome=true` in the url, ie- `localhost:3000?chrome=true`

Front end code for both the web and chrome versions are the same, with the `client/src/pages/BaseLayout.tsx` determining the layout based on the `isChromeExt` flag.

1. Copy the `.env.example` file as `.env` file in the `/server/` dir and fill the required keys. _OPTIONAL: Obtain the required OAuth credentials by following this [guide](./README.md#hosting-yourself)_
2. Copy the `.env.example` file as `.env` file in the `/client/` dir. Change `VITE_ENVIRONMENT` to `chrome`.
3. Modify the `client/generate-manifest.js` file to your organization needs if required.
4. [optional] When a chrome extension is built, it creates a unique ID. It's different locally and when you publish it to the chrome web store. Preserving a single ID is essential during development. To keep a consistent ID, follow these steps: [Keep consistent id](https://developer.chrome.com/docs/extensions/how-to/integrate/oauth#keep-consistent-id)
5. Run `npm run build:chrome` from the root dir. This will generate a `manifest.json` file in the `public` folder and bundle the static files in `build_chrome`
6. Go to Chrome extensions from the browser. Enable developer mode and load the `client/build_chrome` folder.
7. Run `npm run start:server` to start the server.

During local development, it is recommended to turn off minification. This can be done in the `client/vite.config.ts` file: 
```json
build: {
  sourcemap: true,
  minify: false,
  cssMinify: false,
},
```

#### Useful tools & documentations

- https://developer.chrome.com/docs/extensions/develop/concepts/storage-and-cookies 
- https://developer.chrome.com/docs/extensions/reference/api/cookies
- https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions#host-permissions 
- https://developer.chrome.com/docs/extensions/develop/concepts/network-requests 
- https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3
- https://chromewebstore.google.com/detail/storage-area-explorer/ocfjjjjhkpapocigimmppepjgfdecjkb 

## Production

### Installation with Docker

You must require the OAuth credentials and an organization account that utilizes google calender resources in order to test it on a real calender.

Note that in production, the client build files are served directly from the server, so only a dedicated server is required.

1. Copy the `.env.example` file as `.env` file in the `/server/` dir and fill the required keys. _OPTIONAL: Obtain the required OAuth credentials by following this [guide](./README.md#hosting-yourself)_
2. Copy the `.env.example` file as `.env` file in the `/client/` dir.
3. Run `./build.production.sh` to start the container. Optionally, an argument indicating the container port can be provided, eg. `./build.production.sh 8080` will expose the app to 8080 (3000 -> 8080) 

### Encryption key

The app uses an encryption service to encrypt the access and refresh tokens (provided by google). It implements AES (Advanced Encryption Standard) encryption to secure sensitive data. Specifically, it uses the `aes-256-cbc` algorithm, which is a symmetric block cipher with the following characteristics:

- 256-bit Key: Ensures a high level of security by requiring a 32-byte key.
- CBC (Cipher Block Chaining) Mode: Enhances security by chaining blocks together, using an Initialization Vector (IV) to ensure randomness.

The encryption service requires a 256-bit (32-byte) key to operate. This key must be securely generated and stored.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

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
│   └── package.json
└── server/
    ├── dist
    ├── src/
    │   ├── auth
    │   ├── calender
    │   ├── google-api
    │   ├── config
    │   ├── helpers
    │   ├── app.controller.ts
    │   ├── app.module.ts
    │   ├── app.service.ts
    │   └── main.ts
    ├── .env
    └── package.json
```

The app uses [npm workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces) with 3 packages: `client`, `server` and `shared`. The `client` is built using **ReactJs** and the `server` is built using **NestJs**. The `shared` dir contains common packages used by both `client` and `server`.

The app does not use any form of databases to persist data. Only an in-memory cache is used to persist the conference rooms which expires every 15 days.

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
