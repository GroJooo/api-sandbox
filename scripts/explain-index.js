require('dotenv').config();
if (process.env.MONGO_URI_TEST) {
  process.env.MONGO_URI = process.env.MONGO_URI_TEST;
}

const mongoose = require('mongoose');
const User = require('../src/models/user.model');

async function run() {
  await mongoose.connect(process.env.MONGO_URI_TEST);
  await User.init();
  const explained = await User.find({}).sort({ createdAt: -1 }).limit(1).explain('executionStats');
  console.log(JSON.stringify(explained, null, 2));
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });