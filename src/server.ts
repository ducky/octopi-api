require('dotenv').config();

import * as path from 'path';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';

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
