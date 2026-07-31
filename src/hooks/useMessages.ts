import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';

export interface Message {
  id?: string;
  name: string;
  email: string;
  message: string;
  createdAt?: any;
  starred?: boolean;
}

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      let msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      // Sort so starred messages are at the top
      msgs.sort((a, b) => {
        if (a.starred === b.starred) return 0;
        return a.starred ? -1 : 1;
      });
      setMessages(msgs);
      setLoading(false);
    });
    return unsub;
  }, []);

  const sendMessage = async (data: Omit<Message, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'messages'), {
      ...data,
      starred: false,
      createdAt: serverTimestamp()
    });
  };

  const deleteMessage = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'messages', id));
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message. Please try again.');
    }
  };

  const toggleStarMessage = async (id: string, currentStarred: boolean) => {
    try {
      await updateDoc(doc(db, 'messages', id), {
        starred: !currentStarred
      });
    } catch (error) {
      console.error('Error starring message:', error);
      alert('Failed to update message. Please try again.');
    }
  };

  return { messages, loading, sendMessage, deleteMessage, toggleStarMessage };
}
