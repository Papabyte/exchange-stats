const testnet = true;

exports.testnet = testnet;
exports.aa_address = testnet ? "I4RRJ3RNGFLYM4TASWTJQTZAMPCMTFTD" : "";
exports.min_reward_gb = 0.1;
exports.challenge_period_in_days = testnet ? 1/24 : 3;
exports.challenge_min_stake_gb = 0.001;
exports.challenge_coeff = 1.5;
exports.gb_to_bytes = 1000000000;
exports.website_name = "Counterstats.org";
exports.blacklisted_domains = ['coinmarketcap.com', 'https://coingecko.com/'];
exports.github ='https://github.com/Papabyte/counterstats/';
