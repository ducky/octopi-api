import axios from 'axios';

import { API_KEY, OCTO_URL } from '../config';

export default axios.create({
  baseURL: OCTO_URL,
  headers: {
    'X-Api-Key': API_KEY,
    'Content-Type': 'application/json',
  },
});
