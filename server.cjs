import('./src/server.js')
  .then(() => console.log('✅ Satphere server started successfully'))
  .catch(err => {
    console.error('❌ Satphere server failed to start:', err);
    process.exit(1);
  });
