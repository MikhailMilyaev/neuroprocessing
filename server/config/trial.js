const TRIAL_DAYS = Number(process.env.TRIAL_DAYS ?? 3);
const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
module.exports = { TRIAL_DAYS, addDays };