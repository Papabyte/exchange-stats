const testnet = !!process.env.VUE_APP_TESTNET;

exports.testnet = testnet;
exports.aa_address = testnet ? "2UU2LUBATWTLBXEQQ2EUJDX2FBDBQ66R" : "";
exports.challenge_period_in_days = testnet ? 1/24 : 3;
exports.challenge_coeff = 1.5;
exports.gb_to_bytes = 1000000000;
exports.website_name = testnet ? "Counterstats.org - testnet beta" : "Counterstats.org";
exports.blacklisted_domains = ['coinmarketcap.com', 'https://coingecko.com/'];
exports.github = 'https://github.com/byteball/counterstats/';
exports.protocol =  testnet ? "obyte-tn" : "obyte";