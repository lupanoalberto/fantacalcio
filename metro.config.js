const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// ✅ Aggiungiamo SOLO il transformer per gli SVG, senza perdere il resto
config.transformer.babelTransformerPath = require.resolve(
  "react-native-svg-transformer"
);

// ✅ Estendiamo le estensioni, non sovrascriviamo l’oggetto resolver
const { assetExts, sourceExts } = config.resolver;

config.resolver.assetExts = assetExts.filter((ext) => ext !== "svg");
config.resolver.sourceExts = [...sourceExts, "svg"];

module.exports = config;
