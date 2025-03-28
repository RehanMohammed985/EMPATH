
# Next.js Project

This is a Next.js project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Development Server

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### Docker Setup

This project also supports Docker for containerized deployment.

1. Copy the `docker-compose-sample.yml` file and rename it to `docker-compose.yml`.
2. Add your respective environment variables (keys) to the `docker-compose.yml` file.
3. Build and run the container using Docker Compose:

```bash
docker-compose up --build
```
