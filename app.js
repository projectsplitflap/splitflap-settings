// Splitflap Display Controller JavaScript
// Global state
let splitflapDevice = null;
let firebase = null;
let firebaseDB = null;
let isConnectedToDevice = false;
let isConnectedToFirebase = false;
let currentMode = 'manual';
let timeInterval = null;
let flightInterval = null;
let remoteEnabled = false;
let numModules = 6;
let currentText = '';
let moduleStates = [];

// Initialize module states
for (let i = 0; i < numModules; i++) {
    moduleStates.push({
        state: 'normal',
        character: ' ',
        moving: false,
        error: false
    });
}

// Logging function
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logElement = document.getElementById('systemLogs');
    const logLine = `[${timestamp}] ${message}\n`;
    logElement.textContent += logLine;
    logElement.scrollTop = logElement.scrollHeight;
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// Update module preview
function updateModulePreview() {
    const preview = document.getElementById('modulePreview');
    preview.innerHTML = '';
    
    for (let i = 0; i < numModules; i++) {
        const module = document.createElement('div');
        module.className = 'module';
        module.textContent = moduleStates[i].character || ' ';
        
        if (moduleStates[i].error) {
            module.classList.add('error');
        } else if (moduleStates[i].moving) {
            module.classList.add('moving');
        }
        
        module.addEventListener('click', () => calibrateModule(i));
        preview.appendChild(module);
    }
}

// Update connection status
function updateConnectionStatus() {
    const serialStatus = document.getElementById('serialStatus');
    const serialStatusText = document.getElementById('serialStatusText');
    const firebaseStatus = document.getElementById('firebaseStatus');
    
    if (isConnectedToDevice) {
        serialStatus.classList.add('connected');
        serialStatusText.textContent = `Device: Connected (${numModules} modules)`;
    } else {
        serialStatus.classList.remove('connected');
        serialStatusText.textContent = 'Device: Disconnected';
    }
    
    if (isConnectedToFirebase) {
        firebaseStatus.className = 'firebase-status connected';
        firebaseStatus.textContent = 'Firebase: Connected';
    } else {
        firebaseStatus.className = 'firebase-status disconnected';
        firebaseStatus.textContent = 'Firebase: Disconnected';
    }
}

// HTTP API communication class for ESP32
class SplitflapHTTP {
    constructor(baseUrl) {
        // Clean up the URL
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
            baseUrl = 'http://' + baseUrl;
        }
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.isConnected = false;
    }

    async connect() {
        try {
            const response = await fetch(`${this.baseUrl}/api/status`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
                const status = await response.json();
                this.isConnected = true;
                numModules = status.modules || 6;
                log(`Connected to splitflap at ${this.baseUrl}`);
                log(`Device info: ${status.modules} modules, RSSI: ${status.wifi_rssi}dBm`);
                return true;
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            log(`Connection failed: ${error.message}`, 'error');
            this.isConnected = false;
            return false;
        }
    }

    disconnect() {
        this.isConnected = false;
        log('Disconnected from splitflap display');
    }

    async setText(text) {
        if (!this.isConnected) {
            throw new Error('Not connected to device');
        }
        
        try {
            const formData = new FormData();
            formData.append('text', text);
            
            const response = await fetch(`${this.baseUrl}/api/text`, {
                method: 'POST',
                body: formData,
                signal: AbortSignal.timeout(10000)
            });
            
            if (response.ok) {
                const result = await response.json();
                currentText = result.text || text;
                
                // Update module states
                for (let i = 0; i < numModules; i++) {
                    moduleStates[i].character = currentText[i] || ' ';
                    moduleStates[i].moving = true;
                }
                updateModulePreview();
                
                // Simulate movement completion
                setTimeout(() => {
                    for (let i = 0; i < numModules; i++) {
                        moduleStates[i].moving = false;
                    }
                    updateModulePreview();
                }, 2000);
                
                log(`Display updated: "${text}"`);
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            log(`Failed to set text: ${error.message}`, 'error');
            throw error;
        }
    }

    async homeAllModules() {
        if (!this.isConnected) {
            throw new Error('Not connected to device');
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/api/home`, {
                method: 'POST',
                signal: AbortSignal.timeout(30000)
            });
            
            if (response.ok) {
                log('Homing all modules...');
                // Simulate homing
                for (let i = 0; i < numModules; i++) {
                    moduleStates[i].moving = true;
                }
                updateModulePreview();
                
                setTimeout(() => {
                    for (let i = 0; i < numModules; i++) {
                        moduleStates[i].moving = false;
                        moduleStates[i].character = ' ';
                    }
                    updateModulePreview();
                    log('All modules homed');
                }, 5000);
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            log(`Failed to home modules: ${error.message}`, 'error');
            throw error;
        }
    }

    async calibrateModule(index) {
        if (!this.isConnected) {
            throw new Error('Not connected to device');
        }
        
        try {
            const formData = new FormData();
            formData.append('module', index.toString());
            
            const response = await fetch(`${this.baseUrl}/api/calibrate`, {
                method: 'POST',
                body: formData,
                signal: AbortSignal.timeout(30000)
            });
            
            if (response.ok) {
                log(`Calibrating module ${index}...`);
                moduleStates[index].moving = true;
                updateModulePreview();
                
                setTimeout(() => {
                    moduleStates[index].moving = false;
                    updateModulePreview();
                    log(`Module ${index} calibrated`);
                }, 3000);
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            log(`Failed to calibrate module: ${error.message}`, 'error');
            throw error;
        }
    }

    getNumModules() {
        return numModules;
    }
}

// Firebase functions
function initFirebase(config) {
    try {
        const firebaseConfig = JSON.parse(config);
        firebase.initializeApp(firebaseConfig);
        firebaseDB = firebase.database();
        isConnectedToFirebase = true;
        updateConnectionStatus();
        log('Connected to Firebase');
        updateRemoteUrl();
        return true;
    } catch (error) {
        log(`Firebase connection failed: ${error.message}`, 'error');
        return false;
    }
}

function updateRemoteUrl() {
    const deviceName = document.getElementById('deviceName').value;
    const urlElement = document.getElementById('remoteUrl');
    if (isConnectedToFirebase && deviceName) {
        urlElement.textContent = `${window.location.origin}${window.location.pathname}?device=${deviceName}`;
    } else {
        urlElement.textContent = 'Connect to Firebase first';
    }
}

function enableRemoteControl() {
    if (!isConnectedToFirebase) {
        log('Firebase not connected', 'error');
        return;
    }

    const deviceName = document.getElementById('deviceName').value;
    if (!deviceName) {
        log('Device name required', 'error');
        return;
    }

    remoteEnabled = true;
    
    // Listen for remote commands
    const deviceRef = firebaseDB.ref(`devices/${deviceName}/commands`);
    deviceRef.on('child_added', (snapshot) => {
        const command = snapshot.val();
        handleRemoteCommand(command);
        // Remove processed command
        snapshot.ref.remove();
    });

    // Update device status
    firebaseDB.ref(`devices/${deviceName}/status`).set({
        online: true,
        lastSeen: firebase.database.ServerValue.TIMESTAMP,
        modules: numModules
    });

    log(`Remote control enabled for device: ${deviceName}`);
}

function disableRemoteControl() {
    remoteEnabled = false;
    const deviceName = document.getElementById('deviceName').value;
    if (isConnectedToFirebase && deviceName) {
        firebaseDB.ref(`devices/${deviceName}/commands`).off();
        firebaseDB.ref(`devices/${deviceName}/status/online`).set(false);
    }
    log('Remote control disabled');
}

function handleRemoteCommand(command) {
    log(`Remote command received: ${command.type}`);
    
    switch (command.type) {
        case 'setText':
            if (splitflapDevice && splitflapDevice.isConnected) {
                splitflapDevice.setText(command.text);
            }
            break;
        case 'startTime':
            startTimeDisplay(command.format);
            break;
        case 'stopTime':
            stopTimeDisplay();
            break;
        case 'startFlight':
            startFlightTracking(command.location, command.radius);
            break;
        case 'stopFlight':
            stopFlightTracking();
            break;
        case 'calibrate':
            if (splitflapDevice && splitflapDevice.isConnected) {
                if (command.module !== undefined) {
                    splitflapDevice.calibrateModule(command.module);
                } else {
                    splitflapDevice.homeAllModules();
                }
            }
            break;
    }
}

// Mode switching
function switchMode(mode) {
    currentMode = mode;
    
    // Update tab appearance
    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.mode === mode) {
            tab.classList.add('active');
        }
    });
    
    // Show/hide mode panels
    document.getElementById('manualMode').style.display = mode === 'manual' ? 'block' : 'none';
    document.getElementById('timeMode').style.display = mode === 'time' ? 'block' : 'none';
    document.getElementById('flightMode').style.display = mode === 'flight' ? 'block' : 'none';
    
    // Stop other modes
    if (mode !== 'time') stopTimeDisplay();
    if (mode !== 'flight') stopFlightTracking();
}

// Time display functions
function startTimeDisplay(format = null) {
    if (!splitflapDevice || !splitflapDevice.isConnected) {
        log('Device not connected', 'error');
        return;
    }

    const timeFormat = format || document.getElementById('timeFormat').value;
    log(`Starting time display with format: ${timeFormat}`);
    
    function updateTime() {
        const now = new Date();
        let timeString;
        
        switch (timeFormat) {
            case 'HH:MM':
                timeString = now.toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                break;
            case 'HH:MM:SS':
                timeString = now.toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                });
                break;
            case 'h:MM A':
                timeString = now.toLocaleTimeString('en-US', { 
                    hour12: true, 
                    hour: 'numeric', 
                    minute: '2-digit' 
                });
                break;
            default:
                timeString = now.toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
        }
        
        splitflapDevice.setText(timeString);
    }
    
    updateTime();
    timeInterval = setInterval(updateTime, 1000);
}

function stopTimeDisplay() {
    if (timeInterval) {
        clearInterval(timeInterval);
        timeInterval = null;
        log('Time display stopped');
    }
}

// Flight tracking functions (mock implementation)
function startFlightTracking(location = null, radius = null) {
    if (!splitflapDevice || !splitflapDevice.isConnected) {
        log('Device not connected', 'error');
        return;
    }

    const flightLocation = location || document.getElementById('flightLocation').value;
    const flightRadius = radius || document.getElementById('flightRadius').value;
    
    log(`Starting flight tracking near ${flightLocation} (${flightRadius}km radius)`);
    
    const mockFlights = [
        'AC123', 'UA456', 'DL789', 'AA321', 'WS654', 'F9987',
        'B6123', 'NK456', 'AS789', 'HA321', 'SY654', 'G4987'
    ];
    
 
    function updateFlight() {
        // Mock flight selection
        const flight = mockFlights[Math.floor(Math.random() * mockFlights.length)];
        splitflapDevice.setText(flight);
        
        // Update flight info panel
        const flightInfo = document.getElementById('flightInfo');
        flightInfo.style.display = 'block';
        flightInfo.innerHTML = `
            <h4>Current Flight: ${flight}</h4>
            <p>Distance: ${Math.floor(Math.random() * parseInt(flightRadius))}km</p>
            <p>Altitude: ${Math.floor(Math.random() * 40000 + 5000)}ft</p>
            <p>Speed: ${Math.floor(Math.random() * 200 + 300)}mph</p>
        `;
        
        log(`Displaying flight: ${flight}`);
    }
    
    updateFlight();
    flightInterval = setInterval(updateFlight, 30000); // Update every 30 seconds
}

function stopFlightTracking() {
    if (flightInterval) {
        clearInterval(flightInterval);
        flightInterval = null;
        document.getElementById('flightInfo').style.display = 'none';
        log('Flight tracking stopped');
    }
}

// Calibration functions
function calibrateModule(index) {
    if (!splitflapDevice || !splitflapDevice.isConnected) {
        log('Device not connected', 'error');
        return;
    }
    splitflapDevice.calibrateModule(index);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize
    updateModulePreview();
    updateConnectionStatus();
    
    // Mode tabs
    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.addEventListener('click', () => switchMode(tab.dataset.mode));
    });
    
    // Connection buttons
    document.getElementById('connectWiFi').addEventListener('click', async () => {
        const address = document.getElementById('esp32IP').value.trim();
        if (!address) {
            log('Please enter ESP32 IP address or URL', 'error');
            return;
        }
        
        try {
            splitflapDevice = new SplitflapHTTP(address);
            const connected = await splitflapDevice.connect();
            if (connected) {
                isConnectedToDevice = true;
                numModules = splitflapDevice.getNumModules();
                updateConnectionStatus();
                updateModulePreview();
            }
        } catch (error) {
            log(`Connection failed: ${error.message}`, 'error');
        }
    });
    
    document.getElementById('connectFirebase').addEventListener('click', () => {
        const config = document.getElementById('firebaseConfig').value;
        initFirebase(config);
    });
    
    // Manual mode
    document.getElementById('sendText').addEventListener('click', () => {
        const text = document.getElementById('customText').value;
        if (splitflapDevice && splitflapDevice.isConnected) {
            splitflapDevice.setText(text);
        } else {
            log('Device not connected', 'error');
        }
    });
    
    document.querySelectorAll('.preset').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.dataset.text;
            if (splitflapDevice && splitflapDevice.isConnected) {
                splitflapDevice.setText(text);
                document.getElementById('customText').value = text;
            } else {
                log('Device not connected', 'error');
            }
        });
    });
    
    // Time mode
    document.getElementById('startTimeDisplay').addEventListener('click', () => startTimeDisplay());
    document.getElementById('stopTimeDisplay').addEventListener('click', () => stopTimeDisplay());
    
    // Flight mode
    document.getElementById('startFlightTracking').addEventListener('click', () => startFlightTracking());
    document.getElementById('stopFlightTracking').addEventListener('click', () => stopFlightTracking());
    
    // Calibration
    document.getElementById('homeAll').addEventListener('click', () => {
        if (splitflapDevice && splitflapDevice.isConnected) {
            splitflapDevice.homeAllModules();
        } else {
            log('Device not connected', 'error');
        }
    });
    
    document.getElementById('calibrateAll').addEventListener('click', () => {
        if (splitflapDevice && splitflapDevice.isConnected) {
            for (let i = 0; i < numModules; i++) {
                setTimeout(() => splitflapDevice.calibrateModule(i), i * 2000);
            }
        } else {
            log('Device not connected', 'error');
        }
    });
    
    document.getElementById('resetAll').addEventListener('click', () => {
        if (splitflapDevice && splitflapDevice.isConnected) {
            splitflapDevice.setText(' '.repeat(numModules));
            log('All modules reset to blank');
        } else {
            log('Device not connected', 'error');
        }
    });
    
    document.getElementById('testCharBtn').addEventListener('click', () => {
        const char = document.getElementById('testChar').value.toUpperCase();
        if (splitflapDevice && splitflapDevice.isConnected && char) {
            splitflapDevice.setText(char.repeat(numModules));
        } else {
            log('Device not connected or invalid character', 'error');
        }
    });
    
    // Remote control
    document.getElementById('enableRemote').addEventListener('click', () => enableRemoteControl());
    document.getElementById('disableRemote').addEventListener('click', () => disableRemoteControl());
    
    document.getElementById('deviceName').addEventListener('input', () => updateRemoteUrl());
    
    // Custom text input - update on Enter key
    document.getElementById('customText').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('sendText').click();
        }
    });
    
    // Check for device parameter in URL for remote control
    const urlParams = new URLSearchParams(window.location.search);
    const deviceParam = urlParams.get('device');
    if (deviceParam) {
        document.getElementById('deviceName').value = deviceParam;
        log(`Remote control mode for device: ${deviceParam}`);
    }
});

// Auto-resize Firebase config textarea
document.getElementById('firebaseConfig').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

// Handle visibility change to update remote status
document.addEventListener('visibilitychange', () => {
    if (remoteEnabled && isConnectedToFirebase) {
        const deviceName = document.getElementById('deviceName').value;
        if (deviceName && firebaseDB) {
            firebaseDB.ref(`devices/${deviceName}/status/lastSeen`).set(
                firebase.database.ServerValue.TIMESTAMP
            );
        }
    }
});