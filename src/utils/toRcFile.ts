import type { RcFile, UploadFile } from 'antd/es/upload/interface';

export function toRcFile(file: File, index: number): UploadFile {
  const rcFile: RcFile = {
    ...file,
    uid: `rc-upload-${index}`,
    lastModifiedDate: new Date(file.lastModified),
    name: file.name,
    size: file.size,
    type: file.type,
    slice: (start?: number, end?: number, contentType?: string): Blob =>
      file.slice(start, end, contentType),
  };

  return {
    uid: rcFile.uid,
    name: rcFile.name,
    status: 'done',
    originFileObj: rcFile,
  };
}
