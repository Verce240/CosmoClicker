// Stato del gioco
let game = {
    // Risorse
    energy: 0,
    clickValue: 1,
    energyPerSecond: 0,
    stars: 0,
    
    // Produttori
    producers: {
        satellite: {
            count: 0,
            baseCost: 10,
            production: 1
        },
        station: {
            count: 0,
            baseCost: 100,
            production: 5
        },
        colony: {
            count: 0,
            baseCost: 1000,
            production: 20
        }
    },
    
    // Potenziamenti
    upgrades: {
        clickUpgrade: {
            purchased: false,
            cost: 50,
            multiplier: 2
        },
        productionUpgrade: {
            purchased: false,
            cost: 200,
            multiplier: 1.5
        }
    },
    
    // Ultimo aggiornamento
    lastUpdate: Date.now()
};

// Elementi DOM
const elements = {
    // Risorse
    energy: document.getElementById('energy'),
    energyPerSecond: document.getElementById('energy-per-second'),
    clickValue: document.getElementById('click-value'),
    stars: document.getElementById('stars'),
    starsGain: document.getElementById('stars-gain'),
    
    // Produttori
    satelliteCount: document.getElementById('satellite-count'),
    satelliteCost: document.getElementById('satellite-cost'),
    stationCount: document.getElementById('station-count'),
    stationCost: document.getElementById('station-cost'),
    colonyCount: document.getElementById('colony-count'),
    colonyCost: document.getElementById('colony-cost'),
    
    // Pulsanti produttori
    buySatellite: document.getElementById('buy-satellite'),
    buyStation: document.getElementById('buy-station'),
    buyColony: document.getElementById('buy-colony'),
    
    // Potenziamenti
    clickUpgrade: document.getElementById('click-upgrade'),
    clickUpgradeCost: document.getElementById('click-upgrade-cost'),
    productionUpgrade: document.getElementById('production-upgrade'),
    productionUpgradeCost: document.getElementById('production-upgrade-cost'),
    
    // Pulsanti potenziamenti
    buyClickUpgrade: document.getElementById('buy-click-upgrade'),
    buyProductionUpgrade: document.getElementById('buy-production-upgrade'),
    
    // Pulsante reset
    resetButton: document.getElementById('reset-button'),
    
    // Area cliccabile
    planet: document.getElementById('planet'),
    
    // Tab
    tabButtons: document.querySelectorAll('.tab-button'),
    tabPanes: document.querySelectorAll('.tab-pane')
};

// Inizializzazione
function init() {
    // Carica il salvataggio
    loadGame();
    
    // Imposta gli event listener
    setupEventListeners();
    
    // Aggiorna l'interfaccia
    updateUI();
    
    // Avvia il loop di gioco
    setInterval(gameLoop, 1000);
    
    // Imposta il salvataggio automatico
    setInterval(saveGame, 30000);
}

// Imposta gli event listener
function setupEventListeners() {
    // Click sul pianeta
    elements.planet.addEventListener('click', clickPlanet);
    
    // Acquisto produttori
    elements.buySatellite.addEventListener('click', () => buyProducer('satellite'));
    elements.buyStation.addEventListener('click', () => buyProducer('station'));
    elements.buyColony.addEventListener('click', () => buyProducer('colony'));
    
    // Acquisto potenziamenti
    elements.buyClickUpgrade.addEventListener('click', () => buyUpgrade('clickUpgrade'));
    elements.buyProductionUpgrade.addEventListener('click', () => buyUpgrade('productionUpgrade'));
    
    // Reset
    elements.resetButton.addEventListener('click', resetGame);
    
    // Tab
    elements.tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Click sul pianeta con particella
    document.getElementById('planet').addEventListener('click', (e) => {
        const particle = document.createElement('div');
        particle.classList.add('energy-particle');
        particle.textContent = '';
        document.body.appendChild(particle);

        // Posiziona la particella vicino al click
        particle.style.left = `${e.clientX}px`;
        particle.style.top = `${e.clientY}px`;

        // Rimuovi la particella dopo l'animazione
        particle.addEventListener('animationend', () => {
            particle.remove();
        });
    });

    // Reset game button
    document.getElementById('reset-game-button').addEventListener('click', () => {
        if (confirm('Sei sicuro di voler resettare la partita? Tutti i progressi andranno persi!')) {
            // Resetta i valori delle risorse e dei progressi
            game.energy = 0;
            game.energyPerSecond = 0;
            game.clickValue = 1;
            game.stars = 0;
            
            // Resetta i produttori
            for (const type in game.producers) {
                game.producers[type].count = 0;
            }
    
            // Resetta i potenziamenti
            for (const type in game.upgrades) {
                game.upgrades[type].purchased = false;
            }
    
            // Ricalcola la produzione
            calculateProduction();
    
            // Aggiorna l'interfaccia
            updateUI();
    
            alert('Partita resettata con successo!');
        }
    });
}

// Click sul pianeta
function clickPlanet() {
    // Calcola il guadagno
    let gain = game.clickValue;
    
    // Applica bonus dalle stelle
    gain *= (1 + game.stars * 0.1);
    
    // Aggiorna l'energia
    game.energy += gain;
    
    // Crea effetto particella
    createEnergyParticle(gain);
    
    // Aggiorna l'interfaccia
    updateResourcesUI();
}

// Crea una particella di energia
function createEnergyParticle(value) {
    const particle = document.createElement('div');
    particle.className = 'energy-particle';
    particle.textContent = `+${Math.floor(value)}`;
    
    // Posizione casuale intorno al pianeta
    const planetRect = elements.planet.getBoundingClientRect();
    const x = planetRect.left + planetRect.width / 2 + (Math.random() * 40 - 20);
    const y = planetRect.top + planetRect.height / 2;
    
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    
    document.body.appendChild(particle);
    
    // Rimuovi la particella dopo l'animazione
    setTimeout(() => {
        particle.remove();
    }, 1000);
}

// Acquista un produttore
function buyProducer(type) {
    const producer = game.producers[type];
    const cost = calculateCost(producer.baseCost, producer.count);
    
    if (game.energy >= cost) {
        game.energy -= cost;
        producer.count++;
        
        // Ricalcola la produzione
        calculateProduction();
        
        // Aggiorna l'interfaccia
        updateProducersUI();
        updateResourcesUI();
    }
}

// Calcola il costo di un produttore
function calculateCost(baseCost, count) {
    return Math.floor(baseCost * Math.pow(1.15, count));
}

// Acquista un potenziamento
function buyUpgrade(type) {
    const upgrade = game.upgrades[type];
    
    if (!upgrade.purchased && game.energy >= upgrade.cost) {
        game.energy -= upgrade.cost;
        upgrade.purchased = true;
        
        // Applica l'effetto del potenziamento
        if (type === 'clickUpgrade') {
            game.clickValue *= upgrade.multiplier;
        }
        
        // Ricalcola la produzione per potenziamenti di produzione
        calculateProduction();
        
        // Aggiorna l'interfaccia
        updateUpgradesUI();
        updateResourcesUI();
    }
}

// Calcola la produzione totale
function calculateProduction() {
    let total = 0;
    
    // Calcola la produzione di ogni produttore
    for (const type in game.producers) {
        const producer = game.producers[type];
        let production = producer.production * producer.count;
        
        // Applica bonus dal potenziamento di produzione
        if (game.upgrades.productionUpgrade.purchased) {
            production *= game.upgrades.productionUpgrade.multiplier;
        }
        
        // Applica bonus dalle stelle
        production *= (1 + game.stars * 0.1);
        
        total += production;
    }
    
    game.energyPerSecond = total;
}

// Reset del gioco
function resetGame() {
    // Calcola il guadagno di stelle
    const starsGain = calculateStarsGain();
    
    if (starsGain > 0) {
        if (confirm(`Sei sicuro di voler resettare il gioco? Guadagnerai ${starsGain} stelle.`)) {
            // Aggiorna le stelle
            game.stars += starsGain;
            
            // Resetta il gioco
            game.energy = 0;
            game.clickValue = 1;
            game.energyPerSecond = 0;
            
            // Resetta i produttori
            for (const type in game.producers) {
                game.producers[type].count = 0;
            }
            
            // Resetta i potenziamenti
            for (const type in game.upgrades) {
                game.upgrades[type].purchased = false;
            }
            
            // Ricalcola la produzione
            calculateProduction();
            
            // Aggiorna l'interfaccia
            updateUI();
        }
    } else {
        alert('Hai bisogno di più energia per guadagnare stelle!');
    }
}

// Calcola il guadagno di stelle
function calculateStarsGain() {
    return Math.floor(Math.sqrt(game.energy / 1000));
}

// Cambia tab
function switchTab(tabId) {
    // Rimuovi la classe active da tutti i pulsanti e pannelli
    elements.tabButtons.forEach(button => button.classList.remove('active'));
    elements.tabPanes.forEach(pane => pane.classList.remove('active'));
    
    // Aggiungi la classe active al pulsante e pannello selezionati
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// Loop principale del gioco
function gameLoop() {
    const now = Date.now();
    const deltaTime = (now - game.lastUpdate) / 1000;
    
    // Aggiorna l'energia
    game.energy += game.energyPerSecond * deltaTime;
    
    // Aggiorna l'interfaccia
    updateResourcesUI();
    updateProducersUI();
    updateUpgradesUI();
    
    // Aggiorna il timestamp
    game.lastUpdate = now;
}

// Aggiorna l'interfaccia
function updateUI() {
    updateResourcesUI();
    updateProducersUI();
    updateUpgradesUI();
}

// Aggiorna l'interfaccia delle risorse
function updateResourcesUI() {
    elements.energy.textContent = Math.floor(game.energy);
    elements.energyPerSecond.textContent = game.energyPerSecond.toFixed(1);
    elements.clickValue.textContent = game.clickValue;
    elements.stars.textContent = game.stars;
    elements.starsGain.textContent = calculateStarsGain();
}

// Aggiorna l'interfaccia dei produttori
function updateProducersUI() {
    // Satellite
    elements.satelliteCount.textContent = game.producers.satellite.count;
    elements.satelliteCost.textContent = calculateCost(game.producers.satellite.baseCost, game.producers.satellite.count);
    elements.buySatellite.disabled = game.energy < calculateCost(game.producers.satellite.baseCost, game.producers.satellite.count);
    
    // Stazione
    elements.stationCount.textContent = game.producers.station.count;
    elements.stationCost.textContent = calculateCost(game.producers.station.baseCost, game.producers.station.count);
    elements.buyStation.disabled = game.energy < calculateCost(game.producers.station.baseCost, game.producers.station.count);
    
    // Colonia
    elements.colonyCount.textContent = game.producers.colony.count;
    elements.colonyCost.textContent = calculateCost(game.producers.colony.baseCost, game.producers.colony.count);
    elements.buyColony.disabled = game.energy < calculateCost(game.producers.colony.baseCost, game.producers.colony.count);
}

// Aggiorna l'interfaccia dei potenziamenti
function updateUpgradesUI() {
    // Click upgrade
    if (game.upgrades.clickUpgrade.purchased) {
        elements.buyClickUpgrade.textContent = 'Acquistato';
        elements.buyClickUpgrade.disabled = true;
    } else {
        elements.buyClickUpgrade.disabled = game.energy < game.upgrades.clickUpgrade.cost;
    }
    
    // Production upgrade
    if (game.upgrades.productionUpgrade.purchased) {
        elements.buyProductionUpgrade.textContent = 'Acquistato';
        elements.buyProductionUpgrade.disabled = true;
    } else {
        elements.buyProductionUpgrade.disabled = game.energy < game.upgrades.productionUpgrade.cost;
    }
}

// Salva il gioco
function saveGame() {
    localStorage.setItem('spaceClickerSave', JSON.stringify(game));
}

// Carica il gioco
function loadGame() {
    const savedGame = localStorage.getItem('spaceClickerSave');
    
    if (savedGame) {
        game = JSON.parse(savedGame);
        game.lastUpdate = Date.now();
    }
}

// Inizializza il gioco quando il DOM è caricato
document.addEventListener('DOMContentLoaded', init);