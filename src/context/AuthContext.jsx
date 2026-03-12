import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Watch auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) setProfile(snap.data());
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Create user profile in Firestore
  const createProfile = async (uid, data) => {
    const profileData = {
      uid,
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', uid), profileData, { merge: true });
    setProfile(profileData);
    return profileData;
  };

  // Email/Password Sign Up
  const signup = async ({ email, password, name, phone, company }) => {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(newUser, { displayName: name });
    await createProfile(newUser.uid, { email, name, phone, company });
    return newUser;
  };

  // Email/Password Sign In
  const login = async (email, password) => {
    const { user: u } = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, 'users', u.uid));
    if (snap.exists()) setProfile(snap.data());
    return u;
  };

  // Google Sign In
  const loginWithGoogle = async () => {
    const { user: u } = await signInWithPopup(auth, googleProvider);
    // Create profile if first time
    const snap = await getDoc(doc(db, 'users', u.uid));
    if (!snap.exists()) {
      await createProfile(u.uid, {
        email: u.email,
        name: u.displayName || '',
        phone: '',
        company: '',
      });
    } else {
      setProfile(snap.data());
    }
    return u;
  };

  const logout = () => signOut(auth);

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const value = {
    user, profile, loading,
    signup, login, loginWithGoogle, logout, resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
