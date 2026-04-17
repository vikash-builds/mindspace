const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// Use the Clerk middleware to require authentication on routes
module.exports = ClerkExpressRequireAuth({
  // Any options here
});
