require('dotenv').config();
const Insta = require('./insta.js');
const axios = require('axios');
const client = new Insta.Client();

// Configuration depuis les variables d'environnement
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const INSTAGRAM_USERNAME = process.env.INSTAGRAM_USERNAME;
const INSTAGRAM_PASSWORD = process.env.INSTAGRAM_PASSWORD;

// Variables pour gérer les erreurs de polling
let pollingErrorCount = 0;
const MAX_POLLING_ERRORS = parseInt(process.env.MAX_POLLING_ERRORS) || 10;
const POLLING_DELAY_ON_ERROR = parseInt(process.env.POLLING_DELAY_ON_ERROR) || 30000;

// Configuration des délais de polling depuis les variables d'environnement
const POLLING_CONFIG = {
    // 7h à 19h : entre 5 et 20 secondes
    dayTime: {
        startHour: parseInt(process.env.DAY_START_HOUR) || 7,
        endHour: parseInt(process.env.DAY_END_HOUR) || 19,
        minDelay: parseInt(process.env.DAY_MIN_DELAY) || 5000,
        maxDelay: parseInt(process.env.DAY_MAX_DELAY) || 20000
    },
    // Reste du temps : entre 30 secondes et 1 minute
    nightTime: {
        minDelay: parseInt(process.env.NIGHT_MIN_DELAY) || 30000,
        maxDelay: parseInt(process.env.NIGHT_MAX_DELAY) || 60000
    }
};

// Fonction pour envoyer une notification de bannissement sur Discord
async function sendBanNotification() {
	try {
		const webhookData = {
			username: 'Instagram Bot - ALERT',
			avatar_url: null,
			content: 'Je me suis fait ban...'
		};
		
		await axios.post(DISCORD_WEBHOOK_URL, webhookData, {
			timeout: 10000
		});
		console.log('Notification de bannissement envoyée sur Discord');
	} catch (error) {
		console.error('Erreur lors de l\'envoi de la notification de bannissement:', error.message);
	}
}

// Fonction pour envoyer un message vers Discord via webhook avec retry
async function sendToDiscord(message, user, retryCount = 0) {
	const MAX_RETRIES = 3;
	const RETRY_DELAY = 5000; // 5 secondes
	
	try {
		const webhookData = {
			username: user.fullName || 'Instagram User',
			avatar_url: user.avatarURL || null,
			content: message.content || ''
		};
		
		if (message.type === 'media' && message.mediaData && message.mediaData.url) {
			if (message.mediaData.url === null) {
				webhookData.content = message.content || '❤️ (like)';
			} else {
				webhookData.embeds = [{
					image: {
						url: message.mediaData.url
					}
				}];
				if (!message.content || message.content.trim() === '') {
					webhookData.content = message.content || '';
				}
			}
		}
		
		await axios.post(DISCORD_WEBHOOK_URL, webhookData, {
			timeout: 10000 // Timeout de 10 secondes
		});
		console.log('Message envoyé vers Discord avec succès');
		pollingErrorCount = Math.max(0, pollingErrorCount - 1); // Réduire le compteur d'erreurs en cas de succès
	} catch (error) {
		console.error(`Erreur lors de l'envoi vers Discord (tentative ${retryCount + 1}/${MAX_RETRIES + 1}):`, error.message);
		
		// Retry si pas trop de tentatives
		if (retryCount < MAX_RETRIES) {
			console.log(`Nouvelle tentative dans ${RETRY_DELAY/1000} secondes...`);
			setTimeout(() => {
				sendToDiscord(message, user, retryCount + 1);
			}, RETRY_DELAY);
		}
	}
}

client.on('connected', () => {
	console.log(`${client.user.username} Is Ready Now For Chats`);
	pollingErrorCount = 0; // Reset du compteur d'erreurs à la connexion
});

// Gérer les erreurs de polling
client.on('error', async (error) => {
	pollingErrorCount++;
	console.error(`Erreur du client Instagram (${pollingErrorCount}/${MAX_POLLING_ERRORS}):`, error.message);
	
	// Vérifier si c'est l'erreur spécifique 401 "Please wait a few minutes"
	if (error.message.includes('401 Unauthorized') && error.message.includes('Please wait a few minutes')) {
		console.log('Erreur 401 détectée pendant le polling - Instagram demande d\'attendre');
		const waitTime = 5; // 5 minutes
		await sendWaitNotification(waitTime);
		
		console.log(`Pause de ${waitTime} minutes avant de reprendre le polling...`);
		setTimeout(() => {
			pollingErrorCount = 0;
			console.log('Fin de l\'attente, reprise du polling...');
		}, waitTime * 60000); // 5 minutes en millisecondes
		
		return; // Ne pas compter cette erreur dans le compteur normal
	}
	
	// Si trop d'erreurs, attendre avant de continuer
	if (pollingErrorCount >= MAX_POLLING_ERRORS) {
		console.log(`Trop d'erreurs de polling. Pause de ${POLLING_DELAY_ON_ERROR/1000} secondes...`);
		
		// Envoyer notification de bannissement sur Discord
		sendBanNotification();
		
		setTimeout(() => {
			pollingErrorCount = 0;
			console.log('Reprise du polling...');
		}, POLLING_DELAY_ON_ERROR);
	}
});

client.on('messageCreate', async (message) => {
	if (message.author.id === client.user.id) return
	message.markSeen();

	console.log(message);
		// Afficher les informations du cache des utilisateurs
	console.log('=== CACHE USERS INFO ===');
	console.log('Nombre d\'utilisateurs en cache:', client.cache.users.size);
	console.log('Author ID du message:', message.authorID);
	
	// Récupérer l'utilisateur correspondant à l'authorID du message
	let senderUser = client.cache.users.get(message.authorID);
	
	if (senderUser) {
		console.log(`Utilisateur trouvé pour l'ID ${message.authorID}:`);
		console.log(`Username: ${senderUser.username}`);
		console.log(`Full Name: ${senderUser.fullName}`);
		console.log(`Is Private: ${senderUser.isPrivate}`);
		console.log(`Is Verified: ${senderUser.isVerified}`);
		console.log(`Follower Count: ${senderUser.followerCount}`);
		console.log(`Following Count: ${senderUser.followingCount}`);
		console.log(`Avatar URL: ${senderUser.avatarURL}`);
		console.log(`Biography: ${senderUser.biography}`);
	} else {
		console.log(`Aucun utilisateur trouvé pour l'ID ${message.authorID}`);
	}
	console.log('======================');

	// Envoyer le message vers Discord avec les infos de l'utilisateur
	if (senderUser) {
		await sendToDiscord(message, senderUser);
	}
});

// Fonction pour envoyer une notification d'attente sur Discord
async function sendWaitNotification(waitTimeMinutes) {
	try {
		const webhookData = {
			username: 'Instagram Bot - INFO',
			avatar_url: null,
			content: `⏳ Instagram demande d'attendre ${waitTimeMinutes} minutes avant de réessayer. Bot en pause...`
		};
		
		await axios.post(DISCORD_WEBHOOK_URL, webhookData, {
			timeout: 10000
		});
		console.log(`Notification d'attente de ${waitTimeMinutes} minutes envoyée sur Discord`);
	} catch (error) {
		console.error('Erreur lors de l\'envoi de la notification d\'attente:', error.message);
	}
}

// Fonction pour se connecter avec gestion d'erreur
async function connectWithRetry(maxRetries = 3) {
	// Vérification des variables d'environnement
	if (!INSTAGRAM_USERNAME || !INSTAGRAM_PASSWORD) {
		console.error('Erreur: INSTAGRAM_USERNAME et INSTAGRAM_PASSWORD doivent être définis dans le fichier .env');
		return;
	}
	
	if (!DISCORD_WEBHOOK_URL) {
		console.error('Erreur: DISCORD_WEBHOOK_URL doit être défini dans le fichier .env');
		return;
	}
	
	for (let i = 0; i < maxRetries; i++) {
		try {
			await client.login(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD);
			console.log('Connexion réussie');
			return;
		} catch (error) {
			console.error(`Erreur de connexion (tentative ${i + 1}/${maxRetries}):`, error.message);
			
			// Vérifier si c'est l'erreur spécifique 401 "Please wait a few minutes"
			if (error.message.includes('401 Unauthorized') && error.message.includes('Please wait a few minutes')) {
				console.log('Erreur 401 détectée - Instagram demande d\'attendre');
				const waitTime = 15; // 15 minutes
				await sendWaitNotification(waitTime);
				
				console.log(`Attente de ${waitTime} minutes avant de réessayer...`);
				await new Promise(resolve => setTimeout(resolve, waitTime * 60000)); // 15 minutes en millisecondes
				
				// Réessayer immédiatement après l'attente
				console.log('Fin de l\'attente, nouvelle tentative de connexion...');
				continue;
			}
			
			if (i < maxRetries - 1) {
				const delay = (i + 1) * 10000; // Délai croissant: 10s, 20s, 30s
				console.log(`Nouvelle tentative dans ${delay/1000} secondes...`);
				await new Promise(resolve => setTimeout(resolve, delay));
			}
		}
	}
	console.error('Impossible de se connecter après plusieurs tentatives');
}

// Démarrer la connexion
connectWithRetry();
