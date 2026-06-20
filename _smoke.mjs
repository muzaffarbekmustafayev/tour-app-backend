const mods = [
  './routes/auth.js','./routes/hotels.js','./routes/attractions.js',
  './routes/upload.js','./routes/assistant.js','./routes/chat.js','./routes/admin.js','./routes/reviews.js',
  './controllers/attractionController.js','./controllers/assistantController.js','./controllers/hotelController.js',
];
let ok = 0;
for (const m of mods) {
  try { await import(m); console.log('OK  ', m); ok++; }
  catch (e) { console.log('FAIL', m, '->', e.message); }
}
console.log(`\n${ok}/${mods.length} modul xatosiz yuklandi`);
