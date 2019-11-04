This project has 3 parts.

## Client Webapp
Single Page Application made with VueJS. Can be run locally for development with vue-cli then built into a dist folder that is served by Nginx.

## Server
- Based on an Obyte light node, reads state vars and responses from counterstats AA
- Indexes BTC blockchain by wallets and store data in Sqlite DB (SSD is mandatory)
- Processes statistics about exchanges
- Serves rest API for webapp 

## Zipper
It's a proxy that enables running BTC full node on a distant server. It gets blocks in JSON format using Bitcoin-cli RPC and store them on disk ready for counterstats server requests. It is intended to run on a cheap HDD server without slowing the wallet explorer indexation.

#### Nginx conf for webapp and API

```
server {
	listen 80 default_server;
	server_name counterstats.org;

	location /api/ {
		proxy_pass http://localhost:1245;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection 'upgrade';
		proxy_set_header Host $host;
		proxy_cache_bypass $http_upgrade;
	}

	location  / {
		root /home/counterstats-user/counterstats/client/dist/;
		try_files $uri $uri/ @rewrites;
}

```