import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export interface ContactInfo {
  email: string;
  phone: string;
  location: string;
  image: string;
  coverImage: string;
  bio: string;
  web3FormsKey?: string;
  dropdownTooltip?: string;
}

export function useContact() {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'contact'), (doc) => {
      if (doc.exists()) {
        setContactInfo(doc.data() as ContactInfo);
      } else {
        setContactInfo(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const updateContact = async (data: ContactInfo) => {
    await setDoc(doc(db, 'settings', 'contact'), data);
  };

  return { contactInfo, loading, updateContact };
}
