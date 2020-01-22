const testnet = true;

exports.testnet = testnet;
exports.aa_address = testnet ? "2UU2LUBATWTLBXEQQ2EUJDX2FBDBQ66R" : "";
exports.challenge_period_in_days = testnet ? 1/24 : 3;
exports.challenge_coeff = 1.5;
exports.gb_to_bytes = 1000000000;
exports.website_name = "Counterstats.org - testnet beta";
exports.blacklisted_domains = ['coinmarketcap.com', 'https://coingecko.com/'];
exports.github ='https://github.com/Papabyte/counterstats/';
