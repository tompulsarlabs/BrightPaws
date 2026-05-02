import { Image, StyleSheet, Text, View } from 'react-native';
import type { AssetRef } from '../../content/v0';

interface Props {
  asset: AssetRef;
  /** logical pixel size of the inner art area. */
  size: number;
}

/**
 * Renders an AssetRef. Centralised so swapping emoji → real PNG is a
 * one-line edit in content/v0.ts.
 */
export function AssetView({ asset, size }: Props) {
  switch (asset.type) {
    case 'emoji':
      return (
        <Text style={[styles.emoji, { fontSize: size * 0.78, lineHeight: size }]}>
          {asset.value}
        </Text>
      );
    case 'image':
      return (
        <Image
          source={asset.source}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      );
    case 'placeholder':
      return (
        <View
          style={[
            styles.placeholder,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: asset.bg,
            },
          ]}
        >
          <Text
            style={[
              styles.placeholderLabel,
              { color: asset.fg ?? '#1F1F1F', fontSize: size * 0.22 },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {asset.label}
          </Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  emoji: { textAlign: 'center' },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderLabel: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
