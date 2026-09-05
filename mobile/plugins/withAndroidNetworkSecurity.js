const fs = require('fs');
const path = require('path');
const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');

const getNetworkSecurityXml = (allowCleartext) => `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="${allowCleartext}">
    <trust-anchors>
      <certificates src="system" />
      <certificates src="user" />
    </trust-anchors>
  </base-config>
  <domain-config cleartextTrafficPermitted="${allowCleartext}">
    <domain includeSubdomains="true">184.73.111.59</domain>
  </domain-config>
</network-security-config>
`;

const withAndroidNetworkSecurity = (config) => {
  const allowCleartext = process.env.EXPO_PUBLIC_ALLOW_CLEARTEXT === 'true';

  config = withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;
    const application = manifest.application?.[0];

    if (application) {
      application.$['android:usesCleartextTraffic'] = allowCleartext ? 'true' : 'false';
      application.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    }

    const permissions = manifest['uses-permission'] || [];
    const hasInternetPermission = permissions.some(
      (permission) => permission.$?.['android:name'] === 'android.permission.INTERNET'
    );

    if (!hasInternetPermission) {
      permissions.push({ $: { 'android:name': 'android.permission.INTERNET' } });
      manifest['uses-permission'] = permissions;
    }

    return modConfig;
  });

  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const xmlDir = path.join(modConfig.modRequest.platformProjectRoot, 'app/src/main/res/xml');
      const xmlPath = path.join(xmlDir, 'network_security_config.xml');

      await fs.promises.mkdir(xmlDir, { recursive: true });
      await fs.promises.writeFile(xmlPath, getNetworkSecurityXml(allowCleartext ? 'true' : 'false'));

      return modConfig;
    },
  ]);
};

module.exports = withAndroidNetworkSecurity;
