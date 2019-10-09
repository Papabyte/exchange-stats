const testnet = true;

exports.testnet = testnet;
exports.aa_address = "IA36KBPVNEEXTUPJ4ZFTFJRYZL235QKQ";
exports.minReward = 10000;
exports.challenge_period_length = testnet ? 3600 : 3*24*3600;
exports.challenge_min_stake = 1e6;
exports.challenge_coef = 1.5;
