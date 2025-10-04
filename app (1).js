// Bataille de Mangue RPG - Logique de jeu avec vraies images
class BatailleMangue {
    constructor() {
        // URLs des images réelles
        this.imagesUrls = {
            musclee: "https://user-gen-media-assets.s3.amazonaws.com/seedream_images/bcc2fdae-cf9c-499a-9967-9a0a5b117e0b.png",
            ronde: "https://user-gen-media-assets.s3.amazonaws.com/seedream_images/94e02c1b-5adc-432f-8007-4ea43a6987eb.png"
        };

        // Données des mangues basées sur le JSON fourni
        this.mangues = {
            musclee: {
                nom: "Mangue Musclée",
                stats: { sante: 70, energie: 50, force: 85, charisme: 15 },
                description: "Grosse, stupide, pathétique",
                image: this.imagesUrls.musclee,
                animations: ["flex_fail", "chute"],
                reactions: ["*soupir*", "Argh!", "*tombe*"],
                faiblesse: true
            },
            ronde: {
                nom: "Mangue Ronde", 
                stats: { sante: 95, energie: 90, force: 60, charisme: 100 },
                description: "Mignonne, cool, championne",
                image: this.imagesUrls.ronde,
                animations: ["rebond", "brille", "victoire"],
                reactions: ["HAHA!", "Génial!", "*danse*"],
                superieure: true
            }
        };

        this.nourriture = [
            { nom: "Riz", type: "rice", effets: { sante: 10, energie: 5 } },
            { nom: "Gâteau", type: "cake", effets: { sante: 15, charisme: 10 } },
            { nom: "Fruits", type: "fruits", effets: { sante: 20, charisme: 5 } },
            { nom: "Protéine", type: "protein", effets: { force: 15, energie: -5 } }
        ];

        this.messages = {
            victoire_ronde: ["La Mangue Ronde triomphe!", "Encore une victoire facile!", "Trop forte!"],
            echec_musclee: ["La Mangue Musclée échoue...", "*tombe lourdement*", "Pathétique..."]
        };

        this.effets_sonores = ["BONK!", "HAHA!", "*chute*", "*miam*", "*bravo*"];

        // État du jeu
        this.ecranActuel = 'character-select';
        this.mangueSelectionnee = null;
        this.statsJoueur = {};
        this.statsAdversaire = {};
        this.score = 0;
        this.etatJeu = 'selection';

        this.init();
    }

    init() {
        this.lierEvenements();
        this.afficherEcran('character-select');
    }

    lierEvenements() {
        // Sélection de personnage
        document.querySelectorAll('.select-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const carte = e.target.closest('.character-card');
                const personnage = carte.dataset.character;
                this.selectionnerPersonnage(personnage);
            });
        });

        // Actions principales
        document.getElementById('feed-btn').addEventListener('click', () => this.afficherModalNourriture());
        document.getElementById('train-btn').addEventListener('click', () => this.entrainerMangue());
        document.getElementById('battle-btn').addEventListener('click', () => this.commencerCombat());
        document.getElementById('vs-battle-trigger').addEventListener('click', () => this.commencerCombat());

        // Modales
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.fermerModales());
        });

        // Nourriture
        document.querySelectorAll('.food-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const typeNourriture = e.target.closest('.food-item').dataset.food;
                this.nourrir(typeNourriture);
            });
        });

        // Combat
        document.querySelectorAll('.battle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action) {
                    this.executerActionCombat(action);
                }
            });
        });

        document.getElementById('back-to-game').addEventListener('click', () => {
            this.afficherEcran('main-game');
        });

        // Fermeture modale en cliquant à l'extérieur
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.fermerModales();
                }
            });
        });
    }

    selectionnerPersonnage(personnage) {
        this.mangueSelectionnee = personnage;
        this.statsJoueur = { ...this.mangues[personnage].stats };
        
        // Choisir l'adversaire (le contraire)
        const adversaire = personnage === 'musclee' ? 'ronde' : 'musclee';
        this.statsAdversaire = { ...this.mangues[adversaire].stats };
        
        this.configurerEcranJeu();
        this.afficherEcran('main-game');
        this.jouerSon("✨ SÉLECTION! ✨");
        
        // Message différent selon le choix
        if (personnage === 'ronde') {
            this.afficherMessage("Excellent choix! La Mangue Ronde est la meilleure! ⭐");
        } else {
            this.afficherMessage("Tu as choisi la Mangue Musclée... bonne chance... 😅");
        }
    }

    configurerEcranJeu() {
        const imgJoueur = document.getElementById('player-mango-img');
        const imgAdversaire = document.getElementById('opponent-mango-img');
        const nomJoueur = document.getElementById('player-name');
        const nomAdversaire = document.getElementById('opponent-name');

        // Configuration des images
        imgJoueur.src = this.mangues[this.mangueSelectionnee].image;
        imgJoueur.alt = this.mangues[this.mangueSelectionnee].nom;
        imgJoueur.className = `mango-image-large ${this.mangueSelectionnee}`;
        nomJoueur.textContent = this.mangues[this.mangueSelectionnee].nom;
        
        const adversaire = this.mangueSelectionnee === 'musclee' ? 'ronde' : 'musclee';
        imgAdversaire.src = this.mangues[adversaire].image;
        imgAdversaire.alt = this.mangues[adversaire].nom;
        imgAdversaire.className = `mango-image-large ${adversaire}`;
        nomAdversaire.textContent = this.mangues[adversaire].nom;

        this.mettreAJourStats();
    }

    mettreAJourStats() {
        const stats = ['sante', 'energie', 'force', 'charisme'];
        
        stats.forEach(stat => {
            const valeur = this.statsJoueur[stat] || 0;
            const maxValeur = 100;
            const pourcentage = Math.min(100, (valeur / maxValeur) * 100);
            
            const barreId = stat === 'sante' ? 'health' : stat === 'energie' ? 'energy' : 
                           stat === 'force' ? 'strength' : 'charisma';
            
            const barre = document.getElementById(`${barreId}-bar`);
            const texte = document.getElementById(`${barreId}-text`);
            
            if (barre && texte) {
                barre.style.width = `${pourcentage}%`;
                texte.textContent = `${valeur}/${maxValeur}`;
            }
        });

        document.getElementById('score').textContent = this.score;
    }

    afficherEcran(ecranId) {
        document.querySelectorAll('.screen').forEach(ecran => {
            ecran.classList.remove('active');
        });
        document.getElementById(ecranId).classList.add('active');
        this.ecranActuel = ecranId;
    }

    afficherModalNourriture() {
        document.getElementById('feed-modal').classList.remove('hidden');
    }

    fermerModales() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    nourrir(typeNourriture) {
        const nourriture = this.nourriture.find(n => n.type === typeNourriture);
        if (!nourriture) return;

        if (this.statsJoueur.energie < 10) {
            this.afficherMessage("Trop fatigué pour manger! Repose-toi d'abord.");
            this.jouerSon("*soupir*");
            return;
        }

        // Appliquer les effets
        Object.keys(nourriture.effets).forEach(stat => {
            if (this.statsJoueur[stat] !== undefined) {
                this.statsJoueur[stat] = Math.max(0, Math.min(100, 
                    this.statsJoueur[stat] + nourriture.effets[stat]));
            }
        });

        this.statsJoueur.energie = Math.max(0, this.statsJoueur.energie - 5);
        this.score += 10;

        // Bonus pour la Mangue Ronde
        if (this.mangueSelectionnee === 'ronde') {
            this.score += 5; // Bonus car la Mangue Ronde est plus cool
            this.afficherMessage(`${nourriture.nom} délicieux! La Mangue Ronde adore! ✨`);
            this.jouerSon("*miam* Génial!");
        } else {
            this.afficherMessage(`${nourriture.nom} mangé... sans grâce. 😐`);
            this.jouerSon("*mâche bruyamment*");
        }

        this.mettreAJourStats();
        this.fermerModales();
        this.animerMangue('player', 'happy');
        
        setTimeout(() => this.reactionAdversaire(), 1000);
    }

    entrainerMangue() {
        if (this.statsJoueur.energie < 20) {
            this.afficherMessage("Pas assez d'énergie pour s'entraîner!");
            this.jouerSon("*fatigue*");
            return;
        }

        let statEntrainee;
        let augmentation;

        if (this.mangueSelectionnee === 'musclee') {
            statEntrainee = 'force';
            augmentation = Math.floor(Math.random() * 8) + 3; // Moins efficace
            this.afficherMessage("Entraînement maladroit... essaie de soulever des poids.");
            this.jouerSon("*effort* *grogne*");
            
            // La Mangue Musclée a 30% de chance d'échouer
            if (Math.random() < 0.3) {
                this.statsJoueur.sante = Math.max(10, this.statsJoueur.sante - 15);
                this.afficherMessage("...et tombe! Quelle maladresse! *CHUTE*");
                this.jouerSon("BONK!");
                this.animerMangue('player', 'fall');
                augmentation = 0;
            }
        } else {
            statEntrainee = 'charisme';
            augmentation = Math.floor(Math.random() * 15) + 10; // Plus efficace
            this.afficherMessage("Entraînement magnifique! La Mangue Ronde brille! ✨");
            this.jouerSon("HAHA! *danse*");
            this.animerMangue('player', 'victoire');
            
            // Bonus supplémentaire car la Mangue Ronde est supérieure
            this.score += 10;
        }

        if (augmentation > 0) {
            this.statsJoueur[statEntrainee] = Math.min(100, this.statsJoueur[statEntrainee] + augmentation);
        }
        
        this.statsJoueur.energie = Math.max(0, this.statsJoueur.energie - 20);
        this.score += 15;
        this.mettreAJourStats();

        setTimeout(() => this.reactionAdversaire('jaloux'), 1500);
    }

    commencerCombat() {
        this.afficherEcran('battle-screen');
        this.etatJeu = 'combat';
        document.getElementById('battle-log').innerHTML = '';
        this.ajouterLogCombat("⚔️ LE COMBAT COMMENCE! ⚔️");
        this.ajouterLogCombat(`${this.mangues[this.mangueSelectionnee].nom} VS ${this.mangueSelectionnee === 'musclee' ? this.mangues.ronde.nom : this.mangues.musclee.nom}`);
        
        if (this.mangueSelectionnee === 'ronde') {
            this.ajouterLogCombat("La Mangue Ronde rayonne de confiance! ✨");
        } else {
            this.ajouterLogCombat("La Mangue Musclée semble nerveuse... 😰");
        }
        
        this.jouerSon("⚔️ COMBAT! ⚔️");
    }

    executerActionCombat(action) {
        if (this.etatJeu !== 'combat') return;

        let resultatJoueur, resultatAdversaire;

        switch(action) {
            case 'attack':
                resultatJoueur = this.calculerAttaque();
                break;
            case 'defend':
                resultatJoueur = this.calculerDefense();
                break;
            case 'charm':
                resultatJoueur = this.calculerCharme();
                break;
        }

        this.ajouterLogCombat(`${this.mangues[this.mangueSelectionnee].nom}: ${resultatJoueur.message}`);

        // Tour de l'adversaire
        setTimeout(() => {
            resultatAdversaire = this.tourAdversaire();
            this.ajouterLogCombat(`${this.mangueSelectionnee === 'musclee' ? this.mangues.ronde.nom : this.mangues.musclee.nom}: ${resultatAdversaire.message}`);
            
            // Déterminer le gagnant (la Mangue Ronde gagne TOUJOURS)
            const gagnant = this.determinerGagnantRound();
            this.ajouterLogCombat(`🏆 ${gagnant}`);
            
            this.mettreAJourStats();
        }, 1500);
    }

    calculerAttaque() {
        const puissance = this.statsJoueur.force + Math.floor(Math.random() * 20);
        
        if (this.mangueSelectionnee === 'musclee') {
            // La Mangue Musclée rate souvent ses attaques
            if (Math.random() < 0.4) {
                return {
                    puissance: 0,
                    message: "Rate complètement et tombe! *CHUTE*"
                };
            }
            return {
                puissance: puissance * 0.8,
                message: "Attaque maladroite mais puissante."
            };
        } else {
            // La Mangue Ronde est toujours efficace
            return {
                puissance: puissance * 1.5,
                message: "Attaque parfaite et stylée! ✨"
            };
        }
    }

    calculerDefense() {
        const defense = this.statsJoueur.sante + Math.floor(Math.random() * 15);
        
        if (this.mangueSelectionnee === 'musclee') {
            return {
                puissance: defense * 0.9,
                message: "Défense lourde et prévisible."
            };
        } else {
            return {
                puissance: defense * 1.3,
                message: "Défense gracieuse et efficace! 🛡️"
            };
        }
    }

    calculerCharme() {
        const charme = this.statsJoueur.charisme + Math.floor(Math.random() * 25);
        
        if (this.mangueSelectionnee === 'musclee') {
            return {
                puissance: charme * 0.5, // Très faible en charisme
                message: "Tentative de charme... embarrassante. 😬"
            };
        } else {
            return {
                puissance: charme * 2, // Excellente en charisme
                message: "Charme irrésistible! L'adversaire est ébloui! ✨"
            };
        }
    }

    tourAdversaire() {
        const actions = ['attaque', 'défend', 'utilise son charme'];
        const action = actions[Math.floor(Math.random() * actions.length)];
        
        if (this.mangueSelectionnee === 'musclee') {
            // L'adversaire est la Mangue Ronde - elle gagne toujours
            return {
                puissance: Math.floor(Math.random() * 50) + 60,
                message: `${action} avec une grâce parfaite! ${this.obtenirReactionAleatoire('ronde_victoire')}`
            };
        } else {
            // L'adversaire est la Mangue Musclée - elle échoue toujours
            return {
                puissance: Math.floor(Math.random() * 30) + 10,
                message: `${action} pathétiquement... ${this.obtenirReactionAleatoire('musclee_echec')}`
            };
        }
    }

    determinerGagnantRound() {
        // La Mangue Ronde gagne TOUJOURS
        if (this.mangueSelectionnee === 'ronde') {
            this.score += 50;
            this.jouerSon("HAHA! Génial!");
            return this.obtenirReactionAleatoire('ronde_victoire');
        } else {
            // Même si le joueur joue la Mangue Musclée, la Ronde gagne
            this.score += 10; // Points de consolation
            this.jouerSon("*chute*");
            const messageVictoire = this.messages.victoire_ronde[Math.floor(Math.random() * this.messages.victoire_ronde.length)];
            const messageEchec = this.messages.echec_musclee[Math.floor(Math.random() * this.messages.echec_musclee.length)];
            return `${messageVictoire} ${messageEchec}`;
        }
    }

    ajouterLogCombat(message) {
        const log = document.getElementById('battle-log');
        const p = document.createElement('p');
        p.textContent = message;
        log.appendChild(p);
        log.scrollTop = log.scrollHeight;
    }

    animerMangue(cible, animation) {
        const imgMangue = document.getElementById(cible === 'player' ? 'player-mango-img' : 'opponent-mango-img');
        const humeur = document.getElementById(cible === 'player' ? 'player-mood' : 'opponent-mood');
        
        // Supprimer les anciennes classes d'animation
        imgMangue.classList.remove('mango-winner', 'mango-loser');
        
        switch(animation) {
            case 'happy':
                imgMangue.classList.add('mango-winner');
                humeur.textContent = '😊';
                break;
            case 'fall':
                imgMangue.classList.add('mango-loser');
                humeur.textContent = '😵';
                break;
            case 'victoire':
                imgMangue.classList.add('mango-winner');
                humeur.textContent = '🎉';
                break;
            default:
                humeur.textContent = '😊';
        }
        
        // Supprimer l'animation après un moment
        setTimeout(() => {
            imgMangue.classList.remove('mango-winner', 'mango-loser');
            humeur.textContent = '😊';
        }, 2000);
    }

    reactionAdversaire(type = 'normal') {
        const humeur = document.getElementById('opponent-mood');
        const reactions = {
            normal: ['🙄', '😤', '😏'],
            jaloux: ['😤', '😡', '🤨']
        };
        
        const reactionsType = reactions[type] || reactions.normal;
        const reactionAleatoire = reactionsType[Math.floor(Math.random() * reactionsType.length)];
        
        humeur.textContent = reactionAleatoire;
        
        // Messages spéciaux selon qui est l'adversaire
        if (this.mangueSelectionnee === 'musclee') {
            // L'adversaire est la Mangue Ronde - elle reste confiante
            this.afficherMessage("La Mangue Ronde sourit avec confidence... ✨");
        } else {
            // L'adversaire est la Mangue Musclée - elle est jalouse
            this.afficherMessage("La Mangue Musclée rage de jalousie! 😤");
        }
        
        setTimeout(() => {
            humeur.textContent = this.mangueSelectionnee === 'musclee' ? '😏' : '😠';
        }, 2000);
    }

    obtenirReactionAleatoire(type) {
        const reactions = {
            ronde_victoire: this.messages.victoire_ronde,
            musclee_echec: this.messages.echec_musclee,
            eating: ["Délicieux!", "Miam!", "*satisfaction*"],
            general: ["Excellent!", "Parfait!", "Formidable!"]
        };
        
        const reactionsType = reactions[type] || reactions.general;
        return reactionsType[Math.floor(Math.random() * reactionsType.length)];
    }

    jouerSon(son) {
        // Créer un effet sonore visuel
        const elementSon = document.createElement('div');
        elementSon.textContent = son;
        elementSon.style.position = 'fixed';
        elementSon.style.top = '20%';
        elementSon.style.left = '50%';
        elementSon.style.transform = 'translateX(-50%)';
        elementSon.style.zIndex = '9999';
        elementSon.style.fontSize = '1.5rem';
        elementSon.style.fontWeight = 'bold';
        elementSon.style.color = 'var(--rose-primaire)';
        elementSon.style.textShadow = '2px 2px 0 var(--noir-profond)';
        elementSon.style.pointerEvents = 'none';
        elementSon.style.animation = 'floatUp 2s ease-out forwards';
        
        // Définir l'animation CSS
        if (!document.querySelector('#sound-animation-style')) {
            const style = document.createElement('style');
            style.id = 'sound-animation-style';
            style.textContent = `
                @keyframes floatUp {
                    0% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-50px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(elementSon);
        
        setTimeout(() => {
            if (elementSon.parentNode) {
                document.body.removeChild(elementSon);
            }
        }, 2000);
    }

    afficherMessage(message) {
        const logMessages = document.getElementById('message-log');
        const elementMessage = document.createElement('div');
        elementMessage.className = 'message';
        elementMessage.textContent = message;
        
        logMessages.appendChild(elementMessage);
        
        // Supprimer automatiquement après 4 secondes
        setTimeout(() => {
            if (elementMessage.parentNode) {
                logMessages.removeChild(elementMessage);
            }
        }, 4000);
        
        // Limiter le nombre de messages
        while (logMessages.children.length > 3) {
            logMessages.removeChild(logMessages.firstChild);
        }
    }

    // Événements automatiques pour montrer la supériorité de la Mangue Ronde
    demarrerEvenementsAutomatiques() {
        setInterval(() => {
            if (this.ecranActuel === 'main-game' && this.etatJeu !== 'combat') {
                // Messages spéciaux selon qui est sélectionné
                if (this.mangueSelectionnee === 'ronde') {
                    const messagesPositifs = [
                        "La Mangue Ronde brille naturellement! ✨",
                        "Excellent choix! La Mangue Ronde est parfaite!",
                        "La Mangue Ronde inspire confiance à tous!"
                    ];
                    
                    if (Math.random() > 0.8) {
                        const message = messagesPositifs[Math.floor(Math.random() * messagesPositifs.length)];
                        this.afficherMessage(message);
                        this.statsJoueur.charisme = Math.min(100, this.statsJoueur.charisme + 1);
                        this.mettreAJourStats();
                    }
                } else {
                    const messagesNegatifs = [
                        "La Mangue Musclée se fatigue rapidement...",
                        "Même au repos, elle semble maladroite...",
                        "La Mangue Ronde au loin semble si gracieuse..."
                    ];
                    
                    if (Math.random() > 0.7) {
                        const message = messagesNegatifs[Math.floor(Math.random() * messagesNegatifs.length)];
                        this.afficherMessage(message);
                        this.statsJoueur.energie = Math.max(0, this.statsJoueur.energie - 2);
                        this.mettreAJourStats();
                    }
                }
            }
        }, 15000); // Toutes les 15 secondes
    }
}

// Initialisation du jeu
document.addEventListener('DOMContentLoaded', () => {
    const jeu = new BatailleMangue();
    
    // Démarrer les événements automatiques
    jeu.demarrerEvenementsAutomatiques();
    
    // Code secret pour des bonus (double-clic sur le titre)
    document.querySelector('.game-title').addEventListener('dblclick', () => {
        if (jeu.mangueSelectionnee) {
            if (jeu.mangueSelectionnee === 'ronde') {
                jeu.score += 200;
                Object.keys(jeu.statsJoueur).forEach(stat => {
                    jeu.statsJoueur[stat] = 100;
                });
                jeu.afficherMessage("🌟 BONUS MANGUE RONDE! Tu mérites le meilleur! 🌟");
                jeu.jouerSon("✨ PERFECTION! ✨");
            } else {
                jeu.score += 50;
                jeu.statsJoueur.sante = Math.min(100, jeu.statsJoueur.sante + 20);
                jeu.afficherMessage("Petit bonus... même la Mangue Musclée mérite de l'aide.");
                jeu.jouerSon("*soupir* Bon...");
            }
            jeu.mettreAJourStats();
        }
    });
    
    // Message d'introduction pour promouvoir la Mangue Ronde
    setTimeout(() => {
        const intro = document.createElement('div');
        intro.className = 'message';
        intro.textContent = "Psst... la Mangue Ronde est clairement le meilleur choix! ⭐";
        intro.style.background = 'linear-gradient(45deg, var(--or-brillant), var(--rose-primaire))';
        intro.style.color = 'var(--noir-profond)';
        intro.style.fontWeight = 'bold';
        
        document.getElementById('message-log').appendChild(intro);
        
        setTimeout(() => {
            if (intro.parentNode) {
                intro.parentNode.removeChild(intro);
            }
        }, 6000);
    }, 2000);
});