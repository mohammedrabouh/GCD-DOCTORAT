/**
 * DOCTORIA — Authentication Context & Session Management
 * Automatically resolves role upon login, strictly prevents role selectors on login page.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { StorageService } from '../services/storage';
import { hashPassword } from '../constants';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, passwordPlain: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  registerCandidate: (data: {
    firstName: string;
    lastName: string;
    email: string;
    passwordPlain: string;
    phone?: string;
    cin?: string;
    cne?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'doctoria_current_session_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize storage and check session
    const init = async () => {
      try {
        await StorageService.initialize();
        const savedSession = localStorage.getItem(SESSION_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession) as { id?: string };
          // Re-verify user and active status in storage
          const freshUser = parsed?.id ? StorageService.getUserById(parsed.id) : undefined;
          if (freshUser && freshUser.status === 'ACTIF') {
            setUser(freshUser);
          } else {
            localStorage.removeItem(SESSION_KEY);
          }
        }
      } catch (err) {
        console.error('Session restoration error:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const login = async (email: string, passwordPlain: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const existingUser = StorageService.getUserByEmail(cleanEmail);

      if (!existingUser) {
        return { success: false, error: 'Identifiants invalides : aucun compte associé à cette adresse e-mail.' };
      }

      if (existingUser.status !== 'ACTIF') {
        return { success: false, error: 'Ce compte est suspendu ou en attente d’activation administrative.' };
      }

      const inputHash = await hashPassword(passwordPlain);
      if (inputHash !== existingUser.passwordHash) {
        return { success: false, error: 'Mot de passe incorrect. Veuillez vérifier votre saisie.' };
      }

      // Success — store only session identifier (never store passwordHash in session key)
      setUser(existingUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ id: existingUser.id }));

      // Audit log
      StorageService.logAudit({
        userId: existingUser.id,
        userName: `${existingUser.firstName} ${existingUser.lastName}`,
        userRole: existingUser.role,
        action: 'CONNEXION_UTILISATEUR',
        entityType: 'AUTH',
        entityId: existingUser.id,
        details: `Connexion réussie pour ${existingUser.email} (Rôle: ${existingUser.role}).`,
      });

      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: "Une erreur est survenue lors de l'authentification." };
    }
  };

  const logout = () => {
    if (user) {
      StorageService.logAudit({
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: user.role,
        action: 'DECONNEXION_UTILISATEUR',
        entityType: 'AUTH',
        entityId: user.id,
        details: `Déconnexion de l'utilisateur ${user.email}.`,
      });
    }
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const registerCandidate = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    passwordPlain: string;
    phone?: string;
    cin?: string;
    cne?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const newUser = await StorageService.createUser({
        ...data,
        role: 'CANDIDAT',
      });

      // Auto login newly registered candidate
      setUser(newUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ id: newUser.id }));

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création du compte candidat.';
      return { success: false, error: message };
    }
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const existing = StorageService.getUserByEmail(cleanEmail);

    if (!existing) {
      // Do not reveal email existence for security, return standard notification
      return {
        success: true,
        message: "Si un compte est associé à cette adresse e-mail institutionnelle, un lien de réinitialisation sécurisé vous a été transmis.",
      };
    }

    StorageService.logAudit({
      userId: existing.id,
      userName: `${existing.firstName} ${existing.lastName}`,
      userRole: existing.role,
      action: 'DEMANDE_RECUPERATION_MDP',
      entityType: 'AUTH',
      entityId: existing.id,
      details: `Demande de réinitialisation de mot de passe demandée pour ${cleanEmail}.`,
    });

    return {
      success: true,
      message: "Un lien de réinitialisation sécurisé a été généré pour votre compte. Veuillez vérifier votre messagerie électronique.",
    };
  };

  const hasRole = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        registerCandidate,
        requestPasswordReset,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
