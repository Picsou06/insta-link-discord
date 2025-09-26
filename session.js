const fs = require('fs').promises;
const path = require('path');

class SessionManager {
    constructor() {
        this.sessionFile = path.join(__dirname, 'instagram-session.json');
    }

    async saveSession(ig) {
        try {
            const state = await ig.exportState();
            await fs.writeFile(this.sessionFile, JSON.stringify(state));
            console.log('Session sauvegardée avec succès');
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la session:', error.message);
        }
    }

    async loadSession() {
        try {
            const data = await fs.readFile(this.sessionFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.log('Aucune session précédente trouvée, création d\'une nouvelle session');
            return null;
        }
    }

    async clearSession() {
        try {
            await fs.unlink(this.sessionFile);
            console.log('Session supprimée');
        } catch (error) {
            // Fichier n'existe pas, pas de problème
        }
    }
}

module.exports = SessionManager;
