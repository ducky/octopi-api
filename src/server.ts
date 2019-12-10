require('dotenv').config();

import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import { PORT } from './config';
import baseController from './controllers/base';

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use('/', baseController);

app.listen(PORT, () => {
  console.log(`App is running at http://localhost:${PORT}`);
});
