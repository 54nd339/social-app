import { createUploadthing, type FileRouter } from 'uploadthing/next';

const f = createUploadthing();

export const uploadRouter = {
  avatar: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } }).onUploadComplete(async () => {}),

  banner: f({ image: { maxFileSize: '8MB', maxFileCount: 1 } }).onUploadComplete(async () => {}),

  postImage: f({ image: { maxFileSize: '16MB', maxFileCount: 10 } }).onUploadComplete(
    async () => {},
  ),

  storyMedia: f({ image: { maxFileSize: '16MB', maxFileCount: 1 } }).onUploadComplete(
    async () => {},
  ),

  chatImage: f({ image: { maxFileSize: '16MB', maxFileCount: 1 } }).onUploadComplete(
    async () => {},
  ),

  chatDocument: f({
    pdf: { maxFileSize: '32MB', maxFileCount: 1 },
    'application/msword': { maxFileSize: '32MB', maxFileCount: 1 },
  }).onUploadComplete(async () => {}),

  voiceMessage: f({ audio: { maxFileSize: '8MB', maxFileCount: 1 } }).onUploadComplete(
    async () => {},
  ),
} satisfies FileRouter;

export type AppFileRouter = typeof uploadRouter;
