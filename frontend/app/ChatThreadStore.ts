import { v4 as uuidv4 } from 'uuid';

export interface ChatThreadEntry {
  id: string;
  ts: string;
  slug: string;
  displayName: string;
}

export default class ChatThreadStore {
  private static storeKey = 'chatThreads';
  private static pageSize = 10;

  static fetchEntries(page: number = 0): ChatThreadEntry[] {
    const allEntries = this.getAllEntries();
    const startIndex = page * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const paginatedEntries = allEntries.slice(startIndex, endIndex);
    return paginatedEntries;
  }

  static addEntry(entry: ChatThreadEntry) {
    const allEntries = this.getAllEntries();
    allEntries.unshift(entry);
    this.saveEntries(allEntries);
  }

  static deleteEntry(id: string) {
    const allEntries = this.getAllEntries();
    const filteredEntries = allEntries.filter((entry) => entry.id !== id);
    this.saveEntries(filteredEntries);
  }

  static updateEntry(updatedEntry: ChatThreadEntry) {
    const allEntries = this.getAllEntries();
    const entryIndex = allEntries.findIndex(
      (entry) => entry.id === updatedEntry.id
    );
    if (entryIndex !== -1) {
      allEntries[entryIndex] = updatedEntry;
      this.saveEntries(allEntries);
    }
  }

  static findBySlug(slug: string): ChatThreadEntry | undefined {
    const allEntries = this.getAllEntries();
    return allEntries.find((entry) => entry.slug === slug);
  }

  static getAllEntries(): ChatThreadEntry[] {
    const entriesJson = localStorage.getItem(this.storeKey);
    return entriesJson ? JSON.parse(entriesJson) : [];
  }

  private static saveEntries(entries: ChatThreadEntry[]) {
    localStorage.setItem(this.storeKey, JSON.stringify(entries));
  }

  // Generate and add fake chat threads
  static generateFakeThreads(count: number) {
    const fakeThreads: ChatThreadEntry[] = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const date = new Date(now.getTime() - i * 86400000); // Subtracting days
      fakeThreads.push({
        id: uuidv4(),
        ts: date.toISOString(),
        slug: `thread-${i}`,
        displayName: `Sample Thread Sample Thread Sample Thread Sample Thread ${i}`,
      });
    }

    const allEntries = this.getAllEntries();
    this.saveEntries([...fakeThreads, ...allEntries]);
  }
}
