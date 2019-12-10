import axios from 'axios';

import { API_KEY, OCTO_URL } from '../config';

const api = axios.create({
  baseURL: OCTO_URL,
  headers: {
    'X-Api-Key': API_KEY,
    'Content-Type': 'application/json',
  },
});

type PrinterState = {
  state: string;
  bedTemp: number;
  bedTempTarget: number;
  printerTemp: number;
  printerTempTarget: number;
};

type JobState = {
  durationCurrent: number;
  durationRemaining: number;
  durationPercent: number;
  fileName: string;
  filamentLength: number;
  filamentVolume: number;
};

type File = {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  durationEstimate: number;
};

type FileStat = {
  countFailure: number;
  countSuccess: number;
  lastPrint: string;
  lastPrintSucceeded: boolean;
};

type FileDetail = {
  fileName: string;
  fileSize: number;
  durationEstimate: number;
  fileUrl: string;
  stats: FileStat;
};

type Event = {
  error?: string;
  file?: string;
  success: boolean;
};

export const fetchPrinterState = async (): Promise<PrinterState> => {
  try {
    const { data } = await api.get('/printer');
    const { state, temperature } = data;

    return {
      state: state.text,
      bedTemp: temperature?.bed?.actual,
      bedTempTarget: temperature?.bed?.target,
      printerTemp: temperature?.tool0?.actual,
      printerTempTarget: temperature?.tool0?.target,
    };
  } catch (e) {}
};

export const fetchJobState = async (): Promise<JobState> => {
  try {
    const { data } = await api.get('/job');
    const { job, progress } = data;
    const { file, filament } = job;

    return {
      durationCurrent: progress?.printTime,
      durationRemaining: progress?.printTimeLeft,
      durationPercent: progress?.completion,
      fileName: file,
      filamentLength: filament?.length,
      filamentVolume: filament?.volume,
    };
  } catch (e) {}
};

export const fetchLocalFile = async (filename): Promise<FileDetail> => {
  const { data } = await api.get(`/files/local/${filename}`);
  const { name, size, refs, gcodeAnalysis, print } = data;
  const { estimatedPrintTime } = gcodeAnalysis;

  return {
    durationEstimate: estimatedPrintTime,
    fileName: name,
    fileSize: size,
    fileUrl: refs.download,
    stats: {
      countFailure: print?.failure,
      countSuccess: print?.success,
      lastPrint: print?.last?.date,
      lastPrintSucceeded: print?.last?.success,
    },
  };
};

export const fetchLocalFiles = async (): Promise<Array<File>> => {
  const { data } = await api.get('/files');
  const { files } = data;

  return files.map(file => {
    const { name, refs, size, gcodeAnalysis } = file;
    const { estimatedPrintTime } = gcodeAnalysis;
    return {
      fileName: name,
      fileSize: size,
      fileUrl: refs?.download,
      durationEstimate: estimatedPrintTime,
    };
  });
};

export const printFile = async (fileString): Promise<Event> => {
  const fileName = `${fileString}.gcode`;
  const filePath = `/files/local/${fileName}`;

  const files = await fetchLocalFiles();
  if (!files.find(f => f.fileName === fileName)) {
    throw Error('Local File Not Found');
  }

  const result = await api.post(filePath, {
    command: 'select',
    print: true,
  });

  if (result.status !== 204) {
    throw Error('Failed to print');
  }

  return { success: true, file: filePath };
};
