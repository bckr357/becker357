const fs = require('fs');
const crypto = require('crypto');

function canonicalizePayload(payload) {
  const tasks = Array.isArray(payload && payload.tasks) ? payload.tasks : [];

  return JSON.stringify({
    grade: Number(payload && payload.grade),
    date: String(payload && payload.date ? payload.date : ''),
    totalTasks: Number(payload && payload.totalTasks),
    correct: Number(payload && payload.correct),
    tasks: tasks.map(task => ({
      taskNumber: Number(task && task.taskNumber),
      typeLabel: String(task && task.typeLabel ? task.typeLabel : ''),
      prompt: String(task && task.prompt ? task.prompt : ''),
      userInput: String(task && task.userInput ? task.userInput : ''),
      correct: Boolean(task && task.correct),
      solution: String(task && task.solution ? task.solution : '')
    }))
  });
}

function readExportInfo(html) {
  const exportIdMatch = html.match(/<meta\s+name=["']x-export-id["']\s+content=["']([^"']+)["']/i);
  if (!exportIdMatch) {
    throw new Error('Export-ID nicht gefunden.');
  }

  const payloadMatch = html.match(/<script[^>]*id=["']result-payload["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!payloadMatch) {
    throw new Error('Payload-Container nicht gefunden.');
  }

  return {
    exportId: exportIdMatch[1],
    payloadBlock: payloadMatch[1]
  };
}

function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Bitte Dateipfad angeben: node verify-export.js <datei.html>');
    process.exit(1);
  }

  try {
    const html = fs.readFileSync(filePath, 'utf8');
    const { exportId, payloadBlock } = readExportInfo(html);
    const payload = JSON.parse(payloadBlock);
    const actualId = crypto.createHash('sha256')
      .update(canonicalizePayload(payload))
      .digest('hex');

    if (actualId === exportId) {
      console.log('OK: Dokument unverändert.');
      process.exit(0);
    }

    console.log('MANIPULIERT: Export-ID stimmt nicht mit dem aktuellen Inhalt überein.');
    console.log(`Erwartet: ${exportId}`);
    console.log(`Aktuell : ${actualId}`);
    process.exit(2);
  } catch (error) {
    console.error('Fehler bei der Verifikation:', error.message);
    process.exit(1);
  }
}

main();
