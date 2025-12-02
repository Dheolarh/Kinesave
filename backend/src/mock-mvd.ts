import net from 'net';

const PORT = 5540;

const server = net.createServer((socket) => {
    console.log('Client connected to Mock MVD');
    socket.write('Mock Google MVD');
    // Keep connection open for a bit then close
    setTimeout(() => socket.end(), 1000);
});

server.listen(PORT, () => {
    console.log(`🚀 Mock Google MVD running on port ${PORT}`);
    console.log('You can now scan for devices in the app!');
});

server.on('error', (err) => {
    console.error('Failed to start Mock MVD:', err);
});
