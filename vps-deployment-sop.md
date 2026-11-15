# VPS Deployment SOP — ADDies / appZeno

> **Audience:** an AI agent or engineer deploying to the production VPS.
> **Goal:** ship changes safely, one app at a time, without taking the box down.
> **Last updated:** 2026-10-24

---

## 0. Non-negotiables

1. **Never run two Docker/Next builds at the same time.** The VPS has **2 vCPU, 4 GB RAM, 512 MB swap**. Parallel Next builds have already pushed load average above 50 and rebooted the box.
2. **Deploy from each app's own directory.** There is **no** compose file in `~/projects`; the compose files live in `~/projects/<app>/docker-compose.yml`.
3. **Never run:** `docker system prune -a`, `docker compose down -v`, volume deletion, `git reset --hard`, force-push, or `prisma db push --accept-data-loss` without explicit approval.
4. **Never commit or print secrets.** Admin passwords and `.env` values stay on the server.
5. **Local dev and production share the same MongoDB Atlas database.** Any data created from `localhost` is production data. Do not create test reviews/tickets/users without approval; clean up after testing.
6. **Build one app, verify it, then move to the next.** No "fire and forget" parallel deploys.
7. Prefer `git pull --ff-only`; never leave the server repo in a detached/conflicted state.

---

## 1. Host map

| What | Value |
|---|---|
| SSH | `ssh devops@95.135.166.152` (hostname `production`) |
| Projects root | `~/projects` |
| Caddy / reverse proxy | `~/infra/caddy` (config: `Caddyfile`, compose: `docker-compose.yml`) |
| Docker network | external `web` (all app containers + Caddy join it) |
| Database | MongoDB Atlas `addies.nukkvam.mongodb.net/add` — **same DB locally and in prod** |
| Web app | `~/projects/web` → container `add-web` → `apnidesidukaan.com`, `www.apnidesidukaan.com` |
| Super-admin | `~/projects/super-admin` → container `add-admin` → `admin.apnidesidukaan.com` |
| Vendor | `~/projects/vendor` → `add-vendor` → `vendor.apnidesidukaan.com` |
| API | `~/projects/backend` → `add-api` → `api.apnidesidukaan.com` |
| Service hub | `~/projects/appzeno-service-hub` → `add-service-hub` → `service-hub.apnidesidukaan.com` |
| appZeno web | `~/projects/appZeno-web` → `appzeno-web` → `appzenowebservices.com` |
| Omnipost | `~/projects/Omnipost` → `patra_app` → `omnipost.appzenowebservices.com` |

All compose services use `restart: unless-stopped`; after a reboot everything comes back automatically. Caddy reverse-proxies by container name over the `web` network.

---

## 2. Pre-flight (always do this first)

```bash
ssh devops@95.135.166.152
uptime                 # load average: must be < 2 at rest
nproc                  # 2
free -m                # available must be >= 1500 MB before a build
df -h /                # free disk must be >= 5 GB before a build
docker ps --format '{{.Names}} {{.Status}}'
```

Then in the app directory:

```bash
cd ~/projects/web          # or super-admin, vendor, backend, ...
git fetch origin
git status -sb             # must be clean except known tolerated files
git log -1 --oneline
```

Known tolerated noise (leave untouched):
- `web/oc.md` may show as modified.
- `super-admin/.env.save` may be untracked.

**Stop and fix the environment** if load is high, memory is low, disk is low, or the working tree has unexpected modifications.

If disk is low **before** a build:

```bash
docker builder prune -af
docker image prune -f
df -h /
```

(Older build cache is the usual culprit. Do not remove named volumes.)

---

## 3. Deploy one app

### 3.1 Pull the code

```bash
APP=web                  # web | super-admin | vendor | backend | appZeno-web | appzeno-service-hub | Omnipost
cd ~/projects/$APP
git fetch origin
git status -sb
git pull --ff-only origin master
git log -1 --oneline
docker compose config --services
```

Expected output: one service (usually `web_add`). If more than one appears, stop and inspect before building.

### 3.2 Build + recreate detached

Do **not** hold the SSH session open for the build.

```bash
cd ~/projects/$APP
rm -f /tmp/$APP-build.log
(setsid docker compose up -d --build > /tmp/$APP-build.log 2>&1 < /dev/null &)
sleep 2
tail -5 /tmp/$APP-build.log
```

### 3.3 Monitor with short SSH commands

Poll every 30–60 seconds:

```bash
ssh devops@95.135.166.152 "tail -20 /tmp/$APP-build.log; pgrep -af 'docker compose|next build' | head -3; uptime; free -m | head -2"
```

- Expected build time: ~2–5 minutes per Next app.
- **If SSH drops:** do not assume failure. Wait 30–60 seconds, reconnect, check `pgrep` and the log. The build usually continues.
- **If load climbs above ~10 or SSH becomes laggy:** stop polling, wait 2–3 minutes, do not start another build. The box may reboot; containers come back automatically.
- **If the build failed:** read the log, fix the cause, prune cache if needed, then retry **once**, alone.

### 3.4 Confirm the container

Replace `add-web` with the right container (`add-admin`, `add-vendor`, …).

```bash
docker ps --format '{{.Names}} {{.Image}} {{.Status}}' | grep -E 'add-web|add-admin'
docker logs --tail 30 add-web
docker exec add-web wget -qO /dev/null --server-response http://127.0.0.1:3000/ 2>&1 | head -3
```

Public checks:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://www.apnidesidukaan.com/
curl -s -o /dev/null -w '%{http_code}\n' https://www.apnidesidukaan.com/login
curl -s -o /dev/null -w '%{http_code}\n' https://admin.apnidesidukaan.com/login
```

If Caddy returns `502` after a container recreate, restart Caddy **once**:

```bash
docker restart caddy
```

---

## 4. Deploy order

- **Schema/API changed:** deploy **web first**, run the DB sync if needed, then deploy **super-admin**.
- **Only admin UI changed:** deploy only `super-admin`.
- **Only marketing/vendor changed:** deploy only that app.
- Never deploy web and super-admin simultaneously on this box.

---

## 5. Database changes (Prisma)

The `web` schema is the source of truth. `super-admin/prisma/schema.prisma` must mirror the shared models, but **run `db push` only from the web container**.

After the new `add-web` image is running:

```bash
docker exec add-web npx --yes prisma db push --skip-generate
```

Notes:
- The runtime image does not ship the Prisma CLI as a dependency; `npx --yes` downloads it for this one command. That is expected.
- **Known blocker:** `NewsletterSubscriber.email` can contain duplicates, which makes the unique-index build fail with `E11000`. In that case:
  1. Back up the duplicate documents to JSON first.
  2. Keep one row per email (prefer `confirmed` / most recent).
  3. Delete the rest.
  4. Re-run `db push`.
- Never use `--accept-data-loss` without explicit approval.
- Do not run `db push` from `super-admin`; it can fight the web schema.
- For nullable/missing numeric fields (e.g. `User.loyaltyPoints`), backfill with a small Node script using `$runCommandRaw` and verify before deploying code that reads them.

Verify indexes after a schema change:

```bash
docker exec add-web node -e "const{PrismaClient}=require('@prisma/client');const d=new PrismaClient();d.\$runCommandRaw({listIndexes:'ProductReview'}).then(r=>console.log(JSON.stringify(r.cursor.firstBatch.map(i=>i.name)))).finally(()=>d.\$disconnect())"
```

---

## 6. Caddy changes

Files live in **`~/infra/caddy`**:

- `Caddyfile` — domains and upstreams
- `docker-compose.yml` — runs `caddy` on ports 80/443, joins external `web` network

Edit the config, then **always validate before reloading**:

```bash
cd ~/infra/caddy
cp Caddyfile Caddyfile.bak.$(date +%F-%H%M%S)
# edit Caddyfile
docker exec caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
```

Reload without dropping connections:

```bash
docker exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

If reload fails, the old config stays active — fix the error and retry. Only restart if necessary:

```bash
cd ~/infra/caddy && docker compose up -d
```

Current routes (keep intact unless the user asks):

```text
apnidesidukaan.com / www                 -> add-web:3000
admin.apnidesidukaan.com / www.admin     -> add-admin:3000
vendor.apnidesidukaan.com / www.vendor   -> add-vendor:3000
api.apnidesidukaan.com / www.api         -> add-api:8000
service-hub.apnidesidukaan.com           -> add-service-hub:3000
appzenowebservices.com / www             -> appzeno-web:3000
omnipost.appzenowebservices.com          -> patra_app:9000
```

Pre-existing Caddy log noise (ignore unless asked): ACME retries for `www.admin.apnidesidukaan.com` because that DNS record does not exist. `admin.apnidesidukaan.com` itself works.

---

## 7. Post-deploy verification

- [ ] `docker ps` — target container is `Up`, using the new image.
- [ ] `docker logs --tail 100 <container>` — no new errors.
- [ ] Internal `wget` returns `200`.
- [ ] Public `curl` returns `200` for home/login/product/admin login.
- [ ] For auth changes: guest `/user/*` returns `307 → /login`; logged-in works.
- [ ] For tRPC changes:
  - public endpoint returns `200` (e.g. `review.listByProduct`)
  - protected endpoint returns `401` without a session
  - admin endpoint returns `401` without an admin session
- [ ] Admin UI: log in with the **server's** `ADMIN_EMAIL` / `ADMIN_PASSWORD` (never echo them); check the changed pages load without runtime errors.
- [ ] DB counts/indexes if the schema changed.
- [ ] `uptime`, `free -m`, `df -h /` after the build; prune build cache.
- [ ] Record deployed commit: `git -C ~/projects/<app> log -1 --oneline`.

---

## 8. Rollback

### Code

```bash
cd ~/projects/<app>
git log --oneline -5
git checkout <previous-good-commit>     # or git revert <bad-commit>
docker compose up -d --build
```

Rebuild **one app at a time**, then re-run the verification checklist.

### Database

Changes are additive (collections/indexes/fields). There is no down migration. Do not drop collections/indexes on prod without explicit approval and a backup. Atlas automated backups are the last resort.

### Caddy

```bash
cd ~/infra/caddy
cp Caddyfile.bak.<timestamp> Caddyfile
docker exec caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

### Optional image safety

Before a risky deploy, tag the current image:

```bash
docker tag web-web_add:latest web-web_add:pre-deploy-$(date +%F-%H%M)
```

Rebuilding still uses the compose service name, so a true rollback means checking out the old commit and rebuilding.

---

## 9. Incident runbook (2026-10-24)

**What happened:** the super-admin Docker build ran while the box was already busy; load average hit 50+, SSH became unresponsive, and the VPS rebooted. After it came back, the same build completed in ~3 minutes with load < 5.

**Rules learned:**

1. Run exactly one Next build at a time.
2. Build detached (`setsid … &`) and poll with short SSH commands; never hold a 10-minute SSH build session.
3. Check `uptime`, `free -m`, `df -h /` before every build.
4. Clean build cache when disk drops below ~5 GB free.
5. If the box becomes unresponsive, wait for the provider reboot; `restart: unless-stopped` brings the containers back. Do not hammer SSH.
6. After reboot, confirm `add-web`, `add-admin`, and `caddy` are up before continuing.

---

## 10. Quick reference

```bash
# Deploy web
cd ~/projects/web
git pull --ff-only origin master
(setsid docker compose up -d --build > /tmp/web-build.log 2>&1 < /dev/null &)

# Deploy admin (only after web is verified)
cd ~/projects/super-admin
git pull --ff-only origin master
(setsid docker compose up -d --build > /tmp/super-admin-build.log 2>&1 < /dev/null &)

# Push schema (web only, after add-web is up)
docker exec add-web npx --yes prisma db push --skip-generate

# Verify
docker ps --format '{{.Names}} {{.Image}} {{.Status}}'
docker logs --tail 50 add-web
docker logs --tail 50 add-admin
curl -s -o /dev/null -w '%{http_code}\n' https://www.apnidesidukaan.com/
curl -s -o /dev/null -w '%{http_code}\n' https://admin.apnidesidukaan.com/login
```

**When in doubt: stop, check the logs, and ask the user before doing anything destructive.**
