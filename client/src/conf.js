const testnet = true;

exports.testnet = testnet;
exports.aa_address = testnet ? "WCJTF75XNHGYK2QF7FG4VHXJX57S6U35" : "";
exports.minReward = 10000;
exports.challenge_period_length = testnet ? 3600 : 3*24*3600;
exports.challenge_min_stake = 0.001;
exports.challenge_coef = 1.5;
