# Signalboard — DeployMe React + API demo

Frontend-only React and Vite demo displaying posts and users fetched in the visitor's browser from [JSONPlaceholder](https://jsonplaceholder.typicode.com/). Supports search, author filtering, post details, and simulated post submissions (writes are not persisted by JSONPlaceholder).

## Local development
Requires Node.js 22.15+ (Node 22.x) and npm.

```bash
npm install
npm run dev
```

## Production build

```bash
npm ci
npm run build
```

`dist/` contains the deployable site. No network/API access is needed during the build once dependencies have been provisioned offline.

## DeployMe settings
| Setting | Value |
| --- | --- |
| Root directory | `.` |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| SPA fallback | `false` |

## Manual verification
- Load posts and users, and use search and author filtering.
- Open and close post details using the keyboard.
- Submit a post; confirm the interface discloses that JSONPlaceholder does not persist writes.
- Disable browser network access to verify errors and retries.
- Verify narrow viewport layout and visible keyboard focus.

## Lockfile and publishing
The ZIP does not contain a generated `package-lock.json`, because the npm registry was inaccessible in the packaging environment. The publishing script generates the **real** npm lockfile through npm, runs `npm ci`, verifies the production build, commits the lockfile, and only then pushes. Run it on a machine with npm registry access.

Create an empty GitHub repo named `deployme-signalboard`. In Git Bash, from this extracted folder, run:

```bash
bash publish.sh https://github.com/YOUR_USERNAME/deployme-signalboard.git
```
