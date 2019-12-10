import axios from 'axios';
import moment from 'moment';

import { API_KEY, OCTO_URL, USE_MOCK } from '../config';

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
  durationEstimate: number;
  durationRemaining: number;
  durationPercent: number;
  fileName: string;
  filamentLength: number;
  filamentVolume: number;
  state: string;
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

const REFERENCE = moment();
const REFERENCE_END = moment().add(10, 'm');

const MOCK = {
  jobState: {
    durationCurrent: 60 * 60 * (Math.random() * 2 + 1),
    durationRemaining: 60 * 60 * 0.5 * Math.random() * 1,
    durationPercent: Math.random(),
    fileName: 'BobRoss.stl',
    filamentLength: 95,
    filamentVolume: 455,
  },
  printerState: {
    state: 'Printing',
    bedTemp: 95,
    bedTempTarget: 105,
    printerTemp: 200,
    printerTempTarget: 205,
  },
  fileSingle: {
    durationEstimate: 60 * 60 * 1.5,
    fileName: 'BobRoss.stl',
    fileSize: 234888,
    fileUrl: '',
    stats: {
      countFailure: 0,
      countSuccess: 0,
      lastPrint: new Date().toISOString(),
      lastPrintSucceeded: true,
    },
  },
  fileMultiple: [
    {
      fileName: 'BobRoss.stl',
      fileSize: 234234,
      fileUrl: '',
      durationEstimate: 60 * 60 * 1.25,
    },
    {
      fileName: 'JimBob.stl',
      fileSize: 234234,
      fileUrl: '',
      durationEstimate: 60 * 60 * 1.25,
    },
    {
      fileName: 'Ducky.stl',
      fileSize: 234234,
      fileUrl: '',
      durationEstimate: 60 * 60 * 1.25,
    },
  ],
};

export const fetchPrinterState = async (): Promise<PrinterState> => {
  if (USE_MOCK) return MOCK.printerState;

  const { data } = await api.get('/printer');
  const { state, temperature } = data;

  return {
    state: state.text,
    bedTemp: temperature?.bed?.actual,
    bedTempTarget: temperature?.bed?.target,
    printerTemp: temperature?.tool0?.actual,
    printerTempTarget: temperature?.tool0?.target,
  };
};

export const fetchJobState = async (): Promise<JobState> => {
  if (USE_MOCK) {
    return {
      durationCurrent: moment().diff(REFERENCE, 'ms'),
      durationEstimate: REFERENCE_END.diff(REFERENCE, 'ms'),
      durationPercent: moment().diff(REFERENCE, 'ms') / REFERENCE_END.diff(REFERENCE, 'ms'),
      durationRemaining: REFERENCE_END.diff(moment(), 'ms'),
      fileName: 'BobRoss.stl',
      filamentLength: 95,
      filamentVolume: 455,
      state: 'Printing',
    };
  }

  const { data } = await api.get('/job');
  const { job, progress, state } = data;
  const { estimatedPrintTime, file, filament } = job;

  return {
    durationCurrent: progress?.printTime,
    durationEstimate: estimatedPrintTime,
    durationPercent: progress?.completion,
    durationRemaining: progress?.printTimeLeft,
    fileName: file,
    filamentLength: filament?.length,
    filamentVolume: filament?.volume,
    state,
  };
};

export const fetchLocalFile = async (filename): Promise<FileDetail> => {
  if (USE_MOCK) return MOCK.fileSingle;

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
  if (USE_MOCK) return MOCK.fileMultiple;

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
