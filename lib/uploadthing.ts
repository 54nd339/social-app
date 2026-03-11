import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { auth } from '@clerk/nextjs/server';

const f = createUploadthing();

async function authMiddleware() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  return { userId };
}

export const uploadRouter = {
  postImage: f({ image: { maxFileSize: '16MB', maxFileCount: 10 } })
    .middleware(authMiddleware)
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),

  storyMedia: f({ image: { maxFileSize: '16MB', maxFileCount: 1 } })
    .middleware(authMiddleware)
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),

  chatImage: f({ image: { maxFileSize: '16MB', maxFileCount: 1 } })
    .middleware(authMiddleware)
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),
} satisfies FileRouter;

export type AppFileRouter = typeof uploadRouter;
