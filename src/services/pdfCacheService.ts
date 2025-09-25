/**
 * PDF Cache Service using IndexedDB
 * Stores generated PDFs for walk cards to enable instant sharing
 */

const DB_NAME = 'WalkPDFCache';
const DB_VERSION = 1;
const STORE_NAME = 'pdfs';

interface PDFCacheItem {
  walkCardId: string;
  blob: Blob;
  timestamp: number;
  size: number;
}

class PDFCacheService {
  private db: IDBDatabase | null = null;

  private async openDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(new Error('Failed to open IndexedDB'));

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'walkCardId' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async storePDF(walkCardId: string, blob: Blob): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const cacheItem: PDFCacheItem = {
        walkCardId,
        blob,
        timestamp: Date.now(),
        size: blob.size
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(cacheItem);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to store PDF'));
      });

      console.log(`PDF cached for walk ${walkCardId} (${Math.round(blob.size / 1024)}KB)`);
    } catch (error) {
      console.warn('Failed to cache PDF:', error);
      // Don't throw - caching is optional
    }
  }

  async getPDF(walkCardId: string): Promise<Blob | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise<Blob | null>((resolve, reject) => {
        const request = store.get(walkCardId);
        
        request.onsuccess = () => {
          const result = request.result as PDFCacheItem | undefined;
          if (result) {
            console.log(`PDF cache hit for walk ${walkCardId}`);
            resolve(result.blob);
          } else {
            console.log(`PDF cache miss for walk ${walkCardId}`);
            resolve(null);
          }
        };

        request.onerror = () => {
          console.warn('Failed to retrieve cached PDF:', request.error);
          resolve(null); // Return null instead of throwing
        };
      });
    } catch (error) {
      console.warn('Failed to access PDF cache:', error);
      return null;
    }
  }

  async clearPDF(walkCardId: string): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(walkCardId);
        request.onsuccess = () => {
          console.log(`PDF cache cleared for walk ${walkCardId}`);
          resolve();
        };
        request.onerror = () => reject(new Error('Failed to clear cached PDF'));
      });
    } catch (error) {
      console.warn('Failed to clear cached PDF:', error);
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise<number>((resolve) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const items = request.result as PDFCacheItem[];
          const totalSize = items.reduce((sum, item) => sum + item.size, 0);
          resolve(totalSize);
        };
        request.onerror = () => resolve(0);
      });
    } catch {
      return 0;
    }
  }

  async clearAllCache(): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => {
          console.log('PDF cache cleared');
          resolve();
        };
        request.onerror = () => reject(new Error('Failed to clear cache'));
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }
}

export const pdfCacheService = new PDFCacheService();