import { CollectionPostList } from './collection-post-list';

interface CollectionDetailPageProps {
  params: Promise<{ collectionId: string }>;
}

export default async function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { collectionId } = await params;

  return (
    <div className="mx-auto max-w-2xl">
      <CollectionPostList collectionId={collectionId} />
    </div>
  );
}
