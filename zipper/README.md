## ZIPPER

Read BTC blocks from local Bitcoin full node, prune them for unused data and store them compressed on disk. 
Compressed blocks can be served by a web server like Nginx or Apache to be read distantly by the wallet explorer indexer.

#### Usage

- `npm install`
- set BTC client RPC username and password in .env file
- `node start.js`

By default, blocks are placed in `blocks/` folder.