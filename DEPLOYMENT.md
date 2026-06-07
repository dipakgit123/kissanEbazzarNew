# EC2 Deployment

This repo is set up for a split deployment:

- `frontend` builds a Vite SPA into `frontend/dist`
- `server` runs the API on `127.0.0.1:5000`
- Nginx serves the SPA and proxies `/api` and `/socket.io` to the backend

## 1. Prepare the instance

Install Node.js 20+, Nginx, and either PM2 or systemd.

Use a deploy path such as:

```text
/var/www/animal-ebazar
```

## 2. Configure environment files

Backend:

```bash
cp server/.env.example server/.env
```

Frontend:

```bash
cp frontend/.env.example frontend/.env
```

Recommended values:

- `server/.env`
  - `NODE_ENV=production`
  - `PORT=5000`
  - `FRONTEND_URL=https://your-domain.example.com`
  - `CORS_ORIGINS=https://your-domain.example.com,https://www.your-domain.example.com`
  - `TRUST_PROXY=1`
- `frontend/.env`
  - leave `VITE_API_URL` blank when Nginx serves frontend and API from the same domain

For S3 on EC2, prefer an IAM role. Only set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` if you are not using a role.

## 3. Install dependencies and build

```bash
cd /var/www/animal-ebazar/frontend
npm install
npm run lint
npm run build

cd /var/www/animal-ebazar/server
npm install
npm run db:migrate
```

## 4. Run the backend

PM2:

```bash
cd /var/www/animal-ebazar/server
pm2 start ecosystem.config.cjs
pm2 save
```

systemd:

- copy `server/deploy/animal-ebazar.service` to `/etc/systemd/system/animal-ebazar.service`
- run:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now animal-ebazar
```

## 5. Configure Nginx

ALB / reverse-proxy termination:

- copy `server/nginx.conf` to `/etc/nginx/nginx.conf`

Direct TLS on the instance:

- copy `server/nginx.ssl.example.conf` and replace the domain and certificate paths

Then reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 6. Verify

```bash
curl http://127.0.0.1:5000/health
curl http://your-domain.example.com/health
```

Open the site and confirm:

- frontend loads from Nginx
- login requests hit `/api`
- uploads succeed
- veterinarian email links point to the public domain
