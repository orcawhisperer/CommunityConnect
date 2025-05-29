const bcrypt = jest.createMockFromModule('bcrypt');

// Mock specific functions as needed
bcrypt.hash = jest.fn((data, saltRounds) => Promise.resolve(`mocked_hash_${data}_${saltRounds}`));
bcrypt.compare = jest.fn((data, encrypted) => Promise.resolve(data === encrypted.replace('mocked_hash_', '').split('_')[0]));

module.exports = bcrypt;
