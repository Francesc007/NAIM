const { withStringsXml, AndroidConfig } = require('@expo/config-plugins');

const UCROP_STRINGS = [
  { name: 'ucrop_label_edit_photo', value: 'Recortar' },
  { name: 'ucrop_crop', value: 'Recortar' },
  { name: 'ucrop_rotate', value: 'Rotar' },
  { name: 'ucrop_scale', value: 'Escala' },
  { name: 'ucrop_label_original', value: 'Original' },
  { name: 'ucrop_menu_crop', value: 'Recortar' },
];

/** Traduce la UI de recorte de expo-image-picker (uCrop) al español en Android. */
function withSpanishUcropStrings(config) {
  return withStringsXml(config, (config) => {
    const items = UCROP_STRINGS.map(({ name, value }) =>
      AndroidConfig.Resources.buildResourceItem({ name, value })
    );
    config.modResults = AndroidConfig.Strings.setStringItem(items, config.modResults);
    return config;
  });
}

module.exports = withSpanishUcropStrings;
