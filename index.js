import express from "express";
import http from "http";

import config from "./config.js";

const app = express();
const port = config.port;

var server = http.createServer(app);


// middle ware
app.use(express.json());

server.listen(port, '0.0.0.0', () => {
    console.log(`Server Started and running on port ${port}`);
});