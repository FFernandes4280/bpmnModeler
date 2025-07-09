import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3000;

// Define __dirname para módulos ES
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Middleware para processar JSON
app.use(express.json());

// Serve arquivos estáticos do diretório sessions
app.use('/sessions', express.static(path.resolve(__dirname, '../sessions')));

// Endpoint para salvar o XML
app.post('/save-diagram', (req, res) => {
  const { sessionNumber, diagramXML } = req.body;

  if (!sessionNumber || !diagramXML) {
    return res.status(400).send('Missing sessionNumber or diagramXML');
  }

  // Caminho para salvar o arquivo
  const sessionsDir = path.resolve(__dirname, '../sessions');
  const sessionFile = path.join(sessionsDir, `${sessionNumber}.bpmn`);

  // Certifique-se de que o diretório existe
  if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
  }

  // Salva o arquivo
  fs.writeFile(sessionFile, diagramXML, (err) => {
    if (err) {
      console.error('Error saving file:', err);
      return res.status(500).send('Failed to save file');
    }

    res.send('File saved successfully');
  });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});