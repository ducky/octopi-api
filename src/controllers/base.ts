import express from 'express';
import * as octoApi from '../lib/octoApi';

const router = express.Router();

router.get('/', async (_, res) => {
  try {
    const printerState = await octoApi.fetchPrinterState();
    const jobState = await octoApi.fetchJobState();
    const files = await octoApi.fetchLocalFiles();

    return res.json({ jobState, printerState, localFiles: files });
  } catch (e) {
    console.error(e);
    return res.status(500).send(e.message);
  }
});

router.get('/stats', async (_, res) => {
  try {
    const jobState = await octoApi.fetchJobState();
    return res.json(jobState);
  } catch (e) {
    console.error(e);
    return res.status(500).send(e.message);
  }
});

router.get('/files', async (_, res) => {
  try {
    const files = await octoApi.fetchLocalFiles();
    return res.json({ files });
  } catch (e) {
    console.error(e);
    return res.status(500).send(e.message);
  }
});

router.get('/files/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    if (!filename) return res.status(422).send('Invalid Filename');

    const file = await octoApi.fetchLocalFile(filename);
    res.status(200).json({ file });
  } catch (e) {
    console.error(e);
    return res.status(500).send(e.message);
  }
});

router.post('/print_file', async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(422).send('Invalid Filename');

    const { file } = await octoApi.printFile(filename);
    res.status(200).json({ file });
  } catch (e) {
    console.error(e);
    return res.status(500).send(e.message);
  }
});

export default router;
