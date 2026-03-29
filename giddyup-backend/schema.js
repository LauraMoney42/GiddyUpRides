// giddyup-backend — schema.js
// gu-002: Firestore collection schema definitions + helper factories.
// These define the shape of every document — used by backend routes and
// shared as reference for client apps.

// ── COLLECTION: users ──────────────────────────────────────────────────────
// Stores both riders and drivers. Role field gates access.
//
// /users/{uid}
const userSchema = {
  uid:         String,   // Firebase Auth UID
  name:        String,
  email:       String,
  phone:       String,
  role:        String,   // 'rider' | 'driver' | 'admin'
  photoUrl:    String,
  createdAt:   Date,
  updatedAt:   Date,
};

// ── COLLECTION: drivers ────────────────────────────────────────────────────
// Driver profile, approval status, vehicle info, live location.
//
// /drivers/{uid}
const driverSchema = {
  uid:             String,   // matches /users/{uid}
  status:          String,   // 'pending' | 'approved' | 'rejected' | 'suspended'
  isOnline:        Boolean,
  currentLocation: {         // GeoPoint — updated every ~5s when online
    lat: Number,
    lng: Number,
  },
  vehicle: {
    make:    String,
    model:   String,
    year:    Number,
    color:   String,
    plate:   String,
  },
  license: {
    number:    String,
    expiresAt: Date,
    verified:  Boolean,
  },
  rating:        Number,   // average 1-5, updated after each ride
  totalRides:    Number,
  approvedAt:    Date,
  approvedBy:    String,   // admin uid
  rejectedReason: String,
  createdAt:     Date,
  updatedAt:     Date,
};

// ── COLLECTION: rides ──────────────────────────────────────────────────────
// A ride request from booking through completion.
//
// /rides/{rideId}
const rideSchema = {
  id:          String,   // Firestore auto-ID
  riderId:     String,   // /users/{uid}
  driverId:    String,   // /drivers/{uid} — null until matched
  status:      String,   // 'requested' | 'accepted' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled'
  pickup: {
    address:   String,
    lat:       Number,
    lng:       Number,
  },
  dropoff: {
    address:   String,
    lat:       Number,
    lng:       Number,
  },
  estimatedFare:  Number,
  finalFare:      Number,
  distanceKm:     Number,
  durationMin:    Number,
  riderRating:    Number,   // rider rates driver (1-5)
  driverRating:   Number,   // driver rates rider (1-5)
  cancelReason:   String,
  requestedAt:    Date,
  acceptedAt:     Date,
  pickedUpAt:     Date,
  completedAt:    Date,
  cancelledAt:    Date,
};

// ── COLLECTION: driverLocations ────────────────────────────────────────────
// Separate high-write collection for real-time location updates.
// Keeps rides collection clean — locations update every 5s when driver online.
//
// /driverLocations/{uid}
const driverLocationSchema = {
  uid:       String,
  lat:       Number,
  lng:       Number,
  heading:   Number,   // degrees 0-360
  speed:     Number,   // km/h
  updatedAt: Date,
};

// ── FACTORY HELPERS ────────────────────────────────────────────────────────

function newRide({ riderId, pickup, dropoff, estimatedFare }) {
  return {
    riderId,
    driverId: null,
    status: 'requested',
    pickup,
    dropoff,
    estimatedFare,
    finalFare: null,
    distanceKm: null,
    durationMin: null,
    riderRating: null,
    driverRating: null,
    cancelReason: null,
    requestedAt: new Date(),
    acceptedAt: null,
    pickedUpAt: null,
    completedAt: null,
    cancelledAt: null,
  };
}

function newDriver({ uid, vehicle, license }) {
  return {
    uid,
    status: 'pending',
    isOnline: false,
    currentLocation: null,
    vehicle,
    license,
    rating: 0,
    totalRides: 0,
    approvedAt: null,
    approvedBy: null,
    rejectedReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

module.exports = {
  userSchema,
  driverSchema,
  rideSchema,
  driverLocationSchema,
  newRide,
  newDriver,
};
