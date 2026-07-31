import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export function usePageContent(pageId: string, defaultContent: any) {
  const [content, setContent] = useState<any>(defaultContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', pageId), (doc) => {
      if (doc.exists()) {
        setContent(doc.data());
      } else {
        setContent(defaultContent);
      }
      setLoading(false);
    });
    return unsub;
  }, [pageId]);

  const updateContent = async (data: any) => {
    await setDoc(doc(db, 'settings', pageId), data);
  };

  return { content, loading, updateContent };
}
