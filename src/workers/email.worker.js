  const { Worker } = require('bullmq');
  const { connection } = require('../config/queue');

  /**
   * Simuler l'envoi d'un email
   * En production, tu utiliserais SendGrid, Mailgun, AWS SES, etc.
   */
  const sendEmail = async (to, subject, body) => {
    console.log(`📧 Envoi email à ${to}`);
    console.log(`   Sujet: ${subject}`);
    console.log(`   Corps: ${body}`);

    // Simuler un délai d'envoi (200-500ms)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 200));

    console.log(`✅ Email envoyé à ${to}`);
  };

   /**
   * Worker pour traiter les jobs d'email
   */
  const emailWorker = new Worker('email', async (job) => {
    const { email, subject, body, userName } = job.data;

    console.log(`🔄 Traitement du job ${job.id} pour ${email}`);

    // Personnaliser le corps avec le nom
    const personalizedBody = body.replace('{{userName}}', userName || 'utilisateur');

    // Envoyer l'email
    await sendEmail(email, subject, personalizedBody);

    // Retourner le résultat
    return { sent: true, email, timestamp: new Date() };
  }, { connection });

  console.log('🚀 Email worker démarré et en écoute...');

  module.exports = emailWorker;