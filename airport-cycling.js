/**
 * Canadian Airport Cycling Module for Splitflap Display
 * Uses ICAO codes from Canadian airports data
 */

// Canadian Airport Cycling Configuration
let airportCyclingMode = false;
let airportCyclingInterval = null;
let airportCycleDuration = 120000; // Default: 2 minutes
let currentAirportIndex = 0;

// Canadian airports using ICAO codes (4 characters, perfect for 6-char display)
const canadianAirports = [
    'CYYC', 'CYVR', 'CYYZ', 'CYUL', 'CYEG', 'CYHZ', 'CYQB', 'CYWG', 'CYXE', 'CYQR',
    'CYYJ', 'CYXU', 'CYGK', 'CYQG', 'CYKF', 'CYHM', 'CYOW', 'CYQM', 'CYFC', 'CYQI',
    'CYQX', 'CYYT', 'CYDF', 'CYAM', 'CYSB', 'CYQT', 'CYTS', 'CYTH', 'CYXL', 'CYQD',
    'CYBR', 'CYLL', 'CYQF', 'CYEN', 'CYBG', 'CYBC', 'CYVP', 'CYXR', 'CYEY', 'CYGL',
    'CYFE', 'CYYU', 'CYQN', 'CYQK', 'CYMO', 'CYNA', 'CYNM', 'CYME', 'CYML', 'CYYY',
    'CYMJ', 'CYQL', 'CYXH', 'CYQU', 'CYXS', 'CYXJ', 'CYYE', 'CYSM', 'CYFS', 'CYFR',
    'CYER', 'CYPY', 'CYGH', 'CYFH', 'CYJF', 'CYMM', 'CZFM', 'CYFA', 'CYFO', 'CZFD',
    'CYDA', 'CYDQ', 'CYDL', 'CYVZ', 'CYWJ', 'CYID', 'CYPR', 'CYZD', 'CYDC', 'CYET',
    'CYOA', 'CYEL', 'CYEU', 'CYND', 'CZFA', 'CYPA', 'CYGO', 'CZGI', 'CYYR', 'CYZE',
    'CZGF', 'CYGQ', 'CZGS', 'CYGX', 'CYGB', 'CYGM', 'CYHK', 'CYGR', 'CYHT', 'CYHY',
    'CYHF', 'CYHB', 'CYGT', 'CZUC', 'CYPH', 'CYEV', 'CYFB', 'CYIV', 'CYIK', 'CYKA',
    'CYLU', 'CYKG', 'CYAS', 'CYAQ', 'CZKE', 'CYAU', 'CYLW', 'CYKJ', 'CYKX', 'CYKO',
    'CYBB', 'CYCO', 'CYVC', 'CYFJ', 'CYLH', 'CYLR', 'CYYL', 'CYFT', 'CYMG', 'CYMW',
    'CYSP', 'CYMA', 'CYLJ', 'CYMX', 'CYCH', 'CYQA', 'CZMD', 'CYNT', 'CYDP', 'CYSR',
    'CYRT', 'CYOO', 'CYOH', 'CYIF', 'CYXP', 'CYPC', 'CYPE', 'CYPO', 'CYTA', 'CYQS',
    'CYPQ', 'CYPL', 'CYPM', 'CZMN', 'EHYP', 'CYZT', 'CYPD', 'CCP4', 'CYPN', 'CYPG',
    'CYPW', 'CYPX', 'CYVM', 'CUHA', 'CYRA', 'VEGK', 'CYRL', 'CYRS', 'CYUT', 'CYRB',
    'CYRV', 'CCZ2', 'CYXK', 'CYRI', 'CYRJ', 'CYRM', 'CYUY', 'CZPB', 'CYSY', 'CYSJ',
    'CYZG', 'CZAM', 'CYZP', 'CZSJ', 'CYSK', 'CYZR', 'CYKL', 'CYZV', 'CZTM', 'CYAW',
    'CYSC', 'CYYD', 'CYAY', 'CYSN', 'CYHU', 'CYJN', 'CYSL', 'CYDO', 'CYST', 'CYJT',
    'CZST', 'CYSF', 'CYSU', 'CZJN', 'CYYN', 'CYQY', 'CYBQ', 'CYYH', 'CYXT', 'CYZW',
    'CTB6', 'CZLQ', 'CYTR', 'CYRQ', 'CYUB', 'CZFN', 'CYMU', 'CYBE', 'CYVG', 'CYVK',
    'CYWK', 'CYQH', 'CYXZ', 'CYWP', 'CYNC', 'CEM3', 'CYXN', 'CYZU', 'CYXY', 'CYVV',
    'CCA6', 'CYWL', 'CZWL', 'CYWY', 'CKL3', 'CZAC', 'CYQV'
];

// Airport cycle duration options
const airportCycleDurations = {
    120000: '2 minutes',
    300000: '5 minutes',
    900000: '15 minutes',
    1800000: '30 minutes'
};

/**
 * Toggle airport cycling mode on/off
 */
function toggleAirportCycling() {
    const airportButton = document.getElementById('airportButton');
    const intervalStatus = document.getElementById('airportIntervalStatus');
    const intervalText = airportCycleDurations[airportCycleDuration];
    
    if (airportCyclingMode) {
        airportCyclingMode = false;
        clearInterval(airportCyclingInterval);
        airportButton.textContent = '🛬 Start Airport Cycle';
        airportButton.className = 'button preset-button';
        intervalStatus.style.display = 'none';
        addMessage('🛬 Airport cycling stopped');
        document.getElementById('currentAirportInfo').style.display = 'none';
    } else {
        if (!isConnected) {
            alert('Not connected to MQTT broker! Check the Advanced Settings tab.');
            return;
        }
        
        // Stop other modes
        if (clockMode) {
            addMessage('🕐 Clock stopped - airport cycling started');
            toggleClock();
        }
        
        if (flightTrackingMode) {
            addMessage('✈️ Flight tracking stopped - airport cycling started');
            toggleFlightTracking();
        }
        
        airportCyclingMode = true;
        airportButton.textContent = '⏹️ Stop Airport Cycle';
        airportButton.className = 'button preset-button flight-active';
        
        // Show interval status
        intervalStatus.style.display = 'flex';
        document.getElementById('airportIntervalText').textContent = `Cycling airports every ${intervalText}`;
        
        addMessage(`🛬 Airport cycling started - ${canadianAirports.length} Canadian airports`);
        addMessage(`⏰ Cycling every ${intervalText}`);
        
        // Start immediately
        sendNextAirport();
        airportCyclingInterval = setInterval(sendNextAirport, airportCycleDuration);
    }
}

/**
 * Send the next airport in the sequence to the display
 */
function sendNextAirport() {
    if (!airportCyclingMode || !isConnected) return;
    
    const airport = canadianAirports[currentAirportIndex];
    
    try {
        // ICAO codes are 4 chars, so we can add 2 spaces to center on 6-char display
        const displayText = '  ' + airport;
        
        mqttClient.publish(MQTT_TOPIC, displayText, { qos: 0 });
        addMessage(`🛬 Airport ${currentAirportIndex + 1}/${canadianAirports.length}: ${airport}`);
        
        // Update display info
        updateAirportDisplay(airport, currentAirportIndex + 1);
        
        // Move to next airport
        currentAirportIndex = (currentAirportIndex + 1) % canadianAirports.length;
        
        if (currentAirportIndex === 0) {
            addMessage(`🔄 Completed full cycle of ${canadianAirports.length} airports, starting over`);
        }
        
    } catch (error) {
        addMessage('❌ Airport cycling error: ' + error.message);
    }
}

/**
 * Update the airport display info panel
 */
function updateAirportDisplay(airport, position) {
    document.getElementById('currentAirportInfo').style.display = 'block';
    document.getElementById('airportCode').textContent = airport;
    document.getElementById('airportPosition').textContent = `${position} of ${canadianAirports.length}`;
    document.getElementById('airportLastUpdate').textContent = new Date().toLocaleTimeString();
}

/**
 * Update the airport cycling duration interval
 */
function updateAirportCycleDuration() {
    const intervalSelect = document.getElementById('airportIntervalSelect');
    const newDuration = parseInt(intervalSelect.value);
    
    if (newDuration !== airportCycleDuration) {
        airportCycleDuration = newDuration;
        const intervalText = airportCycleDurations[airportCycleDuration];
        
        addMessage(`⏰ Airport cycle duration updated to ${intervalText}`);
        
        // Update the status display
        const intervalStatus = document.getElementById('airportIntervalStatus');
        const intervalTextElement = document.getElementById('airportIntervalText');
        
        if (airportCyclingMode) {
            intervalTextElement.textContent = `Cycling airports every ${intervalText}`;
            intervalStatus.style.display = 'flex';
            
            // Restart the interval with new timing
            clearInterval(airportCyclingInterval);
            airportCyclingInterval = setInterval(sendNextAirport, airportCycleDuration);
            addMessage(`🔄 Airport cycling restarted with ${intervalText} interval`);
        }
    }
}

/**
 * Manually send the current airport
 */
function sendCurrentAirport() {
    if (!isConnected) {
        alert('Not connected to MQTT broker!');
        return;
    }
    
    const airport = canadianAirports[currentAirportIndex];
    const displayText = '  ' + airport;
    
    mqttClient.publish(MQTT_TOPIC, displayText, { qos: 0 });
    addMessage(`🛬 Manually sent airport: ${airport}`);
    updateAirportDisplay(airport, currentAirportIndex + 1);
}

/**
 * Clear airport data and hide display
 */
function clearAirportData() {
    document.getElementById('currentAirportInfo').style.display = 'none';
    addMessage('🗑️ Airport display cleared');
}

/**
 * Reset airport cycling to defaults
 */
function resetAirportCycling() {
    if (airportCyclingMode) {
        toggleAirportCycling();
    }
    
    // Reset to defaults
    airportCycleDuration = 120000;
    currentAirportIndex = 0;
    
    // Reset UI elements
    const intervalSelect = document.getElementById('airportIntervalSelect');
    if (intervalSelect) {
        intervalSelect.value = '120000';
    }
    
    const intervalStatus = document.getElementById('airportIntervalStatus');
    if (intervalStatus) {
        intervalStatus.style.display = 'none';
    }
    
    const airportInfo = document.getElementById('currentAirportInfo');
    if (airportInfo) {
        airportInfo.style.display = 'none';
    }
}

// Export functions for external use (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        toggleAirportCycling,
        updateAirportCycleDuration,
        sendCurrentAirport,
        clearAirportData,
        resetAirportCycling,
        canadianAirports
    };
}