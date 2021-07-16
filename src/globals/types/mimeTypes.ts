export enum MimeTypes {
  SVG = 'image/svg+xml',
  // JPEG = 'image/jpeg',
  // JPG = 'image/jpg',
  // PNG = 'image/png',
  // PDF = 'application/pdf',
  // DOC = 'application/msword',
  // DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

export const mimeTypesArray: string[] = Object.keys(MimeTypes).map((key) => MimeTypes[key]);

