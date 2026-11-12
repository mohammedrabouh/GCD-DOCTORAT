/**
 * DOCTORIA — IndexedDB Storage Engine for Documents
 * Handles high-resolution scanned PDFs and camera photographs without quota limits of localStorage
 */

const DB_NAME = 'doctoria_documents_db';
const DB_VERSION = 1;
const STORE_NAME = 'document_blobs';

export interface StoredBlobRecord {
  id: string; // matches DocumentItem.storageKey
  dataUrl: string;
  mimeType: string;
  size: number;
  fileName: string;
  createdAt: string;
}

class IndexedDBStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(new Error(`Erreur d'ouverture d'IndexedDB: ${request.error?.message}`));
        };
      });
    }
    return this.dbPromise;
  }

  async saveBlob(record: StoredBlobRecord): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(new Error(`Échec d'enregistrement du document: ${req.error?.message}`));
    });
  }

  async getBlob(id: string): Promise<StoredBlobRecord | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => {
        resolve(req.result || null);
      };
      req.onerror = () => reject(new Error(`Échec de lecture du document: ${req.error?.message}`));
    });
  }

  async deleteBlob(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(new Error(`Échec de suppression du document: ${req.error?.message}`));
    });
  }
}

export const documentDB = new IndexedDBStorage();
