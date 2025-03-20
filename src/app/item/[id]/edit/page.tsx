// src/app/item/[id]/edit/page.tsx
import { redirect } from 'next/navigation';
import EditItemForm from './EditItemForm';
import { adminDb } from '@/lib/firebase-admin';

type PageProps = {
  params: {
    id: string;
  };
};

export default async function EditItemPage({ params }: PageProps) {
  const { id } = params;
  // Use the admin SDK API for fetching the document
  const itemDoc = await adminDb.collection('items').doc(id).get();

  if (!itemDoc.exists) {
    // Redirect if the item does not exist
    redirect('/not-found');
  }

  const data = itemDoc.data();

  // Convert Firestore Timestamp fields to ISO strings for serialization
  const serializableData = {
    ...data,
    createdAt: data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data?.createdAt ?? null,
    lastUpdated: data?.lastUpdated?.toDate ? data.lastUpdated.toDate().toISOString() : data?.lastUpdated ?? null,
  };

  // Pass the serializable item data to the client component for editing.
  return <EditItemForm initialData={{ id, ...serializableData }} />;
}
