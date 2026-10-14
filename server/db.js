const fs = require('fs');
const path = require('path');
const seedData = require('./seedData');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'retisync_db.json');

class Database {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_PATH)) {
      try {
        const raw = fs.readFileSync(DB_PATH, 'utf8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.warn('⚠️ Corrupt database file encountered, re-initializing from seeds:', err.message);
        this.reset();
      }
    } else {
      this.reset();
    }
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(seedData));
    this.persist();
  }

  persist() {
    try {
      const tempPath = DB_PATH + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, DB_PATH);
    } catch (err) {
      console.error('❌ Failed to persist database:', err.message);
    }
  }

  get(collection) {
    return this.data[collection] || [];
  }

  find(collection, predicate) {
    const list = this.get(collection);
    return list.filter(predicate);
  }

  findById(collection, id) {
    const list = this.get(collection);
    return list.find(item => item.id === id) || null;
  }

  insert(collection, item) {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    this.data[collection].unshift(item);
    this.persist();
    return item;
  }

  update(collection, id, updates) {
    if (!this.data[collection]) return null;
    const index = this.data[collection].findIndex(item => item.id === id);
    if (index === -1) return null;
    this.data[collection][index] = { ...this.data[collection][index], ...updates };
    this.persist();
    return this.data[collection][index];
  }

  delete(collection, id) {
    if (!this.data[collection]) return false;
    const index = this.data[collection].findIndex(item => item.id === id);
    if (index === -1) return false;
    this.data[collection].splice(index, 1);
    this.persist();
    return true;
  }
}

const db = new Database();
module.exports = db;
