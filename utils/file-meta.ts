import type { LucideProps } from 'lucide-react-native';
import {
  File,
  FileArchive,
  FileCode,
  FileImage,
  FileMusic,
  FileSpreadsheet,
  FileText,
  FileVideoCamera,
  Presentation
} from 'lucide-react-native';
import type { ComponentType } from 'react';

export type FileMeta = {
  icon: ComponentType<LucideProps>;
  color: string;
  label: string;
};

const DEFAULT_META: FileMeta = {
  icon: File,
  color: '#9AA4B2',
  label: 'File',
};

const DOUBLE_EXTS = new Set(['tar.gz', 'tar.bz2', 'tar.xz', 'tar.zst']);

const EXT_MAP: Record<string, FileMeta> = {
  // Documents
  pdf: { icon: FileText, color: '#E11D48', label: 'PDF' },
  doc: { icon: FileText, color: '#2563EB', label: 'Document' },
  docx: { icon: FileText, color: '#2563EB', label: 'Document' },
  txt: { icon: FileText, color: '#6B7280', label: 'Text' },
  md: { icon: FileText, color: '#6B7280', label: 'Markdown' },
  ppt: { icon: Presentation, color: '#F59E0B', label: 'Presentation' },
  pptx: { icon: Presentation, color: '#F59E0B', label: 'Presentation' },

  // Spreadsheets
  xls: { icon: FileSpreadsheet, color: '#16A34A', label: 'Spreadsheet' },
  xlsx: { icon: FileSpreadsheet, color: '#16A34A', label: 'Spreadsheet' },
  csv: { icon: FileSpreadsheet, color: '#16A34A', label: 'Spreadsheet' },

  // Code / config
  js: { icon: FileCode, color: '#6366F1', label: 'Code' },
  ts: { icon: FileCode, color: '#6366F1', label: 'Code' },
  jsx: { icon: FileCode, color: '#6366F1', label: 'Code' },
  tsx: { icon: FileCode, color: '#6366F1', label: 'Code' },
  html: { icon: FileCode, color: '#6366F1', label: 'Code' },
  css: { icon: FileCode, color: '#6366F1', label: 'Code' },
  json: { icon: FileCode, color: '#0EA5E9', label: 'JSON' },
  yml: { icon: FileCode, color: '#6366F1', label: 'Config' },
  yaml: { icon: FileCode, color: '#6366F1', label: 'Config' },

  // Images
  jpg: { icon: FileImage, color: '#10B981', label: 'Image' },
  jpeg: { icon: FileImage, color: '#10B981', label: 'Image' },
  png: { icon: FileImage, color: '#10B981', label: 'Image' },
  gif: { icon: FileImage, color: '#10B981', label: 'Image' },
  webp: { icon: FileImage, color: '#10B981', label: 'Image' },
  svg: { icon: FileImage, color: '#10B981', label: 'Image' },
  heic: { icon: FileImage, color: '#10B981', label: 'Image' },

  // Audio
  mp3: { icon: FileMusic, color: '#8B5CF6', label: 'Audio' },
  wav: { icon: FileMusic, color: '#8B5CF6', label: 'Audio' },
  flac: { icon: FileMusic, color: '#8B5CF6', label: 'Audio' },
  m4a: { icon: FileMusic, color: '#8B5CF6', label: 'Audio' },
  aac: { icon: FileMusic, color: '#8B5CF6', label: 'Audio' },
  ogg: { icon: FileMusic, color: '#8B5CF6', label: 'Audio' },
  mid: { icon: FileMusic, color: '#8B5CF6', label: 'Audio' },
  midi: { icon: FileMusic, color: '#8B5CF6', label: 'Audio' },

  // Video
  mp4: { icon: FileVideoCamera, color: '#F59E0B', label: 'Video' },
  mov: { icon: FileVideoCamera, color: '#F59E0B', label: 'Video' },
  mkv: { icon: FileVideoCamera, color: '#F59E0B', label: 'Video' },
  webm: { icon: FileVideoCamera, color: '#F59E0B', label: 'Video' },
  avi: { icon: FileVideoCamera, color: '#F59E0B', label: 'Video' },
  m4v: { icon: FileVideoCamera, color: '#F59E0B', label: 'Video' },

  // Archives
  zip: { icon: FileArchive, color: '#F97316', label: 'Archive' },
  rar: { icon: FileArchive, color: '#F97316', label: 'Archive' },
  '7z': { icon: FileArchive, color: '#F97316', label: 'Archive' },
  tar: { icon: FileArchive, color: '#F97316', label: 'Archive' },
  gz: { icon: FileArchive, color: '#F97316', label: 'Archive' },
  bz2: { icon: FileArchive, color: '#F97316', label: 'Archive' },
  xz: { icon: FileArchive, color: '#F97316', label: 'Archive' },
  zst: { icon: FileArchive, color: '#F97316', label: 'Archive' },
  'tar.gz': { icon: FileArchive, color: '#F97316', label: 'Archive' },
  'tar.bz2': { icon: FileArchive, color: '#F97316', label: 'Archive' },
  'tar.xz': { icon: FileArchive, color: '#F97316', label: 'Archive' },
  'tar.zst': { icon: FileArchive, color: '#F97316', label: 'Archive' },
};

export const FILE_EXTENSIONS = Object.freeze(Object.keys(EXT_MAP));

const getExtension = (filename: string): string | null => {
  const lower = filename.trim().toLowerCase();
  if (!lower) {
    return null;
  }

  const parts = lower.split('.');
  if (parts.length === 1) {
    return null;
  }

  if (parts.length === 2 && parts[0] === '') {
    return parts[1] || null;
  }

  const lastTwo = parts.slice(-2).join('.');
  if (DOUBLE_EXTS.has(lastTwo)) {
    return lastTwo;
  }

  const last = parts[parts.length - 1];
  return last || null;
};

export const getFileMeta = (filename: string): FileMeta => {
  const ext = getExtension(filename);
  if (!ext) {
    return DEFAULT_META;
  }

  return EXT_MAP[ext] ?? DEFAULT_META;
};
