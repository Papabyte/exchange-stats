const testnet = true;

exports.testnet = testnet;
exports.aa_address = testnet ? "RZ5NSJU2RVFGDBCZ5ZDXTR42JLM3DBJD" : "";
exports.minReward = 10000;
exports.challenge_period_length = testnet ? 3600 : 3*24*3600;
exports.challenge_min_stake = 0.001;
exports.challenge_coef = 1.5;
