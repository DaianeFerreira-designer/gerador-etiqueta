const functions = require('firebase-functions');

exports.receberWebhook = functions.https.onRequest((req, res) => {
  const event = req.body;
  // Processar o evento aqui
  console.log('Evento recebido:', event);
  res.status(200).send('Evento recebido');
});
