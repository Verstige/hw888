// Amadeus live flight search wrapper with smart-mock fallback.
// Set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in Railway env to enable live data.
// Without keys, falls back to a great-circle distance estimator using airline base rates.

export type FlightOffer = {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber?: string;
  originCode: string;
  destinationCode: string;
  departureDate: string; // ISO
  arrivalDate: string;   // ISO
  durationMinutes: number;
  price: number;
  currency: string;
  stops: number;
  bookingUrl: string;
  source: "amadeus" | "mock";
};

const AIRLINES: Record<string, { name: string; baseRate: number; bookingUrl: (from: string, to: string, date: string) => string }> = {
  FRONTIER: { name: "Frontier Airlines", baseRate: 0.16, bookingUrl: (f, t, d) => `https://www.flyfrontier.com/flight-search?from=${f}&to=${t}&date=${d}` },
  SOUTHWEST: { name: "Southwest Airlines", baseRate: 0.18, bookingUrl: (f, t, d) => `https://www.southwest.com/air/booking/select.html?departureDate=${d}&destinationAirportCode=${t}&originationAirportCode=${f}&tripType=oneway&adultPassengersCount=1&fareType=USD` },
  DELTA: { name: "Delta Air Lines", baseRate: 0.22, bookingUrl: (f, t, d) => `https://www.delta.com/flight-search/book?tripType=ONE_WAY&fromCity=${f}&toCity=${t}&departDate=${d}` },
  UNITED: { name: "United Airlines", baseRate: 0.22, bookingUrl: (f, t, d) => `https://www.united.com/en/us/fsr/flight-search/book?f=OneWay&from=${f}&to=${t}&d=${d}` },
  AMERICAN: { name: "American Airlines", baseRate: 0.21, bookingUrl: (f, t, d) => `https://www.aa.com/booking/find?tripType=oneWay&from=${f}&to=${t}&departDate=${d}` },
  SPIRIT: { name: "Spirit Airlines", baseRate: 0.13, bookingUrl: (f, t, d) => `https://www.spirit.com/book/?o1=${f}&d1=${t}&dd1=${d}` },
  ALASKA: { name: "Alaska Airlines", baseRate: 0.23, bookingUrl: (f, t, d) => `https://www.alaskaair.com/shopping/flights?From=${f}&To=${t}&Depart=${d}` },
};

// Major US airport coordinates (lat, lon) for great-circle distance estimation
const AIRPORTS: Record<string, { lat: number; lon: number; name: string; city: string; state: string }> = {
  ATL: { lat: 33.6407, lon: -84.4277, name: "Hartsfield-Jackson", city: "Atlanta", state: "GA" },
  AUS: { lat: 30.1975, lon: -97.6664, name: "Austin-Bergstrom", city: "Austin", state: "TX" },
  BNA: { lat: 36.1245, lon: -86.6782, name: "Nashville International", city: "Nashville", state: "TN" },
  BOS: { lat: 42.3656, lon: -71.0096, name: "Logan International", city: "Boston", state: "MA" },
  BWI: { lat: 39.1754, lon: -76.6684, name: "Baltimore-Washington", city: "Baltimore", state: "MD" },
  CLT: { lat: 35.2144, lon: -80.9473, name: "Charlotte Douglas", city: "Charlotte", state: "NC" },
  DAL: { lat: 32.8471, lon: -96.8518, name: "Dallas Love Field", city: "Dallas", state: "TX" },
  DCA: { lat: 38.8512, lon: -77.0402, name: "Reagan National", city: "Washington", state: "DC" },
  DEN: { lat: 39.8561, lon: -104.6737, name: "Denver International", city: "Denver", state: "CO" },
  DFW: { lat: 32.8998, lon: -97.0403, name: "Dallas/Fort Worth", city: "Dallas", state: "TX" },
  DTW: { lat: 42.2162, lon: -83.3554, name: "Detroit Metropolitan", city: "Detroit", state: "MI" },
  EWR: { lat: 40.6895, lon: -74.1745, name: "Newark Liberty", city: "Newark", state: "NJ" },
  FLL: { lat: 26.0726, lon: -80.1527, name: "Fort Lauderdale-Hollywood", city: "Fort Lauderdale", state: "FL" },
  IAD: { lat: 38.9531, lon: -77.4565, name: "Washington Dulles", city: "Washington", state: "DC" },
  IAH: { lat: 29.9902, lon: -95.3368, name: "George Bush Intercontinental", city: "Houston", state: "TX" },
  JAX: { lat: 30.4941, lon: -81.6879, name: "Jacksonville International", city: "Jacksonville", state: "FL" },
  JFK: { lat: 40.6413, lon: -73.7781, name: "John F. Kennedy International", city: "New York", state: "NY" },
  LAS: { lat: 36.0840, lon: -115.1537, name: "Harry Reid International", city: "Las Vegas", state: "NV" },
  LAX: { lat: 33.9416, lon: -118.4085, name: "Los Angeles International", city: "Los Angeles", state: "CA" },
  LGA: { lat: 40.7769, lon: -73.8740, name: "LaGuardia", city: "New York", state: "NY" },
  MCO: { lat: 28.4312, lon: -81.3081, name: "Orlando International", city: "Orlando", state: "FL" },
  MDW: { lat: 41.7868, lon: -87.7522, name: "Chicago Midway", city: "Chicago", state: "IL" },
  MEM: { lat: 35.0424, lon: -89.9767, name: "Memphis International", city: "Memphis", state: "TN" },
  MIA: { lat: 25.7959, lon: -80.2870, name: "Miami International", city: "Miami", state: "FL" },
  MSP: { lat: 44.8848, lon: -93.2223, name: "Minneapolis-St. Paul", city: "Minneapolis", state: "MN" },
  MYR: { lat: 33.6797, lon: -78.9283, name: "Myrtle Beach International", city: "Myrtle Beach", state: "SC" },
  OGG: { lat: 20.8988, lon: -156.4305, name: "Kahului", city: "Maui", state: "HI" },
  ORD: { lat: 41.9742, lon: -87.9073, name: "O'Hare International", city: "Chicago", state: "IL" },
  PDX: { lat: 45.5898, lon: -122.5951, name: "Portland International", city: "Portland", state: "OR" },
  PHL: { lat: 39.8744, lon: -75.2424, name: "Philadelphia International", city: "Philadelphia", state: "PA" },
  PHX: { lat: 33.4342, lon: -112.0116, name: "Phoenix Sky Harbor", city: "Phoenix", state: "AZ" },
  PIT: { lat: 40.4914, lon: -80.2329, name: "Pittsburgh International", city: "Pittsburgh", state: "PA" },
  RDU: { lat: 35.8801, lon: -78.7880, name: "Raleigh-Durham", city: "Raleigh", state: "NC" },
  SAN: { lat: 32.7338, lon: -117.1933, name: "San Diego International", city: "San Diego", state: "CA" },
  SAT: { lat: 29.5337, lon: -98.4698, name: "San Antonio International", city: "San Antonio", state: "TX" },
  SDF: { lat: 38.1744, lon: -85.7364, name: "Louisville Muhammad Ali", city: "Louisville", state: "KY" },
  SEA: { lat: 47.4502, lon: -122.3088, name: "Seattle-Tacoma", city: "Seattle", state: "WA" },
  SFO: { lat: 37.6213, lon: -122.3790, name: "San Francisco International", city: "San Francisco", state: "CA" },
  SJC: { lat: 37.3639, lon: -121.9289, name: "Norman Y. Mineta San José", city: "San Jose", state: "CA" },
  SLC: { lat: 40.7899, lon: -111.9791, name: "Salt Lake City International", city: "Salt Lake City", state: "UT" },
  SMF: { lat: 38.6951, lon: -121.5908, name: "Sacramento International", city: "Sacramento", state: "CA" },
  SNA: { lat: 33.6757, lon: -117.8682, name: "John Wayne", city: "Santa Ana", state: "CA" },
  STL: { lat: 38.7487, lon: -90.3700, name: "St. Louis Lambert", city: "St. Louis", state: "MO" },
  TPA: { lat: 27.9755, lon: -82.5332, name: "Tampa International", city: "Tampa", state: "FL" },
  RAP: { lat: 44.0453, lon: -103.0573, name: "Rapid City Regional", city: "Rapid City", state: "SD" },
};

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function listAirports(): { code: string; name: string; city: string; state: string }[] {
  return Object.entries(AIRPORTS).map(([code, a]) => ({ code, name: a.name, city: a.city, state: a.state })).sort((x, y) => x.city.localeCompare(y.city));
}

export function getAirport(code: string) {
  return AIRPORTS[code.toUpperCase()];
}

export function listUSStates(): { code: string; name: string }[] {
  return [
    { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
    { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
    { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
    { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
    { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
    { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
    { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
    { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
    { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
    { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
    { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
    { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
    { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
    { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
    { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
    { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
    { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
  ];
}

// Smart mock: estimate one-way price using distance + airline base rate
function estimateFlight(originCode: string, destinationCode: string, date: string, airlineCode: string): FlightOffer | null {
  const origin = AIRPORTS[originCode.toUpperCase()];
  const dest = AIRPORTS[destinationCode.toUpperCase()];
  if (!origin || !dest || !AIRLINES[airlineCode]) return null;

  const miles = haversineMiles(origin.lat, origin.lon, dest.lat, dest.lon);
  const baseRate = AIRLINES[airlineCode].baseRate;
  // Distance cost curve: base fare + per-mile cost
  const baseFare = 49;
  const perMile = 0.15;
  const estimate = Math.round(baseFare + miles * perMile);
  // Apply airline modifier (Frontier/Spirit ~10% cheaper than delta estimate)
  const price = Math.round(estimate * (baseRate / 0.18));

  // Approximate duration: 500 mph average + 30 min ground/takeoff
  const durationMinutes = Math.round((miles / 500) * 60 + 30);

  // Departure/arrival timestamps
  const departure = new Date(`${date}T08:00:00`);
  const arrival = new Date(departure.getTime() + durationMinutes * 60 * 1000);

  return {
    id: `mock-${airlineCode}-${originCode}-${destinationCode}-${date}`,
    airline: AIRLINES[airlineCode].name,
    airlineCode,
    originCode: originCode.toUpperCase(),
    destinationCode: destinationCode.toUpperCase(),
    departureDate: departure.toISOString(),
    arrivalDate: arrival.toISOString(),
    durationMinutes,
    price,
    currency: "USD",
    stops: miles > 1500 ? 1 : 0,
    bookingUrl: AIRLINES[airlineCode].bookingUrl(originCode.toUpperCase(), destinationCode.toUpperCase(), date),
    source: "mock",
  };
}

// Generate mock offers across all supported airlines
export function generateMockOffers(originCode: string, destinationCode: string, date: string): FlightOffer[] {
  const offers: FlightOffer[] = [];
  for (const code of Object.keys(AIRLINES)) {
    const offer = estimateFlight(originCode, destinationCode, date, code);
    if (offer) offers.push(offer);
  }
  return offers.sort((a, b) => a.price - b.price);
}

// Amadeus live search — only invoked if env vars present
async function searchAmadeusLive(originCode: string, destinationCode: string, date: string): Promise<FlightOffer[] | null> {
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    // Get OAuth2 token
    const tokenRes = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-www-form-urlencoded" as any },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    if (!tokenRes.ok) return null;
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;
    if (!token) return null;

    // Search flights
    const searchRes = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${originCode}&destinationLocationCode=${destinationCode}&departureDate=${date}&adults=1&currencyCode=USD&max=20`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!searchRes.ok) return null;
    const data = await searchRes.json();
    const offers: FlightOffer[] = [];
    for (const o of (data.data || []).slice(0, 20)) {
      const seg = o.itineraries[0].segments[0];
      const durationMin = parseDuration(o.itineraries[0].duration);
      offers.push({
        id: o.id,
        airline: seg.carrierCode,
        airlineCode: seg.carrierCode,
        flightNumber: `${seg.carrierCode}${seg.number}`,
        originCode: seg.departure.iataCode,
        destinationCode: seg.arrival.iataCode,
        departureDate: seg.departure.at,
        arrivalDate: seg.arrival.at,
        durationMinutes: durationMin,
        price: parseFloat(o.price.total),
        currency: o.price.currency,
        stops: o.itineraries[0].segments.length - 1,
        bookingUrl: `https://www.google.com/search?q=${seg.carrierCode}+${seg.number}+${seg.departure.iataCode}+to+${seg.arrival.iataCode}+${date}`,
        source: "amadeus",
      });
    }
    return offers;
  } catch {
    return null;
  }
}

function parseDuration(dur: string): number {
  // ISO 8601 duration: PT2H30M
  const m = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return 0;
  return (parseInt(m[1] || "0") * 60) + parseInt(m[2] || "0");
}

// Main search function: tries Amadeus first, falls back to mock
export async function searchFlights(originCode: string, destinationCode: string, date: string): Promise<{ offers: FlightOffer[]; source: "amadeus" | "mock"; liveAvailable: boolean }> {
  originCode = originCode.toUpperCase();
  destinationCode = destinationCode.toUpperCase();

  const live = await searchAmadeusLive(originCode, destinationCode, date);
  if (live && live.length > 0) {
    return { offers: live, source: "amadeus", liveAvailable: true };
  }

  const mock = generateMockOffers(originCode, destinationCode, date);
  return { offers: mock, source: "mock", liveAvailable: false };
}
