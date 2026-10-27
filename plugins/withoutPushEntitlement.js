// expo-notifications adds the `aps-environment` (push) entitlement. Arise only schedules
// local notifications, and free Apple IDs (Personal Team) can't sign push, so drop it.
const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, cfg => {
    delete cfg.modResults['aps-environment'];
    return cfg;
  });
};
