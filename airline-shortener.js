// airline-shortener.js
// Airline code shortener for 6-character splitflap display

// Mapping of ICAO codes to shorter display codes
const AIRLINE_CODE_MAPPING = {
    // Your specified common ones
    'ENY': 'MQ',     // Envoy Air -> American (regional)
    'DAL': 'DL',     // Delta Air Lines -> DA
    'AAL': 'AA',     // American Airlines -> AA
    'UAL': 'UA',     // United Airlines -> UA
    'SWA': 'WN',     // Southwest Airlines -> WN
    'FLE': 'F8',     // Flair Airlines -> F8
    'WJA': 'WS',     // WestJet -> WS
    'ROU': 'RV',     // Air Canada Rouge -> RV
    'RPA': 'YX',     // Republic Airways -> UA (United Express)
    'ASH': 'YV',     // Mesa Airlines -> UA (United Express)
    'PTR': 'PD',     // Porter Airlines -> P3
    'CHAL': 'CL',    // Chalks -> CL
    'CRQ': 'YN',     // Air Creebec -> YN
    'HYD': '0Q',     // Not found in list, keeping as specified
    'NRL': 'N5',     // Nolinor Aviation -> N5
    'FDX': 'FX',     // FedEx -> FX
    'NKS': 'NK',     // Spirit Airlines -> NK
    'JZA': 'QK',     // Air Canada Jazz -> AC
    'ACA': 'AC',     // Air Canada -> AC
    'NDL': 'MB',     // Not clear mapping, keeping as specified
    'JBU': 'B6',     // JetBlue -> B6
    'MXY': 'MX',     // Breeze Airways -> MX
    'HAL': 'HA',     // Hawaiian Airlines -> HA
    'SKW': 'OO',     // SkyWest -> OO
    'EDV': '9E',     // Endeavor Air -> DL (Delta Connection)
    'JIA': 'OH',     // PSA Airlines -> AA (American Eagle)
    'QXE': 'QX',     // Horizon Air -> AS (Alaska)
    'CPA': 'CX',     // Cathay Pacific -> CX
    'CSB': '2I',     // Not found, keeping as specified
    
    // Additional common ICAO to IATA mappings from the document
    'AFR': 'AF',     // Air France
    'BAW': 'BA',     // British Airways
    'DLH': 'LH',     // Lufthansa
    'KLM': 'KL',     // KLM
    'UAE': 'EK',     // Emirates
    'QTR': 'QR',     // Qatar Airways
    'ETD': 'EY',     // Etihad
    'SIA': 'SQ',     // Singapore Airlines
    'THY': 'TK',     // Turkish Airlines
    'ANA': 'NH',     // All Nippon Airways
    'JAL': 'JL',     // Japan Airlines
    'CCA': 'CA',     // Air China
    'CES': 'MU',     // China Eastern
    'CSN': 'CZ',     // China Southern
    'SAS': 'SK',     // Scandinavian Airlines
    'FIN': 'AY',     // Finnair
    'TAP': 'TP',     // TAP Portugal
    'IBE': 'IB',     // Iberia
    'VIR': 'VS',     // Virgin Atlantic
    'ICE': 'FI',     // Icelandair
    'EIN': 'EI',     // Aer Lingus
    'SWR': 'LX',     // Swiss International
    'AUA': 'OS',     // Austrian Airlines
    'BEL': 'SN',     // Brussels Airlines
    'KAL': 'KE',     // Korean Air
    'AAR': 'OZ',     // Asiana Airlines
    'THA': 'TG',     // Thai Airways
    'MAS': 'MH',     // Malaysia Airlines
    'QFA': 'QF',     // Qantas
    'ANZ': 'NZ',     // Air New Zealand
    'SAA': 'SA',     // South African Airways
    'ETH': 'ET',     // Ethiopian Airlines
    'MSR': 'MS',     // Egyptair
    'RAM': 'AT',     // Royal Air Maroc
    'MEA': 'ME',     // Middle East Airlines
    'RJA': 'RJ',     // Royal Jordanian
    'SVA': 'SV',     // Saudia
    'GFA': 'GF',     // Gulf Air
    'OMA': 'WY',     // Oman Air
    'QNZ': 'QF',     // Jetconnect (Qantas)
    'VLM': 'VG',     // VLM Airlines
    'REP': 'YX',     // Republic Airways
    'GWI': '4U',     // Germanwings
    'EWG': 'EW',     // Eurowings
    'VLG': 'VY',     // Vueling
    'EZY': 'U2',     // easyJet
    'RYR': 'FR',     // Ryanair
    'WZZ': 'W6',     // Wizz Air
    'VOE': 'V7',     // Volotea
    'EJU': 'EC',     // easyJet Europe
    'BEE': 'BE',     // Flybe
    'LOG': 'LM',     // Loganair
    'SHT': 'BA',     // BA Shuttle
};

/**
 * Formats airline callsign for 6-character splitflap display
 * @param {string} callsign - The airline callsign (ICAO format expected)
 * @returns {string} - Formatted 6-character string for display
 */
function formatAirlineForDisplay(callsign) {
    if (!callsign || typeof callsign !== 'string') {
        return '      '; // 6 spaces for empty/invalid input
    }
    
    // Clean the input - remove any non-alphanumeric characters and convert to uppercase
    let cleaned = callsign.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Check if we have a mapping for this ICAO code
    if (AIRLINE_CODE_MAPPING[cleaned]) {
        cleaned = AIRLINE_CODE_MAPPING[cleaned];
    }
    
    // Ensure exactly 6 characters
    if (cleaned.length > 6) {
        // If too long, take the first 6 characters
        cleaned = cleaned.substring(0, 6);
    } else if (cleaned.length < 6) {
        // If too short, pad with spaces at the end
        cleaned = cleaned.padEnd(6, ' ');
    }
    
    return cleaned;
}

/**
 * Get the short airline code for display
 * @param {string} callsign - The airline callsign
 * @returns {string} - The short code or original if no mapping exists
 */
function getShortAirlineCode(callsign) {
    if (!callsign || typeof callsign !== 'string') {
        return '';
    }
    
    const cleaned = callsign.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return AIRLINE_CODE_MAPPING[cleaned] || cleaned;
}

/**
 * Check if an airline code has a shorter mapping
 * @param {string} callsign - The airline callsign
 * @returns {boolean} - True if a mapping exists
 */
function hasShortMapping(callsign) {
    if (!callsign || typeof callsign !== 'string') {
        return false;
    }
    
    const cleaned = callsign.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return AIRLINE_CODE_MAPPING.hasOwnProperty(cleaned);
}

/**
 * Add or update an airline code mapping
 * @param {string} icaoCode - The ICAO code
 * @param {string} shortCode - The short code for display
 */
function addAirlineMapping(icaoCode, shortCode) {
    if (icaoCode && shortCode) {
        AIRLINE_CODE_MAPPING[icaoCode.toUpperCase()] = shortCode.toUpperCase();
    }
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        formatAirlineForDisplay,
        getShortAirlineCode,
        hasShortMapping,
        addAirlineMapping,
        AIRLINE_CODE_MAPPING
    };
}

// Make functions globally available for browser environment
if (typeof window !== 'undefined') {
    window.AirlineShortener = {
        formatAirlineForDisplay,
        getShortAirlineCode,
        hasShortMapping,
        addAirlineMapping,
        AIRLINE_CODE_MAPPING
    };
}