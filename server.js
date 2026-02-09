import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 8080;

// Log initialization
console.log(`[LogSight] Initializing static server...`);
console.log(`[LogSight] Root directory: ${__dirname}`);

// Serve static files from the root directory
app.use(express.static(__dirname));

// SPA Catch-all: Redirect all non-file requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`[LogSight] Web interface active at http://localhost:${port}`);
});