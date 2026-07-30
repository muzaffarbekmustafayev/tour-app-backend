import mongoose from 'mongoose';
mongoose.connect('mongodb://localhost:27017/navaitour').then(async () => {
  const docs = await mongoose.connection.db.collection('attractions').find().toArray();
  docs.forEach(d => console.log(d.name, '|||', d.description));
  process.exit();
});
