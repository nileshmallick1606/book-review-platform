const BaseModel = require('../../src/models/base.model');
const { 
  bookFactory, 
  clearAllTestData, 
  readTestData, 
  writeTestData 
} = require('../utils');

describe('BaseModel', () => {
  let testModel;
  
  beforeEach(async () => {
    await clearAllTestData();
    testModel = new BaseModel('test');
  });

  describe('findAll', () => {
    it('should return an empty array when no items exist', async () => {
      const items = await testModel.findAll();
      expect(items).toEqual([]);
    });

    it('should return all items in the collection', async () => {
      const testItems = [
        { id: '1', name: 'Test 1' },
        { id: '2', name: 'Test 2' }
      ];
      
      await writeTestData('test', testItems);
      
      const items = await testModel.findAll();
      expect(items).toHaveLength(2);
      expect(items).toEqual(expect.arrayContaining(testItems));
    });
  });

  describe('findById', () => {
    it('should return null when item does not exist', async () => {
      const item = await testModel.findById('nonexistent');
      expect(item).toBeUndefined();
    });

    it('should return the item with matching id', async () => {
      const testItems = [
        { id: '1', name: 'Test 1' },
        { id: '2', name: 'Test 2' }
      ];
      
      await writeTestData('test', testItems);
      
      const item = await testModel.findById('1');
      expect(item).toEqual(testItems[0]);
    });
  });

  describe('create', () => {
    it('should create a new item with an id', async () => {
      const newItem = await testModel.create({ name: 'New Test' });
      
      expect(newItem).toHaveProperty('id');
      expect(newItem).toHaveProperty('name', 'New Test');
      
      // Check if item was stored
      const items = await readTestData('test');
      expect(items).toHaveLength(1);
      expect(items[0]).toEqual(newItem);
    });
  });
  
  // More tests for update, delete, etc. would follow
});
